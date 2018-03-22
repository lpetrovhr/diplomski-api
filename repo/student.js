const consts = require('const')
const error = require('error')
const {db} = require('db')

const {mapper} = require('repo/base')

const categoryRepo = require('repo/category')
const tagsRepo = require('repo/tags')
const socialRepo = require('repo/social')

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
	profilePicture: 'image_fname',
})

async function getAllStudents () {
	return db.any(`
		SELECT * FROM "student" 
		INNER JOIN "user" ON ("student".user_id = "user".id)`)
	.catch(error.db('db.read'))
	.map(map)
}

async function getStudentById (id) {
	const student = await db.one(`
		SELECT *
    FROM "student"
    INNER JOIN "user" ON ("user".id = "student".user_id)
		WHERE "student".user_id = $1
		`, [id])
	.catch(error.QueryResultError, error('user.not_found'))
	.catch(error.db('db.read'))
	.then(map)

	student.categories = await categoryRepo.getUserCategoriesById(student.id)
	student.tags = await tagsRepo.getUserTagsById(student.id)
  // student.socialLinks = await socialRepo.getUserSocialLinksById(student.id)

	return student
}

module.exports = {
	getAllStudents,
	getStudentById,
	map,
}
