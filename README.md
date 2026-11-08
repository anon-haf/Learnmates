# Learnmates

Learnmates is a free learning platform that helps IGCSE and A-Level students prepare for exams with curriculum-aligned resources and interactive study tools. Its purpose is to make quality exam preparation more accessible and help students understand challenging topics, practise questions, and organise their learning.

Visit [learnmates.org](https://www.learnmates.org).

## What you can do

- Explore study resources, notes, and videos organised around exam curricula.
- Practise with topical questions and quizzes.
- Browse past-paper materials and view questions in the app.
- Track learning activity and progress through your account.
- Use Nibras, Learnmates' AI study companion, for supported Biology, Chemistry, and Physics subjects. Nibras can answer study questions and explain selected exam questions; availability depends on the subject and question.

Nibras is an AI tool and can make mistakes. Check important information against trusted course materials.

## Technology

- React and TypeScript
- Vite
- Tailwind CSS
- Supabase for authentication and data services

## Run locally

### Requirements

- Node.js and npm
- Access to a configured Supabase project

### Setup

1. Clone the repository and enter the project directory.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file in the project root and add your Supabase project settings:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

   Use the URL and public anon key from your Supabase project. Never put a Supabase service-role key or other server secret in a `VITE_` variable.

4. Start the development server:

   ```bash
   npm run dev
   ```

   Open the local URL printed by Vite (by default, `http://localhost:5173`).

Some API-backed features also depend on Learnmates' configured backend services and may not be available with only the local frontend and Supabase settings.

## Useful commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Generate production assets |
| `npm run preview` | Preview a production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run API unit tests |

## Project purpose

Learnmates aims to make exam-focused learning more accessible by bringing study materials and practice tools together in one place. The platform is designed to support independent, self-paced study alongside classroom learning.
