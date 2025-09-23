# Authentication Setup Guide

This project now uses username/password authentication instead of Google OAuth.

## Environment Variables

Add these variables to your `.env.local` file and Vercel environment variables:

```bash
# Authentication Configuration
ACCOUNTS=mpdee,tyler,shellee
PASS_HASH_MPDEE=$2a$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PASS_HASH_TYLER=$2a$12$yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
PASS_HASH_SHELLEE=$2a$12$zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz
SESSION_PASSWORD=change-me-to-a-strong-secret-32-chars-minimum
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=10
```

## Generating Password Hashes

Use the provided script to generate bcrypt hashes for passwords:

```bash
node scripts/hash-password.mjs "your-password-here"
```

This will output a bcrypt hash that you can use for the `PASS_HASH_*` environment variables.

## Setting Up Accounts

1. Generate password hashes for each user:

   ```bash
   node scripts/hash-password.mjs "mpdee-password"
   node scripts/hash-password.mjs "tyler-password"
   node scripts/hash-password.mjs "shellee-password"
   ```

2. Update the environment variables with the generated hashes

3. Set a strong session password (32+ characters)

## Security Features

- Passwords are hashed with bcrypt (12 rounds)
- Sessions use iron-session with HTTP-only cookies
- CSRF protection on login
- Rate limiting on login attempts
- Secure cookie settings in production

## Vercel Deployment

Make sure to add all the environment variables to your Vercel project settings under Environment Variables.

## Testing

1. Start the development server: `npm run dev`
2. Navigate to `/admin` - you should be redirected to `/admin/signin`
3. Use one of the configured usernames and passwords to log in
4. You should be redirected back to `/admin` after successful login
