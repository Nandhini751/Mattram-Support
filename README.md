# Maatram Student Support: setup guide

## 1. Create the project (in a terminal)
    npx create-next-app@latest maatram-support
Answer the prompts: TypeScript **No**, ESLint Yes, Tailwind **Yes**, src directory **No**, App Router **Yes**, Turbopack any, import alias **@/*** (default).

    cd maatram-support
    npm install @supabase/supabase-js @supabase/ssr recharts

## 2. Copy these files in
Copy everything from this folder into your project, replacing files when asked
(app/, components/, lib/, middleware.js, vercel.json). Delete `app/page.tsx`, `app/layout.tsx`
and `app/globals.css` if they still exist as .tsx versions, because the .js versions replace them.
Rename `.env.local.example` to `.env.local`.

## 3. Supabase
1. Create a project at supabase.com.
2. Authentication > Sign In / Providers > Email: turn OFF "Confirm email" (demo only).
3. SQL Editor: paste and run `supabase/schema.sql`.
4. Project Settings > API: copy the Project URL, anon key and service_role key into `.env.local`.
   The service_role key is secret. Never share it or put it on GitHub.

## 4. Run
    npm run dev
Open http://localhost:3000, click "Need a demo account? Sign up", and create:
2 coordinators, 1 admin, 1 student representative. Then run `supabase/seed.sql` in the SQL Editor for dummy data.

## 5. Test reminders
Open: http://localhost:3000/api/cron/reminders?secret=YOUR_CRON_SECRET
With no RESEND_API_KEY the emails are printed in the terminal where `npm run dev` runs.
Emails are logged so the same reminder is not sent twice.

## Notes
- Vercel's free plan only runs cron once a day, hence the daily schedule in vercel.json.
- Resend's test sender (onboarding@resend.dev) only delivers to your own email address.
- Sign-up lets people pick their role. That is for the demo only. In real use, admins would assign roles.
- Dummy data only. Never load real student details.

## Theme
Colours live in `app/globals.css` (three hex values). Save the Maatram logo as `public/logo.png`
(right-click the logo on maatramfoundation.com > Save image as).
