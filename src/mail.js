const nodemailer = require('nodemailer');
const os = require('os');
const moment = require('moment');

let singletonInstance;

module.exports = (settings) => {

    if (settings.nodemailer.singleton && singletonInstance !== undefined) {
        return singletonInstance;
    }

    const send = async (from, to, subject, body) => {
        if (body === undefined) {
            body = subject;
            subject = '';
        }
        const momentify = (js) => {
            return Object.assign({
                timestamp: moment().format(settings.moment)
            }, js)
        }
        if (body instanceof Error) {
            body = JSON.parse(JSON.stringify(body, ["message", "arguments", "type", "name", 'stack']));
            console.error(body);
        }

        if (typeof body !== 'string') {
            body = momentify(body);
            body = JSON.stringify(body, null, 2);
        } else {
            body = `
${moment().format(settings.moment)}

${body}
`;
        }

        const message = {
            from: from,
            to: to,
            subject: subject,
            text: body
        };
        console.log(`send new mail subject: ${subject}`);
        try {
            let transporter = nodemailer.createTransport(settings.nodemailer.config);
            const info = await transporter.sendMail(message);
            console.log(info.response);
            transporter.close();
        } catch (e) {
            console.log(`send error email`, message);
            console.error(e, message);
        }
    }

    const factory = {
        send: (subject, body) => {
            if (body === undefined) {
                body = subject;
                if (body instanceof Error) {
                    subject = 'error'
                } else {
                    subject = 'trigger'
                }
            }
            subject = `${settings.prefix}: ${os.hostname()} - ${subject}`;
            send(settings.email.from, settings.email.to, subject, body);
        }
    };

    if (settings.nodemailer.singleton) {
        singletonInstance = factory;
    }

    return factory;
}
