const _ = require('lodash');
const consts = require('const');
const error = require('error');
const {db, helper} = require('db');

const {mapper} = require('repo/base');

const categoryRepo = require('repo/category');
const tagsRepo = require('repo/tags');
const socialRepo = require('repo/social');

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
});

async function getAllStudents () {
	return db.any(`
		SELECT * 
		FROM "student" 
		INNER JOIN "user" ON ("student".user_id = "user".id)`)
	.catch(error.db('db.read'))
	.map(map);
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
	.then(map);

	student.categories = await categoryRepo.getUserCategoriesById(student.id);
	student.tags = await tagsRepo.getUserTagsById(student.id);
	student.socialLinks = await socialRepo.getUserSocialLinksById(student.id);

	return [student];
}

async function updateStudentById (id, address, phone, zip, country, firstName, lastName, cv) {
	return db.tx(async function (t) {
		const queries = [];

		const updateUserData = _.omitBy({
			address,
			phone,
			zip_code: zip,
			country_code: country,
		}, _.overSome([_.isUndefined, _.isNaN]));

		const updateStudentData = _.omitBy({
			first_name: firstName,
			last_name: lastName,
			cv_link: cv,
		}, _.overSome([_.isUndefined, _.isNaN]));

		if (_.size(updateUserData)) {
			queries.push({
				query: helper.update(updateUserData, null, 'user') + ` WHERE id = $[id] RETURNING id`,
				values: {id},
			});
		}

		if (_.size(updateStudentData)) {
			queries.push({
				query: helper.update(updateStudentData, null, 'student') + ` WHERE user_id = $[id] RETURNING user_id`,
				values: {id},
			});
		}

		console.log(queries);
		return t.many(helper.concat(queries));
	})
	.catch(error.db('db.write'));
}

module.exports = {
	getAllStudents,
	getStudentById,
	updateStudentById,
	map,
};
