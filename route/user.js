const _ = require('lodash');
const joi = require('joi');
const path = require('path');
const jwt = require('jsonwebtoken');
const router = new (require('koa-router'))();
var koaBody = require('koa-body')({ multipart: true, formidable: { uploadDir: 'uploads', keepExtensions: true } });

const auth = require('middleware/auth');
const consts = require('const');
const passwordTokenRepo = require('repo/passwordToken');
const responder = require('middleware/responder');
const roleUser = require('middleware/roleUser');
const userRepo = require('repo/user');
const studentRepo = require('repo/student');
const companyRepo = require('repo/company');
const socialRepo = require('repo/social');
const tagsRepo = require('repo/tags');
const validate = require('middleware/validate');
const sendMail = require('middleware/mailer');

router.use(responder);

router.post('/register/student', validate('body', {
	email: joi.string().email().required(),
	password: joi.string().min(8).required(),
	passwordRepeat: joi.string().min(8).required(),
	firstName: joi.string().required(),
	lastName: joi.string().required(),
}), async function (ctx) {
	const {email, password, firstName, lastName} = ctx.v.body;
	await userRepo.createStudent(email, password, consts.roleUser.student, firstName, lastName);
	ctx.state.r = await userRepo.getByEmail(email);
});

router.post('/register/company', validate('body', {
	email: joi.string().email().required(),
	password: joi.string().min(8).required(),
	passwordRepeat: joi.string().min(8).required(),
	address: joi.string().required(),
	companyName: joi.string().required(),
	oib: joi.string().length(11).required(),
	info: joi.string(),
	phone: joi.string(),
}), async function (ctx) {
	const {email, password, address, zipCode, companyName, oib, info, phone} = ctx.v.body;
	await userRepo.createCompany(email, password, address, zipCode, companyName, oib, info, phone);
	ctx.state.r = await userRepo.getByEmail(email);
});

router.post('/auth', validate('body', {
	email: joi.string().email().required(),
	password: joi.string().required(),
}), async function (ctx) {
	const {email, password} = ctx.v.body;
	const user = await userRepo.getByEmailPassword(email, password);

	if (user.role === 0) {
		user.student = await studentRepo.getStudentById(user.id);
	} else if (user.role === 10) {
		user.company = await companyRepo.getCompanyById(user.id);
	}

	const token = jwt.sign({id: user.id}, process.env.JWT_SECRET);
	ctx.state.r = {token, user};
});

router.get('/self', auth, async function (ctx) {
	const {id} = ctx.state.user;
	ctx.state.r = await userRepo.getById(id);
});

router.get('/self/role', auth, async function (ctx) {
	const {id} = ctx.state.user;
	const user = await userRepo.getRoleById(id);
	ctx.state.r = {
		user,
		admin: user >= consts.roleUser.admin,
	};
});

router.get('/users', auth, async function (ctx) {
	const users = await userRepo.getAllUsers();
	ctx.state.r = users;
});

router.get('/user/:id', validate('param', {
	id: joi.number().integer().positive().required(),
}), async function (ctx) {
	const {id} = ctx.v.param;
	const user = await userRepo.getById(id);

	if (user.role === 0) {
		user.student = await studentRepo.getStudentById(user.id);
	} else if (user.role === 10) {
		user.company = await companyRepo.getCompanyById(user.id);
	}
	ctx.state.r = { user };
});

router.get('/user/email/:email', auth, roleUser.gte(consts.roleUser.admin), validate('param', {
	email: joi.string().email().required(),
}), async function (ctx) {
	const {email} = ctx.v.param;
	ctx.state.r = await userRepo.getByEmail(email);
});

router.put('/user/:id/role', auth, roleUser.gte(consts.roleUser.admin), validate('param', {
	id: joi.number().integer().positive().required(),
}), validate('body', {
	role: joi.any().valid(_.values(consts.roleUser)).required(),
}), roleUser.gte('v.body.role'), async function (ctx) {
	const {id} = ctx.v.param;
	const {role} = ctx.v.body;
	await userRepo.setRoleById(id, role);
	ctx.state.r = {};
});

router.post('/passwordtoken', validate('body', {
	email: joi.string().email().required(),
}), async function (ctx) {
	// TODO throttle
	const {email} = ctx.v.body;
	ctx.state.r = await passwordTokenRepo.createByEmail(email);
});

router.post('/passwordchange', validate('body', {
	password: joi.string().min(8).required(),
	token: joi.string().length(32).required(),
}), async function (ctx) {
	const {password, token} = ctx.v.body;
	const id = await passwordTokenRepo.get(token);
	await userRepo.updatePassword(id, password);
	await passwordTokenRepo.remove(id);
	ctx.state.r = {};
});

router.post('/user/:id/social', validate('param', {
	id: joi.number().integer().required(),
}), validate('body', {
	socialId: joi.number().integer().required(),
	link: joi.string().required(),
}), async function (ctx) {
	const { id } = ctx.v.param;
	const { socialId, link } = ctx.v.body;

	await socialRepo.addUserSocial(id, socialId, link);
	ctx.state.r = {};
});

router.put('/user/:id/social', validate('param', {
	id: joi.number().integer().required(),
}), validate('body', {
	socialLinks: joi.array(),
}), async function (ctx) {
	const { id } = ctx.v.param;
	const { socialLinks } = ctx.v.body;

	console.log('array of links', socialLinks);
	await socialRepo.removeUserSocial(id);
	socialLinks.map(socialLink => {
		socialRepo.addUserSocial(id, socialLink.socialId, socialLink.link);
	});
	ctx.state.r = {};
});

router.delete('/user/:id/social', validate('param', {
	id: joi.number().integer().required(),
}), validate('body', {
	socialId: joi.number().integer().required(),
}), async function (ctx) {
	const { id } = ctx.v.param;
	const { socialId } = ctx.v.body;

	await socialRepo.removeUserSocial(id, socialId);
	ctx.state.r = {};
});

router.put('/user/:id/activate', auth, roleUser.gte(consts.roleUser.admin), validate('param', {
	id: joi.number().integer().required(),
}), validate('body', {
	status: joi.boolean(),
}), async function (ctx) {
	const { id } = ctx.v.param;
	const { status } = ctx.v.body;

	await userRepo.userActiveStateUpdate(id, status);

	const subject = status ? 'Vaš korisnički račun je aktiviran' : 'Vaš korisnički račun je privremeno isključen';
	const messageBody = status ? 'Vaš korisnički račun je aktiviran. Možete koristiti naše usluge. Hvala na korištenju.' : 'Vaš korisnički račun je privremeno isključen. Molimo obratite se administratoru našeg sustava za detaljne informacije te daljne upute.';
	sendMail('user@gmail.com', subject, messageBody);

	ctx.state.r = {};
});

router.post('/user/:id/upload', koaBody, validate('param', {
	id: joi.number().integer().required(),
}), async function (ctx) {
	const { id } = ctx.v.param;
	const imagePath = ctx.request.files.image.path;
	console.log(imagePath);
	await userRepo.imageUpload(id, imagePath);
	ctx.state.r = {};
});

router.post('/user/:id/tag', validate('param', {
	id: joi.number().integer().required(),
}), validate('body', {
	tagName: joi.string(),
}), async function (ctx) {
	const { id } = ctx.v.param;
	const { tagName } = ctx.v.body;
	console.log(tagName);
	await tagsRepo.addUserTagById(id, tagName);

	ctx.state.r = {};
});

router.delete('/user/:id/tag/:tagId/remove', validate('param', {
	id: joi.number().integer().required(),
	tagId: joi.number().integer().required(),
}), async function (ctx) {
	const { id, tagId } = ctx.v.param;

	await tagsRepo.removeUserTagById(id, tagId);

	ctx.state.r = {};
});

module.exports = router;
