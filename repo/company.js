const _ = require('lodash')
const assert = require('assert')

const consts = require('const')
const error = require('error')
const {db} = require('db')
const {mapper} = require('repo/base')

const map = mapper({
	id: 'user_id',
	email: 'email',
	companyName: 'name',
	picture: 'image_fname',
	info: 'info',
	active: 'active',
	address: 'address',
	phone: 'phone',
	fax: 'fax',
	zip: 'zip_code',
	country: 'country_code',
	createdAt: 'created_at',
})

async function getAllCompanies() {
	return await db.any(`
		SELECT * FROM "company"
		INNER JOIN "user" ON ("company".user_id = "user".id)`)
		.catch(error.db('db.read'))
		.map(map)
}

async function getCompanyById(id) {
	return await db.one(`
		SELECT * FROM "company"
		INNER JOIN "user" ON ("company".user_id = "user".id)
		WHERE "company".user_id = $1
		`, [id])
		.catch(error.QueryResultError, error('user.not_found'))
		.catch(error.db('db.read'))
		.then(map)
}

module.exports = {
	getAllCompanies,
	getCompanyById,
	map
}