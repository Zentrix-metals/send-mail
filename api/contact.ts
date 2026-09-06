import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void | VercelResponse> {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '';

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const body = req.body;

  if (!body || typeof body !== 'object') {
    return res.status(400).json({ message: 'Validation error' });
  }

  const { name, email, message } = body as Record<string, unknown>;

  if (
    typeof name !== 'string' ||
    name.trim().length === 0 ||
    typeof email !== 'string' ||
    email.trim().length === 0 ||
    !EMAIL_REGEX.test(email.trim()) ||
    typeof message !== 'string' ||
    message.trim().length === 0
  ) {
    return res.status(400).json({ message: 'Validation error' });
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpUser || !smtpPassword) {
    console.error(
      'Missing SMTP_USER or SMTP_PASSWORD environment variables.'
    );

    return res.status(500).json({
      message: 'Failed to send message',
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtpout.secureserver.net',
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    await transporter.sendMail({
      from: smtpUser,
      to: 'recruitment.department121@gmail.com',
      replyTo: email.trim(),
      subject: `New contact request from ${name.trim()}`,
      text: `Name: ${name.trim()}\nEmail: ${email.trim()}\n\nMessage:\n${message.trim()}`,
    });

    return res.status(200).json({
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Error sending email through SMTP:', error);

    return res.status(500).json({
      message: 'Failed to send message',
    });
  }
}
