const _ = require('lodash');
const joi = require('joi');
const jwt = require('jsonwebtoken');
const router = new (require('koa-router'))();

const auth = require('middleware/auth');
const consts = require('const');
const passwordTokenRepo = require('repo/passwordToken');
const responder = require('middleware/responder');
const companyRepo = require('repo/company');
const validate = require('middleware/validate');

router.use(responder);

router.get('/companies', async function (ctx) {
	ctx.state.r = await companyRepo.getAllCompanies();
});

router.get('/companies/:id', validate('param', { id: joi.number().integer().positive().required(),
}), async function (ctx) {
	const {id} = ctx.v.param;
	ctx.state.r = await companyRepo.getCompanyById(id);
});

router.put('/companies/:id', validate('param', { id: joi.number().integer().positive().required(),
}), validate('body', {
	address: joi.string().trim().optional(),
	phone: joi.string().trim().optional(),
	zip: joi.string().trim().optional(),
	country: joi.string().trim().optional(),
	companyName: joi.string().trim().optional(),
	fax: joi.string().trim().optional(),
	companyInfo: joi.string().trim().optional(),
	oib: joi.number().integer().positive().optional(),
}), async function (ctx) {
	const {id} = ctx.v.param;
	console.log(id);
	console.log(ctx.v);
	const {address, phone, zip, country, companyName, fax, companyInfo, oib} = ctx.v.body;

	await companyRepo.updateCompanyById(id, address, phone, zip, country, companyName, fax, companyInfo, oib);
	ctx.state.r = await companyRepo.getCompanyById(id);
});

module.exports = router;
