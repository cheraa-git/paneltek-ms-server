import nodemailer from 'nodemailer'

class EmailService {
  sendMessage = async (to: string, subject: string, text: string) => {
    const transporter = nodemailer.createTransport({
      service: 'mail.ru',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
      }
    })

    await transporter.sendMail({ from: process.env.MAIL_USER, to, subject, text })

  }
}

export const emailService = new EmailService()
