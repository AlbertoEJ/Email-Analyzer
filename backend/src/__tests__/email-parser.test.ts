import { describe, it, expect } from 'vitest';
import { parseGmailMessage } from '../utils/email-parser';

describe('parseGmailMessage', () => {
  const mockMessage = {
    id: 'msg-123',
    snippet: 'Hello world',
    internalDate: '1700000000000',
    payload: {
      headers: [
        { name: 'From', value: 'John Doe <john@example.com>' },
        { name: 'To', value: 'jane@example.com, bob@example.com' },
        { name: 'Subject', value: 'Test Email' },
        { name: 'Date', value: 'Wed, 15 Nov 2023 12:00:00 +0000' },
        {
          name: 'Authentication-Results',
          value: 'spf=pass dkim=pass dmarc=pass',
        },
        { name: 'Received', value: 'from mx.example.com' },
      ],
      mimeType: 'text/plain',
      body: {
        data: Buffer.from('Hello, this is a test email with https://example.com').toString('base64'),
      },
    },
  };

  it('should parse subject', () => {
    const result = parseGmailMessage(mockMessage);
    expect(result.subject).toBe('Test Email');
  });

  it('should extract sender email', () => {
    const result = parseGmailMessage(mockMessage);
    expect(result.senderEmail).toBe('john@example.com');
  });

  it('should parse recipients', () => {
    const result = parseGmailMessage(mockMessage);
    expect(result.recipients).toHaveLength(2);
    expect(result.recipients).toContain('jane@example.com');
  });

  it('should extract authentication results', () => {
    const result = parseGmailMessage(mockMessage);
    expect(result.authenticationResults).toContain('spf=pass');
  });

  it('should extract URLs from body', () => {
    const result = parseGmailMessage(mockMessage);
    expect(result.urls).toContain('https://example.com');
  });

  it('should handle missing subject', () => {
    const msg = {
      ...mockMessage,
      payload: {
        ...mockMessage.payload,
        headers: mockMessage.payload.headers.filter(
          (h) => h.name !== 'Subject'
        ),
      },
    };
    const result = parseGmailMessage(msg);
    expect(result.subject).toBe('(No Subject)');
  });

  it('should extract received headers', () => {
    const result = parseGmailMessage(mockMessage);
    expect(result.receivedHeaders).toHaveLength(1);
    expect(result.receivedHeaders[0]).toContain('mx.example.com');
  });
});
