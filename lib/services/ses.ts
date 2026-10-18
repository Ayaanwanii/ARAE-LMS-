import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import nodemailer from "nodemailer";

const ses = new SESClient({
    region: process.env.AWS_REGION || "ap-southeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

// Configure generic transporter for MIME generation only (returns Buffer)
const transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true
});

export const sendEmail = async ({
    to,
    subject,
    html,
    attachments = [],
    configurationSetName,
    tags = [],
}: {
    to: string[];
    subject: string;
    html: string;
    attachments?: { name: string; url: string }[];
    configurationSetName?: string;
    tags?: { Name: string; Value: string }[];
}) => {
    const fromEmail = process.env.SES_FROM_EMAIL;

    if (!fromEmail) {
        throw new Error("SES_FROM_EMAIL environment variable is not defined");
    }

    try {
        // 1. Generate Raw Email MIME content using Nodemailer
        // By using streamTransport + buffer, this returns the raw built message as a Buffer
        const info: any = await transporter.sendMail({
            from: fromEmail,
            to: to,
            subject: subject,
            html: html,
            attachments: attachments.map(att => ({
                filename: att.name,
                path: att.url,
            })),
        });

        // 2. Send the raw content using AWS SDK directly
        // This bypasses Nodemailer's internal SES transport quirks completely
        const rawMessageData = info.message; // Buffer

        const command = new SendRawEmailCommand({
            Source: fromEmail,
            Destinations: to,
            RawMessage: {
                Data: rawMessageData,
            },
            ConfigurationSetName: configurationSetName,
            Tags: tags,
        });

        const result = await ses.send(command);

        console.log("Email sent successfully via Raw SES:", result.MessageId);
        return { messageId: result.MessageId };

    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};
