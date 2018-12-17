const _ = require('lodash');
const joi = require('joi');
const jwt = require('jsonwebtoken');
const router = new (require('koa-router'))();

const auth = require('../middleware/auth');
const consts = require('../const');
const passwordTokenRepo = require('../repo/passwordToken');
const responder = require('../middleware/responder');
const companyRepo = require('../repo/company');
const userRepo = require('../repo/user');
const validate = require('../middleware/validate');

router.use(responder);

router.get('/companies', async function (ctx) {
	ctx.state.r = await companyRepo.getAllCompanies();
});

router.get('/companies/search', async function (ctx) {
	let companyName = ctx.query.name;
	console.log(companyName);
	let tag = ctx.query.tag;
	let category = ctx.query.category;

	ctx.state.r = await companyRepo.getAllCompaniesByParams(companyName, tag, category);
});

router.get('/companies/:id', validate('param', { id: joi.number().integer().positive().required(),
}), async function (ctx) {
	const {id} = ctx.v.param;
	ctx.state.r = await companyRepo.getCompanyById(id);
});

router.put('/companies/:id', validate('param', { id: joi.number().integer().positive().required(),
}), validate('body', {
	email: joi.string().email().optional(),
	address: joi.string().trim().optional(),
	phone: joi.string().trim().optional(),
	zipCode: joi.number().integer().positive().optional(),
	companyName: joi.string().trim().optional(),
	fax: joi.string().trim().optional(),
	info: joi.string().trim().optional(),
	oib: joi.number().integer().positive().optional(),
	categoryId: joi.number().integer().positive(),
}), async function (ctx) {
	console.log('put something here');
	const {id} = ctx.v.param;
	const {address, phone, zipCode, companyName, fax, info, oib, categoryId} = ctx.v.body;

	await companyRepo.updateCompanyById(id, address, phone, zipCode, companyName, fax, info, oib);

	if (categoryId) {
		await userRepo.removeUserCategoryById(id);
		await userRepo.addUserCategoryById(id, categoryId);
	}

	ctx.state.r = await companyRepo.getCompanyById(id);
});

module.exports = router;
