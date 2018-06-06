const _ = require('lodash');
const error = require('error');
const {db, helper} = require('db');
const {mapper} = require('repo/base');

const categoryRepo = require('repo/category');

const map = mapper({
	id: 'post_id',
	postInfo: 'post_info',
	companyName: 'company_name',
	companyPicture: 'company_image',
	companyId: 'company_id',
	typeId: 'post_type_id',
	typeName: 'post_type_name',
	startDate: 'start_date',
	endDate: 'end_date',
});

const simplePostMapper = mapper({
	id: 'post_id',
	postInfo: 'post_info',
	postTypeId: 'post_type_id',
	postTypeName: 'post_type_name',
	startDate: 'start_date',
	endDate: 'end_date',
});

const postTypeMapper = mapper({
	id: 'id',
	name: 'name',
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
	const post = await db.one(`
		SELECT post.id AS post_id, post.info AS post_info, post.start_date AS start_date, post.end_date AS end_date, company.user_id AS company_id, company.name AS company_name, post_type.id AS post_type_id, post_type.name AS post_type_name, "user".image_fname AS company_image
		FROM post, company, post_type, "user"
		WHERE post.company_id = company.user_id AND post.type_id = post_type.id AND company.user_id = "user".id
		AND post.id = $1`, [id])
	.catch(error.QueryResultError, error('post.not_found'))
	.catch(error.db('db.read'))
	.then(map);

	post.categories = await categoryRepo.getPostCategoriesById(post.id);

	return post;
}

async function getPostsByUserId (id) {
	const posts = await db.any(`
		SELECT post.id AS post_id, post.info AS post_info, post.start_date AS start_date, post.end_date AS end_date, post_type.id AS post_type_id, post_type.name AS post_type_name
		FROM post
    INNER JOIN post_type ON (post.type_id = post_type.id)
		WHERE post.company_id = $[id]
		`, {id})
	.catch(error.db('db.read'))
	.map(simplePostMapper);

	return posts;
}

async function createNewPost (companyId, typeId, info, startDate, endDate, categories) {
	return db.tx(async function (t) {
		const queries = [];

	  queries.push({
			query: `INSERT INTO 
        post (company_id, type_id, info, start_date, end_date)
        VALUES ($[companyId], $[typeId], $[info], $[startDate], $[endDate])
        RETURNING id
      `,
			values: { companyId, typeId, info, startDate, endDate },
		});

		if (categories) {
			_.forEach(categories, function (category) {
	      queries.push({
					query: `INSERT INTO post_category (post_id, category_id)
                  VALUES (currval('post_id_seq'), $[category])
                  RETURNING currval('post_id_seq')
                  `,
					values: { category },
				});
			});
		}

		return t.one(helper.concat(queries));
	})
	.get('id')
	.catch(error.db('db.write'));
}

async function updatePostById (postId, typeId, info, startDate, endDate) {
	return db.tx(async function (t) {
		const queries = [];

		const updatePostData = _.omitBy({
			type_id: typeId,
			info,
			start_date: startDate,
			end_date: endDate,
		}, _.overSome([_.isUndefined, _.isNaN]));

		if (_.size(updatePostData)) {
			queries.push({
				query: helper.update(updatePostData, null, 'post') + ` WHERE id = $[postId] RETURNING id`,
				values: {postId},
			});
		}
		return t.many(helper.concat(queries));
	})
	.catch(error.db('db.write'));
}

async function addPostCategory (postId, categoryId) {
	return db.tx(async function (t) {
		return t.none(`
		  INSERT INTO "post_category" (post_id, category_id)
		  VALUES ($[post_id], $[category_id]);
		`, {
			post_id: postId,
			category_id: categoryId,
		});
	})
	.catch(error.db('db.write'));
}

async function removePostCategory (postId, categoryId) {
	return db.none(`
    DELETE
    FROM post_category
    WHERE post_id = $[postId] AND category_id = $[categoryId]
  `, {postId, categoryId})
	.catch(error('db.delete'));
}

module.exports = {
	createNewPost,
	getAllPosts,
	getPostById,
	getPostsByUserId,
	updatePostById,
	addPostCategory,
	removePostCategory,
	map,
	simplePostMapper,
};
