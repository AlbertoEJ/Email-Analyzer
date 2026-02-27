import { google, gmail_v1 } from 'googleapis';
import { prisma } from '../config/database';
import { createOAuth2Client } from '../config/gmail';
import { decrypt } from '../utils/crypto';
import { parseGmailMessage, ParsedEmail } from '../utils/email-parser';
import { logger } from '../utils/logger';

export class GmailService {
  private getAuthenticatedClient(accessToken: string, refreshToken: string) {
    const client = createOAuth2Client();
    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return client;
  }

  async getUserGmail(userId: string): Promise<gmail_v1.Gmail> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.encryptedAccessToken || !user.encryptedRefreshToken) {
      throw new Error('User not authenticated with Gmail');
    }

    const accessToken = decrypt(user.encryptedAccessToken);
    const refreshToken = decrypt(user.encryptedRefreshToken);
    const auth = this.getAuthenticatedClient(accessToken, refreshToken);

    return google.gmail({ version: 'v1', auth });
  }

  async listMessages(
    userId: string,
    options: { maxResults?: number; query?: string; pageToken?: string } = {}
  ): Promise<{ messages: gmail_v1.Schema$Message[]; nextPageToken?: string }> {
    const gmail = await this.getUserGmail(userId);

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: options.maxResults || 20,
      q: options.query || 'in:inbox',
      pageToken: options.pageToken,
    });

    const messageIds = response.data.messages || [];
    const messages: gmail_v1.Schema$Message[] = [];

    // Fetch full messages in batches of 10
    for (let i = 0; i < messageIds.length; i += 10) {
      const batch = messageIds.slice(i, i + 10);
      const fullMessages = await Promise.all(
        batch.map((msg) =>
          gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'full',
          })
        )
      );
      messages.push(...fullMessages.map((m) => m.data));
    }

    return {
      messages,
      nextPageToken: response.data.nextPageToken || undefined,
    };
  }

  async getMessage(userId: string, messageId: string): Promise<ParsedEmail> {
    const gmail = await this.getUserGmail(userId);

    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    return parseGmailMessage(response.data);
  }

  async getAttachmentData(
    userId: string,
    messageId: string,
    attachmentId: string
  ): Promise<Buffer> {
    const gmail = await this.getUserGmail(userId);

    const response = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId,
      id: attachmentId,
    });

    const data = response.data.data || '';
    return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  }
}

export const gmailService = new GmailService();
