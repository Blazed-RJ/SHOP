/**
 * Email utility using Brevo HTTP API (not SMTP)
 * Avoids Railway's SMTP port 587 blockage by using HTTPS (port 443)
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export const sendEmail = async ({ to, subject, html }) => {
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || 'rajatchauhan2754@gmail.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Shop App';

    if (!apiKey) {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[DEV] Email not sent (no BREVO_API_KEY). Subject: ${subject}`);
        } else {
            console.warn('[WARN] BREVO_API_KEY not set — OTP email not sent.');
        }
        return;
    }

    const payload = {
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html
    };

    const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Brevo API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    console.log(`[EMAIL] Sent to ${to} — messageId: ${data.messageId}`);
    return data;
};
