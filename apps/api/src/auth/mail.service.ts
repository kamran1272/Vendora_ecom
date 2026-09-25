import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import * as nodemailer from 'nodemailer'

@Injectable()
export class MailService {
  private readonly transporter = this.createTransporter()

  private createTransporter() {
    const host = process.env.MAIL_HOST?.trim()
    const user = process.env.MAIL_USER?.trim()
    const password = process.env.MAIL_PASSWORD?.trim()
    const port = Number(process.env.MAIL_PORT || 587)

    if (!host || !user || !password) return null

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
    })
  }

  async sendAccountLink(to: string, subject: string, title: string, link: string, action: string) {
    if (!this.transporter) {
      throw new ServiceUnavailableException('Email delivery is not configured.')
    }

    const from = process.env.MAIL_FROM?.trim() || process.env.MAIL_USER?.trim()
    if (!from) throw new ServiceUnavailableException('Email sender is not configured.')

    await this.transporter.sendMail({
      from,
      to,
      subject,
      text: `${title}\n\n${action}: ${link}\n\nThis link expires soon. If you did not request it, you can ignore this email.`,
      html: `<p>${title}</p><p><a href="${link}">${action}</a></p><p>This link expires soon. If you did not request it, you can ignore this email.</p>`,
    })
  }
}
