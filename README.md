# MuscleX Gym Management System

MuscleX is a full-stack gym management platform built with **Next.js**, **React**, and **Supabase**. It provides tooling for running fitness centers, including membership management, billing, analytics, scheduling and more.

## Features

- **User Authentication** – Sign up and login flows powered by Supabase Auth.
- **Onboarding** – Guided setup for gyms, franchises and owners.
- **Dashboard** – Overview cards and charts for members, revenue and activity.
- **Member Management** – Add, edit, or import members in bulk and track check‑ins.
- **Class Scheduling** – Manage gym classes and trainers with calendars and capacity tracking.
- **Billing & Invoices** – Record payments, generate invoices and monitor overdue balances.
- **Inventory & Expenses** – Track equipment, supplies and operational expenses.
- **Franchise Support** – Manage multiple gym locations and staff roles.
- **Access Control** – Define rules and log member access.
- **Analytics** – Charts for attendance, revenue trends, member retention and more.
- **Multi‑Currency** – Currency utilities with automatic formatting and updates.

## Tech Stack

- [Next.js 14](https://nextjs.org/) & [React 18](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/) for type safety
- [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) and Radix components
- [Supabase](https://supabase.com/) for database, authentication and storage
- [Lucide](https://lucide.dev/) icons and other utility libraries

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file with your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to view the app.

### Database Migrations

This project uses Supabase. Migration scripts are located in `scripts/` and can be executed with the Supabase CLI:
```bash
./migration.sh
```
Use the provided shell or Python scripts to rename migration files if needed.

## Folder Structure

- `app/` – Next.js routes and pages
- `components/` – Reusable UI components (members, billing, dashboard, etc.)
- `hooks/` – React hooks for currency and notifications
- `lib/` – Supabase client helpers and context providers
- `types/` – TypeScript interfaces for database entities

## Deployment

The app is configured for Vercel deployment. Ensure environment variables are set in the Vercel dashboard and trigger a production build with `npm run build`.

## License

This project is provided as-is without any warranty. Feel free to customize it for your own gym management needs.
