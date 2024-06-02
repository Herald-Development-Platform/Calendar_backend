const nodemailer = require("nodemailer");

const NODE_MAILER_EMAIL = process.env.NODE_MAILER_EMAIL;
const NODE_MAILER_PASSWORD = process.env.NODE_MAILER_PASSWORD;

if (!NODE_MAILER_EMAIL || !NODE_MAILER_PASSWORD) {
  console.log("Please provide NODE_MAILER_EMAIL and NODE_MAILER_PASSWORD in .env file");
  process.exit(1);
}

const sendEmail = async (to, cc, bcc, subject, html) => {
  try {
    var transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: NODE_MAILER_EMAIL,
        pass: NODE_MAILER_PASSWORD,
      },
    });
    return await new Promise((resolve, reject) => {
      transport.sendMail(
        {
          from: NODE_MAILER_EMAIL,
          to,
          cc,
          bcc,
          subject,
          html,
        },
        (error, response) => {
          if (error) {
            console.log("Email could not sent due to error: " + error);
            resolve({ success: false, error: error });
          } else {
            console.log("Email has been sent successfully");
            resolve({ success: true, response: response });
          }
        },
      );
    });
  } catch (error) {
    console.log(error);
    return {
        success: false,
        error: error.message
    };
  }
};

module.exports = { sendEmail };