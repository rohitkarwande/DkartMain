const { sendTransactionalEmail } = require('../../config/email');
const db = require('../../config/db');

/**
 * Builds a branded HTML email wrapper around body content.
 */
const buildEmailHtml = (title, bodyHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(9, 92, 153, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #095C99 0%, #032c4a 100%); padding: 30px 36px; text-align: left; position: relative; }
    .header-logo { color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2; }
    .header-logo span { color: #48BAC0; }
    .header-subtitle { color: #94a3b8; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    .body { padding: 36px 36px 28px 36px; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 16px; letter-spacing: -0.3px; }
    .text { font-size: 15px; color: #475569; line-height: 1.65; margin-bottom: 14px; }
    .highlight-box { background: #f0f9ff; border: 1px solid #e0f2fe; border-left: 4px solid #095C99; border-radius: 10px; padding: 18px 20px; margin: 20px 0; }
    .highlight-box p { font-size: 14px; color: #1e293b; line-height: 1.6; margin-bottom: 6px; }
    .highlight-box p:last-child { margin-bottom: 0; }
    .highlight-box strong { color: #095C99; }
    .btn { display: inline-block; background: #095C99; color: #ffffff !important; text-decoration: none; padding: 13px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; margin-top: 20px; box-shadow: 0 4px 12px rgba(9, 92, 153, 0.25); transition: background-color 0.2s; }
    .footer { background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 24px 36px; text-align: center; }
    .footer p { font-size: 12px; color: #94a3b8; line-height: 1.5; }
    .badge { display: inline-block; background: #e0f2fe; color: #032c4a; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; margin-bottom: 16px; border: 1px solid #bae6fd; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">Dr's <span>Kart</span></div>
      <div class="header-subtitle">Medical Equipment Marketplace</div>
    </div>
    <div class="body">
      <div class="title">${title}</div>
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>You are receiving this email because you are registered on Dr's Kart.<br/>&copy; ${new Date().getFullYear()} Dr's Kart. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Notify ALL admin users by email about an event.
 * @param {string} type - Event type label (e.g. 'New Registration')
 * @param {string} subject - Email subject
 * @param {string} bodyHtml - Body HTML content (injected inside branded template)
 */
const emailAdmins = async (type, subject, bodyHtml) => {
    try {
        const adminsResult = await db.query("SELECT email FROM users WHERE role = 'admin' AND email IS NOT NULL");
        if (adminsResult.rows.length === 0) return;

        const html = buildEmailHtml(subject, bodyHtml);
        const adminEmails = adminsResult.rows.map(r => r.email).filter(Boolean);

        for (const email of adminEmails) {
            sendTransactionalEmail(email, `[Dr's Kart Admin] ${subject}`, subject, html)
                .catch(err => console.error(`Failed to email admin ${email}:`, err));
        }
    } catch (err) {
        console.error('emailAdmins error:', err);
    }
};

/**
 * Send an email to a specific user by their userId.
 */
const emailUser = async (userId, subject, bodyHtml) => {
    try {
        const result = await db.query("SELECT email FROM users WHERE id = $1 AND email IS NOT NULL", [userId]);
        if (result.rows.length === 0 || !result.rows[0].email) return;
        const html = buildEmailHtml(subject, bodyHtml);
        sendTransactionalEmail(result.rows[0].email, subject, subject, html)
            .catch(err => console.error(`Failed to email user ${userId}:`, err));
    } catch (err) {
        console.error('emailUser error:', err);
    }
};

// ─── Pre-built Event Emails ─────────────────────────────────────────────────

const emailNewRegistration = (userEmail, userId) => {
    emailAdmins('NEW_USER', 'New User Registration', `
        <span class="badge">🎉 New Registration</span>
        <p class="text">A new user has just registered and verified their account on Dr's Kart.</p>
        <div class="highlight-box">
            <p><strong>Contact:</strong> ${userEmail}</p>
            <p><strong>User ID:</strong> #${userId}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
        <p class="text">You can view and manage this user in the Admin Panel.</p>
    `);
};

const emailNewEquipmentListing = (sellerEmail, sellerId, equipmentTitle, equipmentId) => {
    emailAdmins('NEW_LISTING', 'New Equipment Listed', `
        <span class="badge">📦 New Listing</span>
        <p class="text">A new equipment item has been listed on the platform.</p>
        <div class="highlight-box">
            <p><strong>Equipment:</strong> ${equipmentTitle}</p>
            <p><strong>Equipment ID:</strong> #${equipmentId}</p>
            <p><strong>Seller:</strong> ${sellerEmail || `User #${sellerId}`}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
        <p class="text">Review this listing in the Admin Panel.</p>
    `);
};

const emailNewInquiry = (sellerUserId, buyerEmail, equipmentTitle) => {
    emailUser(sellerUserId, `New Inquiry on Your Listing: ${equipmentTitle}`, `
        <span class="badge">💬 New Inquiry</span>
        <p class="text">Someone is interested in your equipment listing!</p>
        <div class="highlight-box">
            <p><strong>Equipment:</strong> ${equipmentTitle}</p>
            <p><strong>Buyer Contact:</strong> ${buyerEmail || 'N/A'}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
        <p class="text">Log in to your Dr's Kart dashboard to respond to this inquiry and start chatting.</p>
    `);
    // Also notify admins
    emailAdmins('NEW_INQUIRY', 'New Inquiry Received', `
        <span class="badge">💬 New Inquiry</span>
        <p class="text">A new inquiry has been submitted on the platform.</p>
        <div class="highlight-box">
            <p><strong>Equipment:</strong> ${equipmentTitle}</p>
            <p><strong>Buyer:</strong> ${buyerEmail || 'N/A'}</p>
        </div>
    `);
};

const emailNewMessage = (recipientUserId, senderName, messagePreview, equipmentTitle) => {
    emailUser(recipientUserId, `New message from ${senderName} — Dr's Kart`, `
        <span class="badge">✉️ New Message</span>
        <p class="text">You have received a new message on Dr's Kart.</p>
        <div class="highlight-box">
            <p><strong>From:</strong> ${senderName}</p>
            <p><strong>Regarding:</strong> ${equipmentTitle || 'Equipment inquiry'}</p>
            <p><strong>Message preview:</strong><br/><em>"${String(messagePreview).substring(0, 120)}${messagePreview.length > 120 ? '...' : ''}"</em></p>
        </div>
        <p class="text">Log in to Dr's Kart to read the full message and reply.</p>
    `);
};

const emailNewChatRoom = (equipmentTitle, inquiryId) => {
    emailAdmins('NEW_CHAT_ROOM', 'New Chat Room Opened', `
        <span class="badge">🗨️ Chat Started</span>
        <p class="text">A new chat room has been opened for an inquiry.</p>
        <div class="highlight-box">
            <p><strong>Equipment:</strong> ${equipmentTitle || 'N/A'}</p>
            <p><strong>Inquiry ID:</strong> #${inquiryId}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
    `);
};

const emailDealLocked = (sellerUserId, buyerUserId, equipmentTitle, equipmentId) => {
    // Email both parties
    emailUser(buyerUserId, `🔒 Deal Locked: ${equipmentTitle}`, `
        <span class="badge">🔒 Deal Locked</span>
        <p class="text">Great news! The seller has locked the deal on the following equipment.</p>
        <div class="highlight-box">
            <p><strong>Equipment:</strong> ${equipmentTitle}</p>
            <p><strong>Equipment ID:</strong> #${equipmentId}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
        <p class="text">Please coordinate with the seller via Dr's Kart chat to finalize the transaction.</p>
    `);
    emailUser(sellerUserId, `Deal Locked Confirmation: ${equipmentTitle}`, `
        <span class="badge">🔒 Deal Locked</span>
        <p class="text">You have successfully locked the deal on your equipment listing.</p>
        <div class="highlight-box">
            <p><strong>Equipment:</strong> ${equipmentTitle}</p>
            <p><strong>Equipment ID:</strong> #${equipmentId}</p>
        </div>
    `);
    // Admin notification
    emailAdmins('DEAL_LOCKED', `Deal Locked: ${equipmentTitle}`, `
        <span class="badge">🔒 Deal Locked</span>
        <p class="text">A deal has been locked on the platform.</p>
        <div class="highlight-box">
            <p><strong>Equipment:</strong> ${equipmentTitle}</p>
            <p><strong>Equipment ID:</strong> #${equipmentId}</p>
        </div>
    `);
};

const emailKycSubmission = (userId, userEmail) => {
    emailAdmins('KYC_SUBMITTED', 'New KYC Submission', `
        <span class="badge">📋 KYC Submitted</span>
        <p class="text">A user has submitted a KYC application for seller verification.</p>
        <div class="highlight-box">
            <p><strong>User:</strong> ${userEmail || `User #${userId}`}</p>
            <p><strong>User ID:</strong> #${userId}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
        <p class="text">Review and approve/reject this KYC in the Admin Panel.</p>
    `);
};

const emailNewLoginAlert = async (userEmail, ipAddress, userAgent) => {
    if (!userEmail) return;
    
    const subject = 'Security Alert: New Login Detected — Dr\'s Kart';
    const html = buildEmailHtml(
        subject,
        `
        <p class="text">We detected a new login to your Dr's Kart account from an IP address you haven't used before.</p>
        <div class="highlight-box">
            <p><strong>IP Address:</strong> ${ipAddress}</p>
            <p><strong>Device/Browser:</strong> ${userAgent || 'Unknown'}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
        <p class="text">If this was you, you can safely ignore this email.</p>
        <p class="text" style="color: #ef4444; font-weight: bold;">If you did not authorize this login, please contact support immediately.</p>
        `
    );

    await sendTransactionalEmail(userEmail, subject, subject, html)
        .catch(err => console.error(`Failed to send new login alert to ${userEmail}:`, err));
};

module.exports = {
    emailAdmins,
    emailUser,
    emailNewRegistration,
    emailNewEquipmentListing,
    emailNewInquiry,
    emailNewMessage,
    emailNewChatRoom,
    emailDealLocked,
    emailKycSubmission,
    emailNewLoginAlert,
};
