import { Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import * as path from 'path'

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.titan.email',
      port: 465,
      secure: true,
      auth: {
        user: 'kmena@corpsoftsa.com',
        pass: 'Corpsoft1.*',
      },
    })
  }

  // Método para enviar correos con archivo adjunto
  async sendMailWithAttachment(
    to: string,
    subject: string,
    text: string,
    attachmentPath: string,
    html?: string,
  ): Promise<void> {
    const mailOptions = {
      from: '"Asamblea de Dios" <kmena@corpsoftsa.com>',
      to,
      subject,
      text,
      html,
      attachments: [
        {
          filename: path.basename(attachmentPath), // Nombre del archivo adjunto
          path: attachmentPath, // Ruta al archivo en el servidor
        },
      ],
    }

    await this.transporter.sendMail(mailOptions)
  }
}
