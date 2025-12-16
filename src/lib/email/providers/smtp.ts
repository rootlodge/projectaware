import nodemailer from "nodemailer";
import type { EmailProvider, EmailParams, EmailResult, EmailCredentials } from "./base";

export class SMTPProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private fromName?: string;

  constructor(credentials: EmailCredentials, fromEmail: string, fromName?: string) {
    if (!credentials.host || !credentials.port) {
      throw new Error("SMTP host and port are required");
    }

    this.fromEmail = fromEmail;
    this.fromName = fromName;

    this.transporter = nodemailer.createTransporter({
      host: credentials.host,
      port: credentials.port,
      secure: credentials.secure ?? false,
      auth: credentials.user && credentials.pass
        ? {
            user: credentials.user,
            pass: credentials.pass,
          }
        : undefined,
    });
  }

  async send(params: EmailParams): Promise<EmailResult> {
    try {
      const from = params.from || (this.fromName 
        ? `"${this.fromName}" <${this.fromEmail}>`
        : this.fromEmail);

      const info = await this.transporter.sendMail({
        from,
        to: Array.isArray(params.to) ? params.to.join(", ") : params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: params.replyTo,
        attachments: params.attachments,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async test(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
