const _ = require('lodash');
const assert = require('assert');

// const consts = require('../const');
const error = require('../error');
const { db, helper } = require('../db');
const { mapper } = require('../repo/base');

// repos
const categoryRepo = require('../repo/category');
const tagsRepo = require('../repo/tags');
const socialRepo = require('../repo/social');

const map = mapper({
	id: 'user_id',
	email: 'email',
	companyName: 'name',
	info: 'info',
	active: 'active',
	address: 'address',
	phone: 'phone',
	fax: 'fax',
	zip: 'zip_code',
	country: 'country_code',
	createdAt: 'created_at',
	profilePicture: 'image_fname',
	oib: 'oib',
});

async function getAllCompanies () {
	return db.any(`
		SELECT * FROM "company"
		INNER JOIN "user" ON ("company".user_id = "user".id)`)
	.catch(error.db('db.read'))
	.map(map);
}

async function getCompanyById (id) {
	const company = await db.one(`
		SELECT * FROM "company"
		INNER JOIN "user" ON ("company".user_id = "user".id)
		WHERE "company".user_id = $1
		`, [id])
	.catch(error.QueryResultError, error('user.not_found'))
	.catch(error.db('db.read'))
	.then(map);

	company.categories = await categoryRepo.getUserCategoriesById(company.id);
	company.tags = await tagsRepo.getUserTagsById(company.id);
	company.socialLinks = await socialRepo.getUserSocialLinksById(company.id);

	return company;
}

async function updateCompanyById (id, address, phone, zipCode, country, companyName, fax, info, oib) {
	return db.tx(async function (t) {
		const queries = [];

		const updateUserData = _.omitBy({
			address,
			phone,
			zip_code: zipCode,
			country_code: country,
		}, _.overSome([_.isUndefined, _.isNaN]));

		const updateUserCompanyData = _.omitBy({
			name: companyName,
			fax,
			info,
			oib,
		}, _.overSome([_.isUndefined, _.isNaN]));

		if (_.size(updateUserData)) {
			queries.push({
				query: helper.update(updateUserData, null, 'user') + ` WHERE id = $[id] RETURNING id`,
				values: {id},
			});
		}

		if (_.size(updateUserCompanyData)) {
			queries.push({
				query: helper.update(updateUserCompanyData, null, 'company') + ` WHERE user_id = $[id] RETURNING user_id`,
				values: {id},
			});
		}
		return t.many(helper.concat(queries));
	})
	.catch(error.db('db.write'));
}

module.exports = {
	getAllCompanies,
	getCompanyById,
	updateCompanyById,
	map,
};
