const _ = require('lodash');
const assert = require('assert');

const consts = require('const');
const error = require('error');
const {db} = require('db');
const {mapper} = require('repo/base');

const map = mapper({
	id: 'post_id',
	postInfo: 'post_info',
	companyName: 'company_name',
	companyPicture: 'company_image',
	companyId: 'company_id',
	typeId: 'post_type_id',
	typeName: 'post_type_name',
});

const simplePostMapper = mapper({
	id: 'id',
	postInfo: 'info',
	typeName: 'name',
});

async function getAllPosts () {
	return await db.any(`
		SELECT post.id AS post_id, post.info AS post_info, company.user_id AS company_id, company.name AS company_name, post_type.id AS post_type_id, post_type.name AS post_type_name, "user".image_fname AS company_image
		FROM post, company, post_type, "user"
		WHERE post.company_id = company.user_id AND post.type_id = post_type.id AND company.user_id = "user".id`)
	.catch(error.db('db.read'))
	.map(map);
}

async function getPostById (id) {
	return db.one(`
		SELECT post.id AS post_id, post.info AS post_info, company.user_id AS company_id, company.name AS company_name, post_type.id AS post_type_id, post_type.name AS post_type_name, "user".image_fname AS company_image
		FROM post, company, post_type, "user"
		WHERE post.company_id = company.user_id AND post.type_id = post_type.id AND company.user_id = "user".id
		AND post.id = $1`, [id])
	.catch(error.QueryResultError, error('post.not_found'))
	.catch(error.db('db.read'))
	.then(map);
}

async function getPostsByUserId (user_id) {
	return await db.any(`
		SELECT * FROM post
    	INNER JOIN post_type ON (post.type_id = post_type.id)
		WHERE post.company_id = $[user_id]
		`, {user_id})
	.catch(error.db('db.read'))
	.map(simplePostMapper);
}

module.exports = {
	getAllPosts,
	getPostById,
	getPostsByUserId,
	map,
	simplePostMapper,
};
