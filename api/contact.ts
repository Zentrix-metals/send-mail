import type { VercelRequest, VercelResponse } from '@vercel/node';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
    console.error('Missing SMTP_USER or SMTP_PASSWORD environment variables.');
    return res.status(500).json({ message: 'Failed to send message' });
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
      to: smtpUser,
      replyTo: email.trim(),
      subject: `New contact request from ${name.trim()}`,
      text: `Name: ${name.trim()}\nEmail: ${email.trim()}\n\nMessage:\n${message.trim()}`,
    });

    return res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending email through SMTP:', error);
    return res.status(500).json({ message: 'Failed to send message' });
  }
}

// Built-in lightweight local development server for environments outside Vercel
const isDirectExecution =
  typeof process.argv[1] === 'string' &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution && !process.env.VERCEL) {
  const port = Number(process.env.PORT) || 3000;

  const server = http.createServer((req, res) => {
    const vercelRes = res as unknown as VercelResponse;
    vercelRes.status = (statusCode: number) => {
      res.statusCode = statusCode;
      return vercelRes;
    };
    vercelRes.json = (jsonBody: unknown) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(jsonBody));
      return vercelRes;
    };
    vercelRes.send = (sendBody: unknown) => {
      if (typeof sendBody === 'object') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(sendBody));
      } else {
        res.end(String(sendBody));
      }
      return vercelRes;
    };

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/api/contact') {
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', async () => {
        let parsedBody: unknown = null;
        if (data) {
          try {
            parsedBody = JSON.parse(data);
          } catch {
            parsedBody = data;
          }
        }
        (req as unknown as VercelRequest).body = parsedBody;

        try {
          await handler(req as unknown as VercelRequest, vercelRes);
        } catch (err) {
          console.error('Local server error:', err);
          if (!res.writableEnded) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: 'Failed to send message' }));
          }
        }
      });
    } else {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          service: 'contact-email-service',
          status: 'running',
          endpoint: '/api/contact',
          method: 'POST',
        })
      );
    }
  });

  server.listen(port, () => {
    console.log(`Contact email service running at http://localhost:${port}/api/contact`);
  });
}
