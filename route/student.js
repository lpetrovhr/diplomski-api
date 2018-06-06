const _ = require('lodash');
const joi = require('joi');
const jwt = require('jsonwebtoken');
const router = new (require('koa-router'))();

const auth = require('middleware/auth');
const consts = require('const');
const passwordTokenRepo = require('repo/passwordToken');
const responder = require('middleware/responder');
const studentRepo = require('repo/student');
const validate = require('middleware/validate');

router.use(responder);

router.get('/students', async function (ctx) {
	ctx.state.r = await studentRepo.getAllStudents();
});

router.get('/students/:id', validate('param', {id: joi.number().integer().positive().required(),
}), async function (ctx) {
	const {id} = ctx.v.param;
	ctx.state.r = await studentRepo.getStudentById(id);
});

router.put('/students/:id', validate('param', { id: joi.number().integer().positive().required(),
}), validate('body', {
	address: joi.string().trim().optional(),
	phone: joi.string().trim().optional(),
	zip: joi.string().trim().optional(),
	country: joi.string().trim().optional(),
	firstName: joi.string().trim().optional(),
	lastName: joi.string().trim().optional(),
	cv: joi.string().trim().optional(),
}), async function (ctx) {
	const {id} = ctx.v.param;
	console.log(id);
	console.log(ctx.v);
	const {address, phone, zip, country, firstName, lastName, cv} = ctx.v.body;

	await studentRepo.updateStudentById(id, address, phone, zip, country, firstName, lastName, cv);
	ctx.state.r = await studentRepo.getStudentById(id);
});

module.exports = router;
