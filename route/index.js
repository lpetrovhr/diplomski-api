// const joi = require('joi')
const router = new (require('koa-router'))();

const fs = require('fs');
const moment = require('moment');

const responder = require('middleware/responder');
// const validate = require('middleware/validate')

router.use(responder);

router.get('/', async function (ctx) {
	ctx.state.r = {
		message: 'Successful get of the root',
	};
});

module.exports = router;
