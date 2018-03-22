const consts = require('const')
const error = require('error')
const {db} = require('db')

const {mapper} = require('repo/base')

const map = mapper({
	categoryId: 'id',
	categoryName: 'name',
})

async function getUserCategoriesById (id) {
	const category = await db.any(`
      SELECT "category".*
      FROM "user_category"
      INNER JOIN "category" ON ("category".id = "user_category".category_id)
      WHERE user_id = $[id]
  `, {id})
	.map(map)
	.catch(error.db('db.read'))

	return category
}

module.exports = {
	getUserCategoriesById,
}
