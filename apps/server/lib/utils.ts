import { redis_events_processed } from "./redis"
import { resend } from "..";
import { SERVER_URL } from "./config";
import { generateLinkToken } from "./token";
import {type CreateEmailResponseSuccess, type ErrorResponse } from 'resend';


export const pendingRequests = new Map();

async function processIncomingMessage(streamName: string, messages: [id: string, fields: string[]][]): Promise<any> {

    const user_data = await JSON.parse(messages[0][1][1])

    return user_data;

}


export async function sendResendEmail(email: string): Promise<{data: CreateEmailResponseSuccess | null, error: ErrorResponse | null}> {

    const token = generateLinkToken(email);

    const link = `${SERVER_URL}/api/v1/signin/post?token=${token}`;
  
    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: [email],
      subject: "Your Login Link",
      html: `<strong>Here is your link: ${link}</strong>`,
    });

    return {data, error}
}