const consts = require('const')
const error = require('error')
const {db} = require('db')
const {mapper} = require('repo/base')

const map = mapper({
	id: 'user_id',
	email: 'email',
	firstName: 'first_name',
	lastName: 'last_name',
	cvLink: 'cv_link',
	active: 'active',
	address: 'address',
	phone: 'phone',
	zip: 'zip_code',
	country: 'country_code',
	createdAt: 'created_at',
})

async function getAllStudents() {
	return await db.any(`
		SELECT * FROM "student" 
		INNER JOIN "user" ON ("student".user_id = "user".id)`)
		.catch(error.db('db.read'))
	    .map(map)
}

async function getStudentById(id) {
	return db.one(`
		SELECT * FROM "student"
		INNER JOIN "user" ON ("student".user_id = "user".id)
		WHERE "student".user_id = $1
		`, [id])
		.catch(error.QueryResultError, error('user.not_found'))
		.catch(error.db('db.read'))
		.then(map)
}

module.exports = {
	getAllStudents,
	getStudentById,
	map
}
