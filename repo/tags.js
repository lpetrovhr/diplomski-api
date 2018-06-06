const consts = require('const');
const error = require('error');
const {db} = require('db');

const {mapper} = require('repo/base');

const map = mapper({
	tagId: 'id',
	tagName: 'name',
});

async function getUserTagsById (id) {
	const tag = await db.any(`
      SELECT "tags".*
      FROM "user_tags"
      INNER JOIN "tags" ON ("tags".id = "user_tags".tags_id)
      WHERE user_id = $[id]
  `, {id})
	.map(map)
	.catch(error.db('db.read'));

	return tag;
}

// add / remove

module.exports = {
	getUserTagsById,
};
