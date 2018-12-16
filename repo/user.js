const _ = require('lodash');
const assert = require('assert');
const bcrypt = require('bcrypt');
const aws = require('aws-sdk');
const fs = require('fs');

const consts = require('../const');
const error = require('../error');
const { db } = require('../db');
const { mapper } = require('../repo/base');

const map = mapper({
	id: 'id',
	createdAt: 'created_at',
	email: 'email',
	role: 'role',
	active: 'active',
});

async function hashPassword (password) {
	return bcrypt.hash(password, _.toInteger(process.env.BCRYPT_ROUNDS))
	.catch(error.db('user.password_invalid'));
}

async function checkPassword (password, hash) {
	return bcrypt.compare(password, hash).then(assert)
	.catch(error.AssertionError, error('user.password_wrong'));
}

async function createStudent (email, password, role, firstName, lastName) {
	return db.tx(async function (t) {
		return t.none(`
      INSERT INTO
        "user" (email, password)
        VALUES ($[email], $[password]);
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
			firstName,
			lastName,
		})
		.catch({constraint: 'user_email_key'}, error('user.duplicate'));
	})
	.catch(error.db('db.write'));
}

async function createCompany (email, password, address, zipCode, companyName, oib, info, phone) {
	return db.tx(async function (t) {
		return t.none(`
      INSERT INTO
        "user" (email, password, address, zip_code, country_code, phone, active)
        VALUES ($[email], $[password], $[address], $[zip_code], 'HR', $[phone], false);
      INSERT INTO
        user_role (user_id, role)
        VALUES (currval('user_id_seq'), 10);
      INSERT INTO
        company (user_id, name, oib, info)
        VALUES (currval('user_id_seq'), $[name], $[oib], $[info]);
    `, {
			email,
			password: password ? await hashPassword(password) : '',
			address,
			zip_code: zipCode,
			name: companyName,
			oib,
			info,
			phone,
			active: false,
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

async function getAllUsers () {
	return db.any(`
    SELECT *
    FROM "user"
    INNER JOIN "user_role" ON ("user_role".user_id = "user".id)`)
	.catch(error.db('db.read'))
	.map(map);
}

async function getById (id) {
	return db.one(`
    SELECT *
    FROM "user"
    INNER JOIN "user_role" ON ("user_role".user_id = "user".id)
    WHERE id = $1
  `, [id])
	.catch(error.QueryResultError, error('user.not_found'))
	.catch(error.db('db.read'))
	.then(map);
}

async function getByEmail (email) {
	return db.one(`
    SELECT *
		FROM "user"
		INNER JOIN "user_role" ON ("user_role".user_id = "user".id)
    WHERE email = $1
  `, [email])
	.catch(error.QueryResultError, error('user.not_found'))
	.catch(error.db('db.read'))
	.then(map);
}

async function getByEmailPassword (email, password) {
	const user = await db.one(`
    SELECT id, password, email, role
    FROM "user"
    INNER JOIN "user_role" ON ("user_role".user_id = "user".id)
    WHERE email = $1
  `, [email])
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
  `, [id, role])
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

async function removeUserCategoryById (user_id) {
	return db.none(`
		DELETE FROM user_category
		WHERE user_id = $[user_id]
	`, {user_id})
	.catch(error.db('db.delete'));
}

async function userActiveStateUpdate (userId, state) {
	return db.none(`
    UPDATE "user"
    SET active = $2
    WHERE id = $1
  `, [userId, state])
	.catch(error.db('db.write'));
}

async function imageUpload (userId, file) {
	const { key, url } = await new Promise((resolve, reject) => {
		aws.config.update({
			region: 'us-west-2',
			accessKeyId: `${process.env.AWS_ACCESS_KEY_ID}`,
			secretAccessKey: `${process.env.AWS_SECRET_ACCESS_KEY}`,
		});

		const s3 = new aws.S3({
			apiVersion: '2018-12-16',
			// If you want to specify a different endpoint, such as using DigitalOcean spaces
			// endpoint: new aws.Endpoint("nyc3.digitaloceanspaces.com"),
		});

		const stream = fs.createReadStream(file.path);
		stream.on('error', function (err) {
			reject(err);
		});

		s3.upload(
		{
			ACL: 'public-read',
			// You'll input your bucket name here
			Bucket: 'student-cv-api-assets',
			Body: stream,
			Key: file.name,
			ContentType: file.type,
		},
		function (err, data) {
			if (err) {
				reject(err);
			} else if (data) {
				resolve({ key: data.Key, url: data.Location });
			}
		}
		);
	});

	console.log(url);

	return db.none(`
		UPDATE "user"
		SET image_fname = $2
		WHERE id = $1
	`, [userId, url])
	.catch(error.db('db.write'));
}

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
	getAllUsers,
	userActiveStateUpdate,
	imageUpload,
};
