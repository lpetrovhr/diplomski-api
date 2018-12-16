const _ = require('lodash');
const consts = require('../const');
const error = require('../error');
const { db, helper } = require('../db');

const { mapper } = require('../repo/base');

const categoryRepo = require('../repo/category');
const tagsRepo = require('../repo/tags');
const socialRepo = require('../repo/social');

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

async function getAllStudentsByParams (firstName, lastName, tag, categoryId) {
	console.log(firstName, lastName);
	if (firstName && lastName === '' && tag === '' && categoryId === '') {
		return db.any(`
		SELECT * 
		FROM "student" 
		INNER JOIN "user" ON ("student".user_id = "user".id)
		WHERE LOWER("student".first_name) LIKE LOWER('%${firstName}%')
		OR LOWER("student".last_name) LIKE LOWER('%${firstName}%')`)
		.catch(error.db('db.read'))
		.map(map);
	} else if (categoryId && tag === '') {
		return db.any(`
		SELECT *
		FROM "student"
		INNER JOIN "user" ON ("student".user_id = "user".id)
		LEFT JOIN "user_category" ON ("student".user_id = "user_category".user_id)
		WHERE "user_category".category_id = ${categoryId}`)
		.catch(error.db('db.read'))
		.map(map);
	} else if (tag) {
		return db.any(`
		SELECT *
		FROM "student"
		INNER JOIN "user" ON ("student".user_id = "user".id)
		LEFT JOIN "user_tags" ON ("student".user_id = "user_tags".user_id)
		LEFT JOIN "tags" ON ("user_tags".tags_id = "tags".id)
		WHERE LOWER("tags".name) LIKE LOWER('%${tag}%')`)
		.catch(error.db('db.read'))
		.map(map);
	} else if (categoryId && tag) {
		return db.any(`
		SELECT *
		FROM "student"
		INNER JOIN "user" ON ("student".user_id = "user".id)
		LEFT JOIN "user_category" ON ("student".user_id = "user_category".user_id)
		LEFT JOIN "user_tags" ON ("student".user_id = "user_tags".user_id)
		LEFT JOIN "tags" ON ("user_tags".tags_id = "tags".id)
		AND "user_category".category_id = ${categoryId}
		AND LOWER("tags".name) LIKE LOWER('%${tag}%')`)
		.catch(error.db('db.read'))
		.map(map);
	} else if (firstName && lastName && tag && categoryId) {
		return db.any(`
		SELECT *
		FROM "student"
		INNER JOIN "user" ON ("student".user_id = "user".id)
		LEFT JOIN "user_category" ON ("student".user_id = "user_category".user_id)
		LEFT JOIN "user_tags" ON ("student".user_id = "user_tags".user_id)
		LEFT JOIN "tags" ON ("user_tags".tags_id = "tags".id)
		WHERE LOWER("student".first_name) LIKE LOWER('%${firstName}%')
		AND LOWER("student".last_name) LIKE LOWER('%${lastName}%')
		AND "user_category".category_id = ${categoryId}
		AND LOWER("tags".name) LIKE LOWER('%${tag}%')`)
		.catch(error.db('db.read'))
		.map(map);
	} else if (firstName && lastName && tag) {
		return db.any(`
		SELECT *
		FROM "student"
		INNER JOIN "user" ON ("student".user_id = "user".id)
		LEFT JOIN "user_tags" ON ("student".user_id = "user_tags".user_id)
		LEFT JOIN "tags" ON ("user_tags".tags_id = "tags".id)
		WHERE LOWER("student".first_name) LIKE LOWER('%${firstName}%')
		AND LOWER("student".last_name) LIKE LOWER('%${lastName}%')
		AND LOWER("tags".name) LIKE LOWER('%${tag}%')`)
		.catch(error.db('db.read'))
		.map(map);
	} else if (firstName && categoryId) {
		return db.any(`
		SELECT *
		FROM "student"
		INNER JOIN "user" ON ("student".user_id = "user".id)
		LEFT JOIN "user_category" ON ("student".user_id = "user_category".user_id)
		WHERE LOWER("student".first_name) LIKE LOWER('%${firstName}%')
		AND "user_category".category_id = ${categoryId}`)
		.catch(error.db('db.read'))
		.map(map);
	} else if (firstName !== '' && lastName !== '') {
		return db.any(`
		SELECT * 
		FROM "student" 
		INNER JOIN "user" ON ("student".user_id = "user".id)
		WHERE LOWER("student".first_name) LIKE LOWER('%${firstName}%')
		AND LOWER("student".last_name) LIKE LOWER('%${lastName}%')`)
		.catch(error.db('db.read'))
		.map(map);
	}
	return getAllStudents();
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

	return student;
}

async function updateStudentById (id, firstName, lastName, cv) {
	return db.tx(async function (t) {
		const queries = [];

		const updateStudentData = _.omitBy({
			first_name: firstName,
			last_name: lastName,
			cv_link: cv,
		}, _.overSome([_.isUndefined, _.isNaN]));

		if (_.size(updateStudentData)) {
			queries.push({
				query: helper.update(updateStudentData, null, 'student') + ` WHERE user_id = $[id] RETURNING user_id`,
				values: {id},
			});
		}

		return t.many(helper.concat(queries));
	})
	.catch(error.db('db.write'));
}

module.exports = {
	getAllStudents,
	getStudentById,
	getAllStudentsByParams,
	updateStudentById,
	map,
};
