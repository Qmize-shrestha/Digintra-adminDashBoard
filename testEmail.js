const dotenv = require("dotenv");
const sendEmail = require("./utils/sendEmail");

// Load env variables
dotenv.config();

const testNodemailer = async () => {
    try {
        console.log("Attempting to send a test email..."); 
        
        await sendEmail({
            email: "subi84864@gmail.com", // It doesn't matter what email this is if using Mailtrap
            subject: "Nodemailer Test",
            message: "Hello! If you are reading this, Nodemailer is working perfectly!",
        });

        console.log("✅ Success! Check your Mailtrap inbox (or real inbox if using a real provider).");
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to send email. Check your .env credentials.");
        console.error("Error details:", error.message);
        process.exit(1);
    }
};

testNodemailer();
