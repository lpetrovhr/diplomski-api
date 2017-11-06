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
})

const categoriesMapper = mapper({
	id: 'category_id',
	name: 'name',
})

async function getCategoriesByStudentId (id) {
	return await db.any(`
		SELECT category_id, name FROM "user_category"
		INNER JOIN "user" ON ("user_category".user_id = "user".id)
		INNER JOIN "category" ON ("user_category".category_id = "category".id)
		WHERE "user".id = $[id]
	`, {id})
	.map(categoriesMapper)
}

async function getAllStudents () {
	return await db.any(`
		SELECT * FROM "student" 
		INNER JOIN "user" ON ("student".user_id = "user".id)`)
		.catch(error.db('db.read'))
	    .map(map)
}

async function getStudentById (id) {
	const student = await db.one(`
		SELECT * FROM "student"
		INNER JOIN "user" ON ("student".user_id = "user".id)
		WHERE "student".user_id = $[id]
		`, {id})
		.catch(error.QueryResultError, error('user.not_found'))
		.catch(error.db('db.read'))
		.then(map)

	student.categories = await getCategoriesByStudentId(id)

	return student
}



module.exports = {
	getAllStudents,
	getStudentById,
	map,
	categoriesMapper
}
