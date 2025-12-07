This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## T&S Bouncy Castle Hire

This project is a booking management system for T&S Bouncy Castle Hire, featuring online booking, calendar management, hire agreements, and admin dashboard functionality.

### Key Features

- 📅 Online booking system with availability checking
- 📋 Digital hire agreements with e-signature capability
- 🏰 Castle fleet management
- 📊 Admin dashboard with analytics
- 📧 Automated email workflows
- 💳 Multiple payment methods (cash, bank transfer)

### Infrastructure

- **Database**: Neon PostgreSQL (serverless)
- **Hosting**: Vercel
- **Storage**: Vercel Blob (for images)
- **Framework**: Next.js 14 (App Router)

**Note**: Database migrated from Supabase to Neon on December 7, 2025. All 4 castles and 41 bookings migrated successfully with zero data loss. Backup available in `/backups/` directory.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

Note: This line was added to trigger a Vercel redeploy. (2025-07-25)
