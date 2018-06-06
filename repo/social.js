const consts = require('const');
const _ = require('lodash');
const error = require('error');
const {db, helper} = require('db');

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

async function addUserSocial (userId, socialId, link) {
	return db.tx(async function (t) {
		return t.none(`
		  INSERT INTO "user_social" (user_id, social_id, link)
		  VALUES ($[userId], $[socialId], $[link]);
		`, {
			userId,
			socialId,
			link,
		});
	})
	.catch(error.db('db.write'));
}

async function updateUserSocialById (userId, socialId, link) {
	return db.tx(async function (t) {
		const queries = [];

		const updateSocialData = _.omitBy({
			link,
		}, _.overSome([_.isUndefined, _.isNaN]));

		if (_.size(updateSocialData)) {
			queries.push({
				query: helper.update(updateSocialData, null, 'user_social') + ` WHERE user_id = $[userId] AND social_id = $[socialId] RETURNING user_id`,
				values: {userId, socialId},
			});
		}
		return t.many(helper.concat(queries));
	})
	.catch(error.db('db.write'));
}

async function removeUserSocial (userId, socialId) {
	return db.none(`
    DELETE
    FROM user_social
    WHERE user_id = $[userId]
    AND social_id = $[socialId]
  `, {userId, socialId})
	.catch(error('db.delete'));
}

module.exports = {
	getUserSocialLinksById,
	addUserSocial,
	removeUserSocial,
	updateUserSocialById,
};
