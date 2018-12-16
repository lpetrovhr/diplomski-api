const consts = require('const');
const _ = require('lodash');
const error = require('error');
const {db, helper} = require('db');

const {mapper} = require('repo/base');

const map = mapper({
	id: 'id',
	name: 'name',
});

async function getAllCategories () {
	return db.any(`
	SELECT *
	FROM category`)
	.catch(error.db('db.read'))
	.map(map);
}

async function getAllTags () {
	return db.any(`
	SELECT *
	FROM tags`)
	.catch(error.db('db.read'))
	.map(map);
}

async function getUserCategoriesById (id) {
	const category = await db.any(`
      SELECT "category".*
      FROM "user_category"
      INNER JOIN "category" ON ("category".id = "user_category".category_id)
      WHERE user_id = $[id]
  `, {id})
	.catch(error.db('db.read'))
	.map(map);

	return category;
}

async function getPostCategoriesById (id) {
	const category = await db.any(`
      SELECT "category".*
      FROM "post_category"
      INNER JOIN "category" ON ("category".id = "post_category".category_id)
      WHERE post_id = $[id]
  `, {id})
	.catch(error.db('db.read'))
	.map(map);

	return category;
}

// ADMIN RESTRICT

async function createNewCategory (categoryName) {
	return db.tx(async function (t) {
    return t.none(`
		  INSERT INTO "category" (name)
		  VALUES ($[name]);
		`, {
      name: categoryName,
    });
  })
    .catch(error.db('db.write'));
}

async function updateCategory (categoryId, categoryName) {
	return db.tx(async function (t) {
		const queries = [];

		const updateCategoryData = _.omitBy({
			name: categoryName,
		}, _.overSome([_.isUndefined, _.isNaN]));

		if (_.size(updateCategoryData)) {
			queries.push({
				query: helper.update(updateCategoryData, null, 'category') + ` WHERE id = $[categoryId] RETURNING id`,
				values: {categoryId},
			});
		}
		return t.many(helper.concat(queries));
	})
	.catch(error.db('db.write'));
}

async function deleteCategory (id) {
	return db.none(`
    DELETE
    FROM category
    WHERE id = $[id]
  `, {id})
	.catch(error('db.delete'));
}

module.exports = {
	getUserCategoriesById,
	getPostCategoriesById,
	createNewCategory,
	updateCategory,
	getAllCategories,
	deleteCategory,
	getAllTags,
};
