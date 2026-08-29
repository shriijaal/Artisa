# Email/OTP Configuration

**Current Status:** Development Mode (Console Email)

---

## How OTP/Email Works Currently

**Email Backend:** `django.core.mail.backends.console.EmailBackend`

This means:
- **No actual emails are sent** to user email addresses
- **Email content is printed to the backend terminal console**
- This is a Django development setting for testing without a real email service

---

## Where to Find OTP Codes

### Password Reset

When a user requests a password reset:

1. The email content (including reset link/token) is printed in the **backend terminal**
2. Look for output like:
   ```
   Subject: Password Reset Request
   To: user@example.com
   From: webmaster@localhost
   Date: [timestamp]
   
   You're receiving this email because you requested a password reset...
   [Reset link/token will be here]
   ```

3. Copy the reset link/token from the terminal and use it in the frontend

---

## Production Email Setup

To send real emails in production, you need to:

### 1. Choose an Email Service

Options:
- **SendGrid** (recommended, free tier available)
- **Mailgun** (free tier available)
- **AWS SES** (pay-as-you-go)
- **Gmail SMTP** (for small projects, requires app password)

### 2. Update Settings

In `backend/artisa/settings.py`, change:

```python
# Development (current)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Production (example with SendGrid)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.sendgrid.net'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'apikey'  # SendGrid API key
EMAIL_HOST_PASSWORD = 'YOUR_SENDGRID_API_KEY'
DEFAULT_FROM_EMAIL = 'noreply@artisa.com'
```

### 3. Add Environment Variables

Add to `.env` file:
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your_sendgrid_api_key
DEFAULT_FROM_EMAIL=noreply@artisa.com
```

---

## Two-Factor Authentication (2FA)

**Current Status:** Not implemented

The plan mentions 2FA as an **optional future enhancement**. Currently:
- **No OTP codes are sent during login**
- Login only requires username/email and password
- No SMS verification

### To Add 2FA (Future Task)

Would require:
1. Install `django-otp` or similar package
2. Add phone number field to User model
3. Integrate SMS service (Twilio, AWS SNS, etc.)
4. Generate and verify OTP codes during login
5. Add backup codes for account recovery

---

## Testing Email in Development

### Option 1: Console (Current)
- Emails appear in backend terminal
- No external service needed
- Good for development

### Option 2: Mailhog (Local Email Testing)
Run a local email testing server:
```bash
# Install Mailhog
docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Update settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'localhost'
EMAIL_PORT = 1025
```
Then view emails at `http://localhost:8025`

### Option 3: Real Email Service (Testing)
Use SendGrid/Mailgun sandbox mode to test without sending real emails.

---

## Summary

**Current Behavior:**
- Password reset emails → Printed to backend console
- Login → No OTP/2FA (password only)
- Email verification → Not implemented (optional stretch goal)

**To Send Real Emails:**
1. Choose email service (SendGrid recommended)
2. Get API key
3. Update `EMAIL_BACKEND` settings
4. Add credentials to `.env`

**To Add 2FA:**
- Future enhancement (not currently implemented)
- Requires SMS service integration
