const _ = require('lodash')
const joi = require('joi')
const jwt = require('jsonwebtoken')
const router = new (require('koa-router'))()

const auth = require('middleware/auth')
const consts = require('const')
const passwordTokenRepo = require('repo/passwordToken')
const responder = require('middleware/responder')
const companyRepo = require('repo/company')
const validate = require('middleware/validate')

router.use(responder)

router.get('/companies', async function (ctx) {
	ctx.state.r = {
		message: 'get all companies',
	}
})

module.exports = router