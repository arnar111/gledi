
import "dotenv/config";
import { sendSms } from "./server/twilio";

async function test() {
    const to = "+3548688303";
    const message = "Test message from debug script";

    // Hardcode ASCII Sender ID
    const senderId = "Gledinefndin";
    process.env.TWILIO_SENDER_ID = senderId;

    console.log(`Using Sender ID: ${senderId}`);
    console.log(`Sending to: ${to}`);

    try {
        const result = await sendSms({ to, message });
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Unhandle Error:", error);
    }
}

test();
