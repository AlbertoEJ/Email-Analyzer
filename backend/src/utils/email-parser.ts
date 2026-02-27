import * as cheerio from 'cheerio';
import { extractUrls } from './url-extractor';

export interface ParsedEmail {
  id: string;
  subject: string;
  sender: string;
  senderEmail: string;
  recipients: string[];
  date: Date;
  snippet: string;
  bodyText: string;
  bodyHtml: string;
  headers: Record<string, string>;
  authenticationResults: string;
  receivedHeaders: string[];
  urls: string[];
  attachments: AttachmentInfo[];
}

export interface AttachmentInfo {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

export function parseGmailMessage(message: any): ParsedEmail {
  const headers = extractHeaders(message.payload?.headers || []);
  const body = extractBody(message.payload);
  const sender = headers['from'] || '';
  const senderEmail = extractEmailAddress(sender);

  return {
    id: message.id,
    subject: headers['subject'] || '(No Subject)',
    sender,
    senderEmail,
    recipients: parseRecipients(headers['to'] || ''),
    date: new Date(headers['date'] || message.internalDate),
    snippet: message.snippet || '',
    bodyText: body.text,
    bodyHtml: body.html,
    headers,
    authenticationResults: headers['authentication-results'] || '',
    receivedHeaders: extractReceivedHeaders(message.payload?.headers || []),
    urls: extractUrls(body.text + ' ' + body.html),
    attachments: extractAttachments(message.payload),
  };
}

function extractHeaders(headers: Array<{ name: string; value: string }>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const header of headers) {
    result[header.name.toLowerCase()] = header.value;
  }
  return result;
}

function extractReceivedHeaders(headers: Array<{ name: string; value: string }>): string[] {
  return headers
    .filter((h) => h.name.toLowerCase() === 'received')
    .map((h) => h.value);
}

function extractEmailAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from.trim();
}

function parseRecipients(to: string): string[] {
  return to
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);
}

function extractBody(payload: any): { text: string; html: string } {
  const result = { text: '', html: '' };
  if (!payload) return result;

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    result.text = decodeBase64Url(payload.body.data);
  } else if (payload.mimeType === 'text/html' && payload.body?.data) {
    result.html = decodeBase64Url(payload.body.data);
    result.text = htmlToText(result.html);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const partBody = extractBody(part);
      if (!result.text && partBody.text) result.text = partBody.text;
      if (!result.html && partBody.html) result.html = partBody.html;
    }
  }

  return result;
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function htmlToText(html: string): string {
  const $ = cheerio.load(html);
  $('script, style').remove();
  return $.text().replace(/\s+/g, ' ').trim();
}

function extractAttachments(payload: any): AttachmentInfo[] {
  const attachments: AttachmentInfo[] = [];
  if (!payload) return attachments;

  if (payload.filename && payload.body?.attachmentId) {
    attachments.push({
      filename: payload.filename,
      mimeType: payload.mimeType || 'application/octet-stream',
      size: payload.body.size || 0,
      attachmentId: payload.body.attachmentId,
    });
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      attachments.push(...extractAttachments(part));
    }
  }

  return attachments;
}
