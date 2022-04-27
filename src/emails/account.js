const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  host: "smtp-relay.sendinblue.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const welcomeEmail = async (email, name, token, referal_code) => {
  if (referal_code) {
    token += `?referal_code=${referal_code}`;
  }
  let info = await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: `Welcome ${name}`,
    text: `Hi ${name}, Please click On ${process.env.HOST}/verification/${token} To Verify Your Account Alternatively You can Copy Paste The Link In Your Browser `, // plain text body
    // html: "<b>Hello world?</b>"
  });

  console.log("Message sent: %s", info.messageId);
};

const verifyEmail = async (email, subject, name, message, token) => {
  let info = await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: subject,
    text: `Hi ${name}, As You ${message}, You Need To Verify That This E-Mail Belongs To ${name}, So Please click On ${process.env.HOST}/verification/${token} To Verify Your E-Mail Alternatively You can Copy Paste The Link In Your Browser `, // plain text body
    // html: "<b>Hello world?</b>"
  });

  console.log("Message sent: %s", info.messageId);
};

const resetEmail = async (email, name, token) => {
  let info = await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: "Forgot Password",
    text: `Hi ${name}, As You Have Forgot Your Password You Need To Verify That This E-Mail Belongs To ${name}, So Please click On ${process.env.HOST}/reset/${token} To Verify That You Opted To Reset Your Password Alternatively You can Copy Paste The Link In Your Browser,In Case You Didn't Opted To Reset Your Password  In Case You Didn't Opted Just Ignore This Email Nothing Has Been Changed With Your Account`, // plain text body
    // html: "<b>Hello world?</b>"
  });

  console.log("Message sent: %s", info.messageId);
};

const goodByeEmail = async (email, name) => {
  let info = await transporter.sendMail({
    from: "coderharjot@gmail.com",
    to: email,
    subject: `Good Bye ${name}`,
    text: `Hi ${name}, I Loved that You Spent a Lot of time with this app this is last email to tell you that your account is cancelled as per your request `, // plain text body
    // html: "<b>Hello world?</b>"
  });

  console.log("Message sent: %s", info.messageId);
};

const newsletterEmail = async (subject, email, content) => {
  let info = await transporter.sendMail({
    from: process.env.EMAIL,
    bcc: email,
    subject: subject,
    text: content, // plain text body
    // html: "<b>Hello world?</b>"
  });

  console.log("Message sent: %s", info.messageId);
};

module.exports = {
  welcomeEmail,
  goodByeEmail,
  verifyEmail,
  resetEmail,
  newsletterEmail,
};
