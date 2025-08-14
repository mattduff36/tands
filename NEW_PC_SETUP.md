# New PC Setup Guide - T&S Bouncy Castle Hire Project

## Project Overview
This is a Next.js 14 bouncy castle hire website with booking system, payment processing (Stripe), admin panel, and Google Calendar integration.

## Required Software & Tools

### 1. Node.js & Package Manager
- **Node.js**: Version 18.17.0 or higher (LTS recommended)
  - Download from: https://nodejs.org/
  - Verify installation: `node --version` and `npm --version`
- **Package Manager**: npm (comes with Node.js)

### 2. Git & Version Control
- **Git**: Latest version
  - Download from: https://git-scm.com/
  - Configure with your GitHub credentials:
    ```bash
    git config --global user.name "Your Name"
    git config --global user.email "your.email@example.com"
    ```

### 3. Code Editor
- **Cursor IDE**: Your preferred editor with AI assistance
  - Download from: https://cursor.sh/
- **VS Code Extensions** (if using VS Code as fallback):
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features
  - Prettier - Code formatter
  - ESLint

### 4. Database
- **PostgreSQL**: Version 14+ recommended
  - Download from: https://www.postgresql.org/download/
  - Or use a cloud service (Neon, Supabase, etc.)
  - You'll need the connection string for DATABASE_URL

### 5. Terminal/Shell (Windows)
- **Git Bash**: Comes with Git installation
- **Windows Terminal**: Recommended for better experience
- **Scoop** (optional): Package manager for Windows
  ```powershell
  # Install Scoop (run in PowerShell as admin)
  Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
  irm get.scoop.sh | iex
  ```

## Project Dependencies

### Core Framework & Runtime
```json
{
  "next": "14.x",
  "react": "18.x",
  "react-dom": "18.x",
  "typescript": "5.x"
}
```

### UI & Styling
```json
{
  "@radix-ui/react-*": "Various components",
  "tailwindcss": "3.x",
  "lucide-react": "Icons",
  "class-variance-authority": "Component variants",
  "clsx": "Conditional classes",
  "tailwind-merge": "Tailwind class merging"
}
```

### Database & ORM
```json
{
  "pg": "PostgreSQL client",
  "@types/pg": "TypeScript types for pg"
}
```

### Authentication
```json
{
  "next-auth": "Authentication library"
}
```

### Payment Processing
```json
{
  "@stripe/stripe-js": "Stripe client",
  "@stripe/react-stripe-js": "Stripe React components",
  "stripe": "Stripe server SDK"
}
```

### Forms & Validation
```json
{
  "react-hook-form": "Form handling",
  "zod": "Schema validation",
  "@hookform/resolvers": "Form resolvers"
}
```

### Date Handling
```json
{
  "date-fns": "Date utilities"
}
```

### Notifications
```json
{
  "sonner": "Toast notifications"
}
```

### Email
```json
{
  "nodemailer": "Email sending",
  "@types/nodemailer": "TypeScript types"
}
```

## Environment Variables Required

Create a `.env.local` file in the project root with these variables:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAILS=admin@example.com,admin2@example.com

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_test_... # Test key for development
STRIPE_PUBLISHABLE_KEY=pk_test_... # Test key for development
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook endpoint secret

# Google Calendar Integration
GOOGLE_CALENDAR_API_KEY=your-google-calendar-api-key
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com

# Address Autocomplete Services
GEOAPIFY_API_KEY=your-geoapify-api-key # Fallback service
GETADDRESS_API_KEY=your-getaddress-api-key # Preferred service
OS_PLACES_API_KEY=your-ordnance-survey-api-key # Secondary fallback

# Email Configuration (if using SMTP)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

## Setup Steps

### 1. Clone Repository
```bash
git clone https://github.com/mattduff36/tands.git
cd tands
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
# If using local PostgreSQL, create database
createdb bouncy_castle_bookings

# Initialize database tables (if migration scripts exist)
npm run db:migrate
# OR manually run SQL from documentation
```

### 4. Environment Configuration
- Copy `.env.example` to `.env.local` (if exists)
- Fill in all required environment variables
- Ensure database connection works

### 5. Development Server
```bash
npm run dev
```
- Open http://localhost:3000
- Admin panel: http://localhost:3000/admin

### 6. Build & Test
```bash
# Build for production
npm run build

# Run linting
npm run lint

# Type checking
npm run type-check # (if script exists)
```

## API Keys & Services Setup

### Stripe (Payment Processing)
1. Create account at https://stripe.com
2. Get test API keys from Dashboard > Developers > API keys
3. Set up webhook endpoint for payment confirmations
4. Add webhook URL: `https://yourdomain.com/api/payments/webhook`

### Google Calendar API
1. Go to Google Cloud Console
2. Create project and enable Calendar API
3. Create service account or API key
4. Get calendar ID from Google Calendar settings

### Address Autocomplete Services
1. **getAddress.io** (preferred): https://getaddress.io/
2. **Ordnance Survey Places** (fallback): https://developer.ordnancesurvey.co.uk/
3. **Geoapify** (secondary fallback): https://www.geoapify.com/

### Email Service
- Configure SMTP settings for transactional emails
- Or use service like SendGrid, Mailgun, etc.

## Project Structure
```
tands/
├── src/
│   ├── app/                 # Next.js 14 App Router
│   │   ├── admin/          # Admin panel pages
│   │   ├── api/            # API routes
│   │   └── hire-agreement/ # Customer agreement signing
│   ├── components/         # React components
│   │   ├── admin/         # Admin-specific components
│   │   ├── payment/       # Stripe payment components
│   │   ├── sections/      # Page sections
│   │   └── ui/           # Base UI components (Shadcn)
│   ├── lib/              # Utility libraries
│   │   ├── auth/         # Authentication config
│   │   ├── database/     # Database operations
│   │   ├── email/        # Email templates & sending
│   │   ├── types/        # TypeScript definitions
│   │   └── utils/        # Helper functions
│   └── hooks/            # Custom React hooks
├── public/               # Static assets
├── data/                 # Castle data JSON
└── docs/                 # Project documentation
```

## Common Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues

# Database (if scripts exist)
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed initial data

# Deployment
vercel                   # Deploy to Vercel (if Vercel CLI installed)
```

## Troubleshooting

### Common Issues
1. **Node version mismatch**: Use Node.js 18+ LTS
2. **Database connection**: Check DATABASE_URL format and credentials
3. **Stripe webhooks**: Ensure webhook endpoint is accessible
4. **Environment variables**: Double-check all required vars are set
5. **Port conflicts**: Default port 3000, change with `PORT=3001 npm run dev`

### Database Connection Test
```bash
# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT version();"
```

### Stripe CLI (for webhook testing)
```bash
# Install Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login and forward webhooks to local dev
stripe login
stripe listen --forward-to localhost:3000/api/payments/webhook
```

## Production Deployment

### Vercel (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Link project: `vercel link`
3. Set environment variables in Vercel dashboard
4. Deploy: `vercel --prod`

### Environment Variables in Production
- Set all `.env.local` variables in Vercel dashboard
- Use production Stripe keys
- Update NEXTAUTH_URL to production domain
- Ensure database is accessible from production

## Security Notes
- Never commit `.env.local` to git
- Use strong secrets for NEXTAUTH_SECRET
- Rotate API keys regularly
- Use HTTPS in production
- Validate all user inputs
- Keep dependencies updated

## Support & Resources
- Next.js Documentation: https://nextjs.org/docs
- Stripe Documentation: https://stripe.com/docs
- Tailwind CSS: https://tailwindcss.com/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs/

---

**Last Updated**: December 2024
**Node Version**: 18.17.0+
**Next.js Version**: 14.x
