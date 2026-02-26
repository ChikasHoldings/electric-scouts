# ElectricScouts

**ElectricScouts** is a modern electricity rate comparison platform that helps Texas consumers find the best energy plans. Built with React, Supabase, and Vercel.

## Features

- **Rate Comparison** — Compare electricity plans across providers by ZIP code, usage, and plan type
- **Provider Directory** — Browse detailed profiles for major Texas electricity providers
- **Bill Analyzer** — Upload an electricity bill and get AI-powered savings recommendations
- **Learning Center** — Educational articles about energy savings, deregulation, and renewables
- **Business Quotes** — Custom quote request system for commercial customers
- **AI Chatbot (Nora)** — Conversational assistant for energy plan questions
- **City Rate Pages** — SEO-optimized pages for major Texas cities
- **Admin Panel** — Full CRUD dashboard for managing providers, plans, articles, quotes, and users

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, shadcn/ui |
| State | TanStack React Query |
| Routing | React Router v6 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Storage | Supabase Storage (logos, articles, bill uploads) |
| Backend | Vercel Serverless Functions (Node.js) |
| AI | OpenAI GPT (chatbot, bill analysis, article recommendations) |
| Hosting | Vercel |

## Project Structure

```
electricscouts/
├── api/                          # Vercel serverless functions
│   ├── chatbot.js                # Nora chatbot endpoint
│   ├── invoke-llm.js             # Generic LLM invocation
│   └── extract-data.js           # Bill data extraction (OCR + GPT)
├── public/
│   ├── images/                   # Logo and brand assets
│   ├── favicon.ico               # Multi-size favicon
│   └── site.webmanifest          # PWA manifest
├── src/
│   ├── api/                      # Supabase service layer
│   │   ├── supabaseEntities.js   # Entity CRUD (providers, plans, articles, etc.)
│   │   ├── supabaseIntegrations.js # AI and file upload wrappers
│   │   ├── entities.js           # Entity re-exports
│   │   └── integrations.js       # Integration re-exports
│   ├── components/
│   │   ├── admin/                # Admin panel components
│   │   ├── compare/              # Rate comparison components
│   │   ├── home/                 # Homepage sections
│   │   ├── seo/                  # SEO and structured data
│   │   └── ui/                   # shadcn/ui components
│   ├── lib/
│   │   ├── supabaseClient.js     # Supabase client initialization
│   │   └── AuthContext.jsx       # Authentication context provider
│   ├── pages/
│   │   ├── admin/                # Admin panel pages
│   │   └── *.jsx                 # Public pages
│   ├── App.jsx                   # Root component with routing
│   └── main.jsx                  # Entry point
├── supabase/
│   └── migrations/               # Database migration SQL
├── vercel.json                   # Vercel deployment config
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Vercel](https://vercel.com) account (for deployment)
- An [OpenAI](https://openai.com) API key (for chatbot and bill analysis)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/electricscouts.git
   cd electricscouts
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run the database migration:**
   - Open the Supabase SQL Editor
   - Paste and run `supabase/migrations/001_initial_schema.sql`

5. **Start the dev server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

### Admin Access

1. Create a user account via the app or Supabase Auth dashboard
2. In the Supabase Table Editor, set the user's `role` to `admin` in the `profiles` table
3. Navigate to `/admin/login` to access the admin panel

## Deployment (Vercel)

1. **Connect the repository** to Vercel via the dashboard
2. **Set environment variables** in Vercel (Settings → Environment Variables):

   | Variable | Description |
   |---|---|
   | `VITE_SUPABASE_URL` | Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
   | `OPENAI_API_KEY` | OpenAI API key for chatbot and AI features |

3. **Deploy** — Vercel will automatically build and deploy on push to `main`

## Admin Panel Routes

| Route | Description |
|---|---|
| `/admin/login` | Admin authentication |
| `/admin` | Dashboard with analytics overview |
| `/admin/providers` | Manage electricity providers |
| `/admin/plans` | Manage electricity plans |
| `/admin/articles` | Manage learning center articles |
| `/admin/quotes` | Manage business quote requests |
| `/admin/users` | Manage users and roles |

## License

Proprietary. All rights reserved.

