const _ = require('lodash');
const joi = require('joi');
const router = new (require('koa-router'))();

const consts = require('../const');
const responder = require('../middleware/responder');
const categoryRepo = require('../repo/category');
const socialRepo = require('../repo/social');
const validate = require('../middleware/validate');

router.use(responder);

router.get('/categories', async function (ctx) {
	ctx.state.r = await categoryRepo.getAllCategories();
});

router.get('/categories/tags', async function (ctx) {
	ctx.state.r = await categoryRepo.getAllTags();
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

router.get('/social', async function (ctx) {
	ctx.state.r = await socialRepo.getSocialCategories();
});

module.exports = router;
