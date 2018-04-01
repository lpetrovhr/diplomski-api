const consts = require('const');
const error = require('error');
const {db} = require('db');

const {mapper} = require('repo/base');

const map = mapper({
	socialName: 'name',
	socialLink: 'link',
});

async function getUserSocialLinksById (id) {
	const social = await db.any(`
      SELECT * 
      FROM user_social
      INNER JOIN social ON (social.id = user_social.social_id)
      WHERE user_social.user_id = $[id]
  `, {id})
	.map(map)
	.catch(error.db('db.read'));

	return social;
}

module.exports = {
	getUserSocialLinksById,
};
