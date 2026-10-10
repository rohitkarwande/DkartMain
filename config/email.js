const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    console.log('Nodemailer initialized.');
} else {
    console.warn('SMTP credentials not found. Email sending will be mocked.');
}

const sendEmailOTP = async (to, otp) => {
    if (!transporter) {
        console.log(`[MOCK EMAIL] Sending OTP ${otp} to ${to}`);
        return true;
    }

    const otpHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; }
    .wrapper { max-width: 520px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(9, 92, 153, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #095C99 0%, #032c4a 100%); padding: 28px 32px; text-align: left; }
    .header-logo { color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .header-logo span { color: #48BAC0; }
    .header-subtitle { color: #94a3b8; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px; }
    .body { padding: 32px 32px 28px 32px; text-align: center; }
    .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
    .subtitle { font-size: 14px; color: #64748b; margin-bottom: 24px; }
    .otp-box { background: #f0f9ff; border: 2px dashed #095C99; border-radius: 12px; padding: 20px; margin: 0 auto 24px auto; max-width: 320px; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #095C99; margin-left: 10px; }
    .expire-text { font-size: 13px; color: #64748b; margin-bottom: 16px; }
    .expire-badge { display: inline-block; background: #fef2f2; color: #991b1b; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 999px; border: 1px solid #fecaca; }
    .footer { background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #94a3b8; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">Dr's <span>Kart</span></div>
      <div class="header-subtitle">Medical Equipment Marketplace</div>
    </div>
    <div class="body">
      <div class="title">Verification Code</div>
      <p class="subtitle">Please use the code below to complete your login or verification.</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
      </div>
      <p class="expire-text">This code will expire in <strong style="color: #0f172a;">5 minutes</strong>.</p>
      <div><span class="expire-badge">🔒 Do not share this code with anyone</span></div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Dr's Kart Marketplace. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

    try {
        await transporter.sendMail({
            from: `"Dr's Kart Auth" <${process.env.SMTP_USER}>`,
            to: to,
            subject: "Your Verification Code — Dr's Kart",
            text: `Your Dr's Kart verification code is: ${otp}. It will expire in 5 minutes.`,
            html: otpHtml
        });
        console.log(`Email OTP sent successfully to ${to}`);
        return true;
    } catch (error) {
        console.error('Error sending Email OTP:', error);
        throw error;
    }
};

const sendTransactionalEmail = async (to, subject, message, html = null) => {
    if (!transporter) {
        console.log(`[MOCK EMAIL] Sending Transactional Email to ${to} | Subject: ${subject}`);
        return true;
    }

    try {
        await transporter.sendMail({
            from: `"Dr's Kart System" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            text: message,
            html: html || `<p>${message}</p>`
        });
        console.log(`Transactional email sent successfully to ${to}`);
        return true;
    } catch (error) {
        console.error('Error sending Transactional Email:', error);
        throw error;
    }
};

module.exports = { sendEmailOTP, sendTransactionalEmail };
