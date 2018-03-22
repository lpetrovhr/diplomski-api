const consts = require('const')
const error = require('error')
const {db} = require('db')

const {mapper} = require('repo/base')

const map = mapper({

})

async function getUserSocialLinksById (id) {
  const tag = await db.any(`
      SELECT "tags".*
      FROM "user_tags"
      INNER JOIN "tags" ON ("tags".id = "user_tags".tags_id)
      WHERE user_id = $[id]
  `, {id})
    .map(map)
    .catch(error.db('db.read'))

  return tag
}

module.exports = {
  getUserSocialLinksById,
}
