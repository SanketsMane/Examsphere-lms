
// Set env vars BEFORE importing lib/email
process.env.EMAIL_SERVICE = "gmail";
process.env.EMAIL_USER = "bksun170882@gmail.com";
process.env.EMAIL_PASS = "mwtinpysoylfarwj";
process.env.EMAIL_FROM = "KIDOKOOL <bksun170882@gmail.com>";

import { sendEmail } from '../lib/email';

async function main() {
    console.log("Testing email sending...");
    console.log(`Using user: ${process.env.EMAIL_USER}`);

    const success = await sendEmail({
        to: "bksun170882@gmail.com", // Send to self
        subject: "Test Email from KIDOKOOL Local Debug",
        html: "<h1>It Works!</h1><p>This is a test email to verify credentials.</p>"
    });

    if (success) {
        console.log("✅ Email sent successfully!");
    } else {
        console.error("❌ Email failed to send.");
    }
}

main().catch(console.error);
