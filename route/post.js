const _ = require('lodash');
const joi = require('joi');
const router = new (require('koa-router'))();

const consts = require('const');
const responder = require('middleware/responder');
const postRepo = require('repo/post');
const validate = require('middleware/validate');

router.use(responder);

router.get('/posts', async function (ctx) {
	ctx.state.r = await postRepo.getAllPosts();
});

router.get('/posts/:id', validate('param', {id: joi.number().integer().positive().required(),
}), async function (ctx) {
	const {id} = ctx.v.param;
	ctx.state.r = await postRepo.getPostById(id);
});

router.get('/posts/user/:id', validate('param', {id: joi.number().integer().positive().required(),
}), async function (ctx) {
	const {id} = ctx.v.param;
	ctx.state.r = await postRepo.getPostsByUserId(id);
});

router.post('/posts', validate('body', {
	companyId: joi.number().integer().positive(),
	typeId: joi.number().integer().positive(),
	info: joi.string().trim().optional(),
	startDate: joi.date().required(),
	endDate: joi.date().required(),
	categories: joi.array(),
}), async function (ctx) {
	const { companyId, typeId, info, startDate, endDate, categories } = ctx.v.body;
	const id = await postRepo.createNewPost(companyId, typeId, info, startDate, endDate, categories);
	ctx.state.r = await postRepo.getPostById(id);
});

router.put('/posts/:id', validate('param', {id: joi.number().integer().positive().required()}),
validate('body', {
	typeId: joi.number().integer().positive(),
	info: joi.string().trim().optional(),
	startDate: joi.date().optional(),
	endDate: joi.date().optional(),
}), async function (ctx) {
	const {id} = ctx.v.param;
	console.log(id);
	console.log(ctx.v);

	const {typeId, info, startDate, endDate} = ctx.v.body;

	await postRepo.updatePostById(id, typeId, info, startDate, endDate);
	ctx.state.r = await postRepo.getPostById(id);
});

router.post('/posts/:id/category', validate('param', {id: joi.number().integer().positive().required()}),
validate('body', {
	categoryId: joi.number().integer().positive(),
}), async function (ctx) {
	const { id } = ctx.v.param;
	const { categoryId } = ctx.v.body;

	await postRepo.addPostCategory(id, categoryId);
	ctx.state.r = {};
});

router.delete('/posts/:id/category', validate('param', {id: joi.number().integer().positive().required()}),
validate('body', {
	categoryId: joi.number().integer().positive(),
}), async function (ctx) {
	const { id } = ctx.v.param;
	const { categoryId } = ctx.v.body;

	await postRepo.removePostCategory(id, categoryId);
	ctx.state.r = {};
});

module.exports = router;
