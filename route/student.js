const _ = require('lodash');
const joi = require('joi');
const jwt = require('jsonwebtoken');
const router = new (require('koa-router'))();

const auth = require('../middleware/auth');
const consts = require('../const');
const passwordTokenRepo = require('../repo/passwordToken');
const responder = require('../middleware/responder');
const studentRepo = require('../repo/student');
const userRepo = require('../repo/user');
const validate = require('../middleware/validate');

router.use(responder);

router.get('/students', async function (ctx) {
	ctx.state.r = await studentRepo.getAllStudents();
});

router.get('/students/search', async function (ctx) {
	const name = ctx.query.name;
	let firstName = '';
	let lastName = '';

	if (name !== '') {
		let nameArray = name.split(' ');
		firstName = nameArray[0];
		lastName = nameArray.slice(1, nameArray.length).join(' ');
	}

	let tag = ctx.query.tag;
	let category = ctx.query.category;

	ctx.state.r = await studentRepo.getAllStudentsByParams(firstName, lastName, tag, category);
});

router.get('/students/:id', validate('param', {id: joi.number().integer().positive().required(),
}), async function (ctx) {
	const {id} = ctx.v.param;
	ctx.state.r = await studentRepo.getStudentById(id);
});

router.put('/students/:id', validate('param', { id: joi.number().integer().positive().required(),
}), validate('body', {
	email: joi.string().email().optional(),
	firstName: joi.string().trim().optional(),
	lastName: joi.string().trim().optional(),
	cv: joi.string().trim().optional(),
	categoryId: joi.number().integer().positive(),
}), async function (ctx) {
	const {id} = ctx.v.param;
	const {firstName, lastName, cv, categoryId} = ctx.v.body;

	await studentRepo.updateStudentById(id, firstName, lastName, cv);

	if (categoryId) {
		await userRepo.removeUserCategoryById(id);
		await userRepo.addUserCategoryById(id, categoryId);
	}
	ctx.state.r = await studentRepo.getStudentById(id);
});

module.exports = router;
