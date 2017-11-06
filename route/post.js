const _ = require('lodash')
const joi = require('joi')
const router = new (require('koa-router'))()

const consts = require('const')
const responder = require('middleware/responder')
const postRepo = require('repo/post')
const validate = require('middleware/validate')

router.use(responder)

router.get('/posts', async function (ctx) {
	ctx.state.r = await postRepo.getAllPosts()
})

router.get('/posts/:id', validate('param', {id: joi.number().integer().positive().required(), 
}), async function(ctx) {
	const {id} = ctx.v.param
	ctx.state.r = await postRepo.getPostById(id)
})

router.get('/posts/user/:id', validate('param', {id: joi.number().integer().positive().required(), 
}), async function(ctx) {
	const {id} = ctx.v.param
	ctx.state.r = await postRepo.getPostsByUserId(id)
})

module.exports = router
