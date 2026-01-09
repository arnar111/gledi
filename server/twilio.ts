import twilio from 'twilio';

//Environment variables should be loaded by the server before this module is imported
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

// Initialize Twilio client (will be null if credentials not set)
let client: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
    if (!accountSid || !authToken) {
        throw new Error('Twilio credentials not found in environment variables');
    }
    if (!client) {
        client = twilio(accountSid, authToken);
    }
    return client;
}

export interface SendSmsOptions {
    to: string;
    message: string;
}

export interface SendSmsResult {
    success: boolean;
    messageSid?: string;
    error?: string;
}

/**
 * Send an SMS message to a single recipient
 * @param options - The SMS options (to, message)
 * @returns Promise with the result
 */
export async function sendSms(options: SendSmsOptions): Promise<SendSmsResult> {
    try {
        const { to, message } = options;

        // Validate phone number format (should be in E.164 format: +[country code][number])
        if (!to.startsWith('+')) {
            return {
                success: false,
                error: `Invalid phone format: ${to}. Must start with + and country code.`,
            };
        }

        // Send via Messaging Service if available, otherwise use a phone number
        const messageOptions: any = {
            body: message,
            to: to,
        };

        const senderId = process.env.TWILIO_SENDER_ID;
        if (senderId) {
            messageOptions.from = senderId;
        }

        if (messagingServiceSid) {
            messageOptions.messagingServiceSid = messagingServiceSid;
        } else if (!senderId) {
            // Fallback: would need TWILIO_PHONE_NUMBER in .env if no MS and no Sender ID
            const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
            if (!phoneNumber) {
                throw new Error('Neither TWILIO_MESSAGING_SERVICE_SID, TWILIO_SENDER_ID, nor TWILIO_PHONE_NUMBER is set');
            }
            messageOptions.from = phoneNumber;
        }

        let twilioMessage;

        try {
            twilioMessage = await getTwilioClient().messages.create(messageOptions);
        } catch (initialError: any) {
            // If the error is related to the Sender ID (e.g., Alphanumeric ID not enabled or invalid),
            // and we tried to use a specific Sender ID, retry without it (letting Messaging Service decide).
            if (senderId && (initialError.code === 21212 || initialError.code === 21612)) {
                console.warn(`Failed to send with Sender ID "${senderId}". Retrying with default configuration...`);
                delete messageOptions.from;
                twilioMessage = await getTwilioClient().messages.create(messageOptions);
            } else {
                throw initialError;
            }
        }

        return {
            success: true,
            messageSid: twilioMessage.sid,
        };
    } catch (error: any) {
        console.error('Twilio SMS Error:', error);
        return {
            success: false,
            error: error.message || 'Unknown error sending SMS',
        };
    }
}

/**
 * Send SMS messages to multiple recipients
 * @param recipients - Array of phone numbers
 * @param message - The message to send
 * @returns Promise with results for each recipient
 */
export async function sendBulkSms(
    recipients: string[],
    message: string
): Promise<{ sent: number; failed: number; results: SendSmsResult[] }> {
    const results = await Promise.all(
        recipients.map((to) => sendSms({ to, message }))
    );

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return { sent, failed, results };
}
