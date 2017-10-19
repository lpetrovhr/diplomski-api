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

module.exports = router
