const _ = require('lodash');
const joi = require('joi');
const router = new (require('koa-router'))();

const consts = require('../const');
const responder = require('../middleware/responder');
const postRepo = require('../repo/post');
const validate = require('../middleware/validate');

router.use(responder);

router.get('/posts', async function (ctx) {
	const postData = await postRepo.getAllPosts();
	ctx.state.r = postData;
});

router.get('/posts/types', async function (ctx) {
	ctx.state.r = await postRepo.getAllPostTypes();
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

router.get('/posts/type/:id', validate('param', {id: joi.number().integer().positive().required(),
}), async function (ctx) {
	const {id} = ctx.v.param;
	ctx.state.r = await postRepo.getPostsByTypeId(id);
});

router.post('/posts', validate('body', {
	companyId: joi.number().integer().positive().required(),
	typeId: joi.number().integer().positive().required(),
	info: joi.string().trim().optional().required(),
	startDate: joi.date().required(),
	endDate: joi.date().required(),
	categoryId: joi.number().integer().positive(),
}), async function (ctx) {
	const { companyId, typeId, info, startDate, endDate, categoryId } = ctx.v.body;
	const categories = [];
	categories.push(categoryId);

	const id = await postRepo.createNewPost(companyId, typeId, info, startDate, endDate);
	await postRepo.addPostCategory(id, categoryId);
	ctx.state.r = await postRepo.getPostById(id);
});

router.put('/posts/:id', validate('param', {id: joi.number().integer().positive().required()}),
validate('body', {
	typeId: joi.number().integer().positive(),
	categoryId: joi.number().integer().positive(),
	postInfo: joi.string().trim().optional(),
	startDate: joi.date().optional(),
	endDate: joi.date().optional(),
}), async function (ctx) {
	const {id} = ctx.v.param;

	const {typeId, categoryId, postInfo, startDate, endDate} = ctx.v.body;

	await postRepo.updatePostById(id, typeId, postInfo, startDate, endDate);

	if (categoryId) {
	  await postRepo.removePostCategories(id);
	  await postRepo.addPostCategory(id, categoryId);
	}

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
