const nodemailer = require('nodemailer');

var mailTransport = nodemailer.createTransport({
	host: 'smtp.mailtrap.io',
	port: 2525,
	auth: {
		user: '928446c6df08a4',
		pass: '173a3ae2a29f3a',
	},
});

function sendMail (to, subject, body) {
	var message = {
		from: 'something@oss.unist.hr',
		to: to,
		subject: subject,
		text: body,
	};

	mailTransport.sendMail(message);
}

module.exports = sendMail;
