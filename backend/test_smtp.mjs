import nodemailer from 'nodemailer';

const EMAIL_USER = 'rajatchauhan2754@gmail.com';
const EMAIL_PASS = 'ktbgbehxycvgbuqrdcye'; // App password from .env

console.log('🔍 Testing SMTP connection to Gmail...\n');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

try {
    // Verify connection
    console.log('📡 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    console.log('📧 Sending test email to', EMAIL_USER, '...');
    const info = await transporter.sendMail({
        from: EMAIL_USER,
        to: EMAIL_USER,
        subject: '🔑 SHOP OTP Test - ' + new Date().toLocaleTimeString(),
        html: '<h2>Test OTP: <b>123456</b></h2><p>If you received this, email delivery is working!</p>',
    });

    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
} catch (err) {
    console.error('❌ SMTP Error:', err.message);
    console.error('   Code:', err.code);
    console.error('\n💡 If "Invalid login" — the App Password may be wrong or expired.');
    console.error('   If "Connection refused" — Railway may be blocking port 587.');
}
