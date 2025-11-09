# SkillSense

> AI-Powered Skill Aggregation & Career Development Platform

SkillSense is a comprehensive platform that aggregates professional skills from multiple sources, provides intelligent career insights, and helps professionals and teams track their development journey.

![SkillSense](https://img.shields.io/badge/Status-Production%20Ready-success)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Enabled-green)

## 🌟 Features

### Multi-Source Data Aggregation

- **CV/Resume Upload** - Extract skills, experience, and qualifications from PDF documents
- **GitHub Integration** - Analyze repositories for programming languages, frameworks, and technical expertise
-
- **Blog Analysis** - Extract expertise from blog posts and articles via URL
- **Performance Review Processing** - Identify soft skills and growth areas from feedback text

### Intelligent Skill Management

- **Comprehensive Skill Framework** - Categorized by Technical, Soft Skills, Domain Knowledge, and Languages
- **Proficiency Tracking** - Multi-level proficiency system (Beginner to Expert)
- **Skill Endorsements** - Validation from multiple sources with confidence scoring
- **Historical Tracking** - Time-series tracking of skill development over time

### Career Development Tools

- **Career Goals Management** - Set and track career objectives with skill gap analysis
- **Learning Path Generation** - AI-powered personalized learning recommendations
- **Job Matching** - Intelligent job matching based on skill profile and career goals
- **Progress Tracking** - Visual progress indicators and milestone tracking

### AI-Powered Analysis

- **Skill Extraction** - Automatic skill identification from various data sources
- **Career Insights** - Personalized recommendations for career growth
- **Gap Analysis** - Identify skill gaps between current state and career goals
- **Trend Analysis** - Industry skill trends and demand forecasting

### Team & Organization Features

- **Team Skill Matrix** - Organization-wide skill visibility
- **Skill Gap Identification** - Team-level capability analysis
- **Resource Allocation** - Optimal team composition recommendations
- **Succession Planning** - Identify skill overlaps and single points of failure

### Dashboard & Visualization

- **Interactive Dashboard** - Comprehensive skill profile overview
- **Skill Distribution Charts** - Visual representation of skill categories
- **Progress Metrics** - Track improvement over time
- **Export Capabilities** - Download skill reports and insights

## 🛠️ Tech Stack

### Frontend

- **React 18.3.1** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality accessible UI components
- **Framer Motion** - Smooth animations and transitions
- **React Router** - Client-side routing
- **TanStack Query** - Server state management

### Backend & Infrastructure

- **Supabase** - Backend-as-a-Service platform
  - PostgreSQL database
  - Row Level Security (RLS) policies
  - Edge Functions (Deno runtime)
  - Real-time subscriptions
  - Authentication & authorization
  - File storage

### AI & Machine Learning

- **Google Gemini AI** - Advanced language models for skill extraction and analysis
  - gemini-2.5-pro - Complex reasoning and multimodal analysis
  - gemini-2.5-flash - Balanced performance
- **Tesseract.js** - OCR for document processing
- **PDF.js** - PDF parsing and text extraction

### Additional Libraries

- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **date-fns** - Date manipulation
- **Recharts** - Data visualization
- **Lucide React** - Icon library

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm installed ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Supabase account (automatically provisioned with Lovable Cloud)

### Installation

1. **Clone the repository**

   ```bash
   git clone <YOUR_GIT_URL>
   cd skillsense
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   Environment variables are automatically configured via Lovable Cloud:
   - `VITE_SUPABASE_URL` - Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key
   - `VITE_SUPABASE_PROJECT_ID` - Supabase project ID

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to `http://localhost:5173`

## 📖 Usage Guide

### For End Users

1. **Create Account** - Sign up at `/auth` with email verification
2. **Upload CV** - Start by uploading your resume at `/upload`
3. **Connect Sources** - Add GitHub, LinkedIn, or other data sources at `/connect`
4. **Review Dashboard** - View your aggregated skill profile at `/dashboard`
5. **Set Goals** - Define career objectives at `/goals`
6. **Match Jobs** - Find relevant opportunities at `/job-matching`
7. **Track Progress** - Monitor your skill development over time

### For Developers

See [QUICKSTART.md](./QUICKSTART.md) for detailed development workflow and [FEATURES.md](./FEATURES.md) for comprehensive feature documentation.

## 📁 Project Structure

```
skillsense/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   └── NavLink.tsx   # Navigation components
│   ├── pages/            # Route pages
│   │   ├── Auth.tsx      # Authentication page
│   │   ├── Dashboard.tsx # Main dashboard
│   │   ├── Upload.tsx    # CV upload
│   │   ├── ConnectSources.tsx
│   │   ├── Goals.tsx
│   │   ├── JobMatching.tsx
│   │   ├── LearningPath.tsx
│   │   └── TeamAnalysis.tsx
│   ├── services/         # Business logic
│   │   ├── aiAgent.ts    # AI integration
│   │   ├── databaseService.ts
│   │   └── ocrService.ts
│   ├── integrations/     # External integrations
│   │   └── supabase/     # Supabase client
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utility functions
├── supabase/
│   ├── functions/        # Edge Functions
│   │   ├── analyze-cv/
│   │   ├── analyze-github/
│   │   ├── analyze-blog/
│   │   ├── analyze-job-match/
│   │   ├── analyze-performance-review/
│   │   └── generate-learning-path/
│   └── migrations/       # Database migrations
├── public/               # Static assets
└── README.md
```

## 🔐 Security

- **Row Level Security (RLS)** - All database tables protected with RLS policies
- **Authentication** - Secure email-based authentication with Supabase Auth
- **Data Privacy** - User data isolated per account with strict access controls
- **Secure File Storage** - Protected storage buckets with access policies
- **HTTPS Only** - All communications encrypted in transit

## 🌐 Deployment

### Via Lovable (Recommended)

1. Click **Publish** in the top-right corner
2. Configure your domain (optional)
3. Click **Update** to deploy changes

### Manual Deployment

This project can be deployed to any static hosting platform:

- **Vercel** - `vercel deploy`
- **Netlify** - Drag and drop build folder
- **AWS Amplify** - Connect GitHub repo
- **Cloudflare Pages** - Connect repository

Build command: `npm run build`  
Output directory: `dist`

## 🔧 Environment Variables

Required environment variables (auto-configured with Lovable Cloud):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

Optional secrets for enhanced features:

- `GITHUB_TOKEN` - For higher GitHub API rate limits (5000/hour vs 60/hour)

## 📊 Database Schema

Core tables:

- `data_sources` - Stores raw data from various sources
- `user_skills` - Extracted and validated skills
- `skill_framework` - Master skill taxonomy
- `career_goals` - User-defined objectives
- `learning_resources` - Recommended courses and materials
- `skill_endorsements` - Skill validations from multiple sources
- `job_matches` - AI-generated job recommendations

## 🤝 Contributing

This is a Lovable project. To contribute:

1. Make changes via [Lovable Editor](https://lovable.dev/projects/6f71f6c6-a754-4cd2-8f59-264ab5337261)
2. Or clone locally, make changes, and push to GitHub
3. Changes sync automatically between Lovable and GitHub

## 📝 License

Copyright © 2025 SkillSense. All rights reserved.

## 🔗 Links

- **Live Demo**: [https://lovable.dev/projects/6f71f6c6-a754-4cd2-8f59-264ab5337261](https://lovable.dev/projects/6f71f6c6-a754-4cd2-8f59-264ab5337261)
- **Documentation**: See [FEATURES.md](./FEATURES.md) and [QUICKSTART.md](./QUICKSTART.md)
- **Lovable Docs**: [https://docs.lovable.dev](https://docs.lovable.dev)

## 💡 Support

For issues or questions:

1. Check [QUICKSTART.md](./QUICKSTART.md) troubleshooting section
2. Review [FEATURES.md](./FEATURES.md) for feature details
3. Contact support via Lovable platform

---

**Built with ❤️ using [Lovable](https://lovable.dev)**
