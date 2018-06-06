const _ = require('lodash');
const joi = require('joi');
const router = new (require('koa-router'))();

const consts = require('const');
const responder = require('middleware/responder');
const categoryRepo = require('repo/category');
const validate = require('middleware/validate');

router.use(responder);

router.get('/categories', async function (ctx) {
	ctx.state.r = await categoryRepo.getAllCategories();
});

router.post('/categories', validate('body', {
	name: joi.string().trim().required(),
}), async function (ctx) {
	const { name } = ctx.v.body;
	await categoryRepo.createNewCategory(name);

	ctx.state.r = {};
});

router.put('/categories/:id', validate('param', {id: joi.number().integer().positive().required()}),
validate('body', {
	name: joi.string().trim().required(),
}),
async function (ctx) {
	const { id } = ctx.v.param;
	const { name } = ctx.v.body;

	await categoryRepo.updateCategory(id, name);
	ctx.state.r = {};
});

router.delete('/categories/:id', validate('param', {id: joi.number().integer().positive().required()}),
async function (ctx) {
	const { id } = ctx.v.param;

	await categoryRepo.deleteCategory(id);
	ctx.state.r = {};
});

module.exports = router;
