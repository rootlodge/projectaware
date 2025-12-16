export interface EmailProvider {
  send(params: EmailParams): Promise<EmailResult>;
  test(): Promise<boolean>;
}

export interface EmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailCredentials {
  // SMTP
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;

  // SendGrid
  apiKey?: string;

  // Other providers
  [key: string]: unknown;
}
