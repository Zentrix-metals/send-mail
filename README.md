# Contact Email Service

A minimal, standalone TypeScript backend API deployed as a Vercel Serverless Function to handle contact form submissions from an external frontend. It relays messages to your GoDaddy / Titan mailbox using SMTP and Nodemailer.

---

## What This Project Does

- Exposes a serverless endpoint at `POST /api/contact`
- Accepts visitor contact submissions (`name`, `email`, `message`)
- Validates request payloads and basic email format
- Handles CORS preflight (`OPTIONS`) restricted to your configured `ALLOWED_ORIGIN`
- Connects securely to GoDaddy/Titan SMTP (`smtpout.secureserver.net:465`)
- Sends plain text emails directly to your mailbox with the visitor's email set as `Reply-To`

---

## Installation

Clone or copy this repository, then install dependencies:

```bash
npm install
```

---

## Required Environment Variables

Create a local `.env` file (or configure these in your deployment platform):

| Variable | Description | Example |
| :--- | :--- | :--- |
| `SMTP_USER` | Your GoDaddy/Titan email address | `contact@yourdomain.com` |
| `SMTP_PASSWORD` | Your email password or app password | `your-secure-password` |
| `ALLOWED_ORIGIN` | The exact URL of your deployed frontend application | `https://your-frontend-domain.com` |

See `.env.example` for reference:

```env
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-email-password
ALLOWED_ORIGIN=https://your-frontend-domain.com
```

---

## Local Development

You can test this endpoint locally using the Vercel CLI:

1. Install the Vercel CLI globally if you haven't already:
   ```bash
   npm i -g vercel
   ```
2. Create a `.env.local` file containing your `SMTP_USER`, `SMTP_PASSWORD`, and `ALLOWED_ORIGIN`.
3. Start the local serverless development server:
   ```bash
   vercel dev
   ```
4. The endpoint will be available locally at:
   ```text
   http://localhost:3000/api/contact
   ```

---

## Vercel Deployment Instructions

1. Push this repository to GitHub or GitLab.
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** > **Project**.
3. Import this repository.
4. Leave framework presets as **Other** (Vercel automatically detects the `/api` serverless function).
5. Configure the Environment Variables (see below) before clicking **Deploy**.
6. Click **Deploy**.

---

## Configuring Environment Variables in Vercel

1. In the Vercel project settings, navigate to **Settings** > **Environment Variables**.
2. Add the following keys:
   - `SMTP_USER`: Your GoDaddy / Titan email address
   - `SMTP_PASSWORD`: Your email account password
   - `ALLOWED_ORIGIN`: Your frontend URL (e.g., `https://my-portfolio.com` or `http://localhost:5173` for testing)
3. Select the environments (**Production**, **Preview**, **Development**).
4. Save the variables. (If already deployed, trigger a redeployment for variables to take effect).

---

## Example Frontend Request

In your React frontend application, call the API endpoint:

```ts
const response = await fetch(
  'https://YOUR-PROJECT.vercel.app/api/contact',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      email,
      message
    })
  }
);

if (response.ok) {
  const data = await response.json();
  console.log('Success:', data.message); // "Message sent successfully"
} else {
  const errorData = await response.json();
  console.error('Error:', errorData.message);
}
```

---

## API Reference

### `POST /api/contact`

**Request Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "message": "Hello, I would like to inquire about your services."
}
```

**Responses:**

- `200 OK`:
  ```json
  { "message": "Message sent successfully" }
  ```
- `400 Bad Request` (Validation error):
  ```json
  { "message": "Validation error" }
  ```
- `405 Method Not Allowed`:
  ```json
  { "message": "Method not allowed" }
  ```
- `500 Internal Server Error`:
  ```json
  { "message": "Failed to send message" }
  ```
