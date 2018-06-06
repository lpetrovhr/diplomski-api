const _ = require('lodash');
const assert = require('assert');
const bcrypt = require('bcrypt');

const consts = require('const');
const error = require('error');
const {db} = require('db');
const {mapper} = require('repo/base');

const map = mapper({
	id: 'id',
	createdAt: 'created_at',
	email: 'email',
});

async function hashPassword (password) {
	return bcrypt.hash(password, _.toInteger(process.env.BCRYPT_ROUNDS))
	.catch(error.db('user.password_invalid'));
}

async function checkPassword (password, hash) {
	return bcrypt.compare(password, hash).then(assert)
	.catch(error.AssertionError, error('user.password_wrong'));
}

async function createStudent (email, password, role, address, zipCode, countryCode, firstName, lastName) {
	return db.tx(async function (t) {
		return t.none(`
      INSERT INTO
        "user" (email, password, address, zip_code, country_code)
        VALUES ($[email], $[password], $[address], $[zip_code], $[country_code]);
      INSERT INTO
        user_role (user_id, role)
        VALUES (currval('user_id_seq'), $[role]);
      INSERT INTO 
         student (user_id, first_name, last_name)
         VALUES(currval('user_id_seq'), $[firstName], $[lastName]);
    `, {
			email,
			password: password ? await hashPassword(password) : '',
			role,
			address,
			zip_code: zipCode,
			country_code: countryCode,
			firstName,
			lastName,
		})
		.catch({constraint: 'user_email_key'}, error('user.duplicate'));
	})
	.catch(error.db('db.write'));
}

async function createCompany (email, password, role, address, zipCode, countryCode, companyName, oib, info) {
	return db.tx(async function (t) {
		return t.none(`
      INSERT INTO
        "user" (email, password, address, zip_code, country_code)
        VALUES ($[email], $[password], $[address], $[zip_code], $[country_code]);
      INSERT INTO
        user_role (user_id, role)
        VALUES (currval('user_id_seq'), $[role]);
      INSERT INTO
        company (user_id, name, oib, info)
        VALUES (currval('user_id_seq'), $[name], $[oib], $[info]);
    `, {
			email,
			password: password ? await hashPassword(password) : '',
			role,
			address,
			zip_code: zipCode,
			country_code: countryCode,
			name: companyName,
			oib,
			info,
		})
		.catch({constraint: 'user_email_key'}, error('user.duplicate'));
	})
	.catch(error.db('db.write'));
}

async function updatePassword (id, password) {
	return db.none(`
    UPDATE "user"
    SET password = $2
    WHERE id = $1
  `, [id, await hashPassword(password)])
	.catch(error.db('db.update'));
}

async function getById (id) {
	return db.one(`
    SELECT *
    FROM "user"
    WHERE id = $1
  `, [id])
	.then(map)
	.catch(error.QueryResultError, error('user.not_found'))
	.catch(error.db('db.read'));
}

async function getByEmail (email) {
	return db.one(`
    SELECT *
    FROM "user"
    WHERE email = $1
  `, [email])
	.catch(error.QueryResultError, error('user.not_found'))
	.catch(error.db('db.read'))
	.then(map);
}

async function getByEmailPassword (email, password) {
	const user = await db.one(`
    SELECT id, password, email
    FROM "user"
    WHERE email = $1
  `, [email])
	.catch(error.QueryResultError, error('user.password_wrong'))
	.catch(error.db('db.read'));
	await checkPassword(password, user.password);
	return map(user);
}

async function getRoleById (id) {
	return db.one(`
    SELECT role
    FROM user_role
    WHERE user_id = $[id]
  `, {id})
	.catchReturn(error.QueryResultError, consts.roleUser.none)
	.catch(error.db('db.read'))
	.get('role');
}

async function setRoleById (id, role) {
	return db.none(`
    UPDATE user_role
    SET role = $[role]
    WHERE user_id = $[id]
  `, {id, role})
	.catch({constraint: 'user_role_user_id_fkey'}, error.db('user.not_found'))
	.catch(error.db('db.write'));
}

async function addUserCategoryById (user_id, category_id) {
	return db.none(`
		INSERT INTO user_category
		VALUES ($[user_id], $[category_id])
	`, {user_id, category_id})
	.catch(error.db('db.write'));
}

async function removeUserCategoryById (user_id, category_id) {
	return db.none(`
		DELETE FROM user_category
		WHERE user_id = $[user_id]
		AND category_id = $[category_id]
	`, {user_id, category_id})
	.catch(error.db('db.delete'));
}

// async function addUserTagById (user_id, tag_id) {
//
// }
//
// async function removeUserTagById (user_id, tag_id) {
//
// }

module.exports = {
	createStudent,
	createCompany,
	getByEmail,
	getByEmailPassword,
	getById,
	getRoleById,
	map,
	setRoleById,
	updatePassword,
	addUserCategoryById,
	removeUserCategoryById,
};
