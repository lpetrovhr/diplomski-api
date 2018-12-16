const consts = require('const');
const error = require('error');
const {db, helper} = require('db');

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

async function saveNewTag (tagName) {
	return db.tx(async function (t) {
		const queries = [];

		queries.push({
			query: `INSERT INTO 
        tags (name)
        VALUES ($[tagName])
        RETURNING id
      `,
			values: { tagName },
		});

		return t.one(helper.concat(queries));
	})
	.get('id')
	.catch(error.db('db.write'));
}

async function addUserTagById (userId, tagName) {
	console.log(tagName);
	const tag = await db.any(`
	  SELECT * 
	  FROM "tags"
	  WHERE LOWER("tags".name) = LOWER($[tagName])`,
	{tagName})
	.map(map)
	.catch(error.db('db.read'));

	console.log(tag[0]);

	const tagId = tag[0] ? tag[0].tagId : await saveNewTag(tagName.toLowerCase());

	return db.tx(async function (t) {
		return t.none(`
		INSERT INTO "user_tags" (user_id, tags_id)
		VALUES ($[userId], $[tagId]);`,
		{
			userId,
			tagId,
		});
	})
	.catch(error.db('db.write'));
}

async function removeUserTagById (userId, tagId) {
	return db.none(`
		DELETE 
		FROM "user_tags"
		WHERE user_id = $[userId] AND tags_id = $[tagId]
	`, { userId, tagId })
	.catch(error('db.delete'));
}

module.exports = {
	getUserTagsById,
	addUserTagById,
	removeUserTagById,
	saveNewTag,
};
