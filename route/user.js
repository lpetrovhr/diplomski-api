const _ = require('lodash');
const joi = require('joi');
const jwt = require('jsonwebtoken');
const router = new (require('koa-router'))();

const auth = require('middleware/auth');
const consts = require('const');
const passwordTokenRepo = require('repo/passwordToken');
const responder = require('middleware/responder');
const roleUser = require('middleware/roleUser');
const userRepo = require('repo/user');
const socialRepo = require('repo/social');
const validate = require('middleware/validate');

router.use(responder);

router.post('/register/student', validate('body', {
	email: joi.string().email().required(),
	password: joi.string().min(8).required(),
	address: joi.string().required(),
	zipCode: joi.string().required(),
	countryCode: joi.string().required(),
}), async function (ctx) {
	const {email, password, address, zipCode, countryCode} = ctx.v.body;
	await userRepo.createStudent(email, password, consts.roleUser.student, address, zipCode, countryCode);
	ctx.state.r = await userRepo.getByEmail(email);
});

router.post('/register/company', validate('body', {
	email: joi.string().email().required(),
	password: joi.string().min(8).required(),
	address: joi.string().required(),
	zipCode: joi.string().required(),
	countryCode: joi.string().required(),
	companyName: joi.string().required(),
	oib: joi.string().length(11).required(),
	info: joi.string(),
}), async function (ctx) {
	const {email, password, address, zipCode, countryCode, companyName, oib, info} = ctx.v.body;
	await userRepo.createCompany(email, password, consts.roleUser.company, address, zipCode, countryCode, companyName, oib, info);
	ctx.state.r = await userRepo.getByEmail(email);
});

router.post('/auth', validate('body', {
	email: joi.string().email().required(),
	password: joi.string().required(),
}), async function (ctx) {
	const {email, password} = ctx.v.body;
	const user = await userRepo.getByEmailPassword(email, password);
	const token = jwt.sign({id: user.id}, process.env.JWT_SECRET);
	ctx.state.r = {token};
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

router.get('/user/:id', validate('param', {
	id: joi.number().integer().positive().required(),
}), async function (ctx) {
	const {id} = ctx.v.param;
	ctx.state.r = await userRepo.getById(id);
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
	socialId: joi.number().integer().required(),
	link: joi.string().required(),
}), async function (ctx) {
	const { id } = ctx.v.param;
	const { socialId, link } = ctx.v.body;

	await socialRepo.updateUserSocialById(id, socialId, link);
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

module.exports = router;
