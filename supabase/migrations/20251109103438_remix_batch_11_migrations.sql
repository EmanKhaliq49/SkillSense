
-- Migration: 20251109050116
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE skill_category AS ENUM ('Technical', 'Soft', 'Domain', 'Language', 'Business', 'Leadership');
CREATE TYPE proficiency_level AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Expert');
CREATE TYPE data_source_type AS ENUM ('cv', 'linkedin', 'github', 'blog', 'performance_review', 'reference_letter', 'goal_document', 'other');
CREATE TYPE privacy_level AS ENUM ('private', 'organization', 'public');

-- User Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  job_title TEXT,
  organization_id UUID,
  privacy_default privacy_level DEFAULT 'private',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations Table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization Members Table
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Standardized Skill Framework
CREATE TABLE public.skill_framework (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category skill_category NOT NULL,
  description TEXT,
  parent_skill_id UUID REFERENCES public.skill_framework(id),
  keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Skills (Identified Skills per Person)
CREATE TABLE public.user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skill_framework(id) ON DELETE CASCADE,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  proficiency_level proficiency_level,
  is_explicit BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  evidence TEXT[],
  privacy_level privacy_level DEFAULT 'private',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- Data Sources (CVs, LinkedIn, GitHub, etc.)
CREATE TABLE public.data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type data_source_type NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT,
  file_path TEXT,
  raw_content TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis History
CREATE TABLE public.analysis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data_source_id UUID REFERENCES public.data_sources(id) ON DELETE SET NULL,
  overall_score INTEGER,
  skills_identified INTEGER,
  summary TEXT,
  insights JSONB,
  analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Postings for Matching
CREATE TABLE public.job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company TEXT,
  description TEXT,
  required_skills UUID[],
  preferred_skills UUID[],
  location TEXT,
  salary_range TEXT,
  posted_by UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Matches
CREATE TABLE public.job_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  matching_skills UUID[],
  missing_skills UUID[],
  analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Skill Gaps (Organization-wide analysis)
CREATE TABLE public.skill_gaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skill_framework(id) ON DELETE CASCADE,
  current_count INTEGER DEFAULT 0,
  required_count INTEGER,
  gap_severity TEXT,
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_framework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_gaps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for Organizations
CREATE POLICY "Organization members can view their organization"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.organizations.id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for Organization Members
CREATE POLICY "Members can view organization members"
  ON public.organization_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

-- RLS Policies for Skill Framework (public read)
CREATE POLICY "Anyone can view skill framework"
  ON public.skill_framework FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for User Skills
CREATE POLICY "Users can view their own skills"
  ON public.user_skills FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view public skills"
  ON public.user_skills FOR SELECT
  USING (privacy_level = 'public');

CREATE POLICY "Organization members can view org skills"
  ON public.user_skills FOR SELECT
  USING (
    privacy_level = 'organization' AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = user_skills.user_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own skills"
  ON public.user_skills FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for Data Sources
CREATE POLICY "Users can manage their own data sources"
  ON public.data_sources FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for Analysis History
CREATE POLICY "Users can view their own analysis history"
  ON public.analysis_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own analysis history"
  ON public.analysis_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for Job Postings
CREATE POLICY "Authenticated users can view active jobs"
  ON public.job_postings FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can manage their posted jobs"
  ON public.job_postings FOR ALL
  USING (posted_by = auth.uid())
  WITH CHECK (posted_by = auth.uid());

-- RLS Policies for Job Matches
CREATE POLICY "Users can view their own job matches"
  ON public.job_matches FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create job matches"
  ON public.job_matches FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for Skill Gaps
CREATE POLICY "Organization members can view skill gaps"
  ON public.skill_gaps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = skill_gaps.organization_id
      AND user_id = auth.uid()
    )
  );

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_skills_updated_at
  BEFORE UPDATE ON public.user_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skill_gaps_updated_at
  BEFORE UPDATE ON public.skill_gaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some standardized skills into framework
INSERT INTO public.skill_framework (name, category, description, keywords) VALUES
-- Technical Skills
('React', 'Technical', 'JavaScript library for building user interfaces', ARRAY['react', 'reactjs', 'react.js', 'frontend']),
('TypeScript', 'Technical', 'Typed superset of JavaScript', ARRAY['typescript', 'ts', 'typed javascript']),
('Python', 'Technical', 'High-level programming language', ARRAY['python', 'py', 'django', 'flask']),
('JavaScript', 'Technical', 'Programming language of the web', ARRAY['javascript', 'js', 'node', 'nodejs']),
('SQL', 'Technical', 'Database query language', ARRAY['sql', 'postgresql', 'mysql', 'database']),
('Docker', 'Technical', 'Containerization platform', ARRAY['docker', 'containers', 'containerization']),
('AWS', 'Technical', 'Amazon Web Services cloud platform', ARRAY['aws', 'amazon web services', 'cloud']),
('Git', 'Technical', 'Version control system', ARRAY['git', 'github', 'gitlab', 'version control']),
('Node.js', 'Technical', 'JavaScript runtime', ARRAY['nodejs', 'node', 'backend']),
('MongoDB', 'Technical', 'NoSQL database', ARRAY['mongodb', 'mongo', 'nosql']),

-- Soft Skills
('Leadership', 'Soft', 'Ability to guide and inspire teams', ARRAY['leadership', 'team lead', 'manager', 'leading']),
('Communication', 'Soft', 'Effective verbal and written communication', ARRAY['communication', 'presenting', 'writing']),
('Problem Solving', 'Soft', 'Analytical thinking and solution finding', ARRAY['problem solving', 'analytical', 'troubleshooting']),
('Teamwork', 'Soft', 'Collaborative work with others', ARRAY['teamwork', 'collaboration', 'team player']),
('Time Management', 'Soft', 'Efficient task prioritization', ARRAY['time management', 'organization', 'prioritization']),
('Adaptability', 'Soft', 'Flexibility in changing environments', ARRAY['adaptability', 'flexible', 'agile']),
('Critical Thinking', 'Soft', 'Logical analysis and evaluation', ARRAY['critical thinking', 'analytical', 'reasoning']),
('Creativity', 'Soft', 'Innovative thinking and ideation', ARRAY['creativity', 'creative', 'innovation']),

-- Business Skills
('Project Management', 'Business', 'Planning and executing projects', ARRAY['project management', 'agile', 'scrum', 'pmp']),
('Data Analysis', 'Business', 'Interpreting and analyzing data', ARRAY['data analysis', 'analytics', 'insights']),
('Marketing', 'Business', 'Promoting products and services', ARRAY['marketing', 'digital marketing', 'seo']),
('Sales', 'Business', 'Selling products and services', ARRAY['sales', 'business development', 'selling']),
('Strategic Planning', 'Business', 'Long-term business strategy', ARRAY['strategy', 'strategic planning', 'vision']),

-- Domain Skills
('Machine Learning', 'Domain', 'AI and ML algorithms', ARRAY['machine learning', 'ml', 'ai', 'artificial intelligence']),
('DevOps', 'Domain', 'Development and operations practices', ARRAY['devops', 'ci/cd', 'automation']),
('Cybersecurity', 'Domain', 'Information security practices', ARRAY['security', 'cybersecurity', 'infosec']),
('UI/UX Design', 'Domain', 'User interface and experience design', ARRAY['ui', 'ux', 'design', 'user experience']),
('Cloud Architecture', 'Domain', 'Cloud infrastructure design', ARRAY['cloud architecture', 'cloud', 'infrastructure']);


-- Migration: 20251109051022
-- Add skill endorsements table
CREATE TABLE IF NOT EXISTS public.skill_endorsements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_skill_id UUID NOT NULL REFERENCES public.user_skills(id) ON DELETE CASCADE,
  endorsed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endorsement_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_skill_id, endorsed_by)
);

-- Enable RLS
ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view endorsements for public and organization skills
CREATE POLICY "Users can view endorsements for accessible skills"
ON public.skill_endorsements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_skills us
    WHERE us.id = skill_endorsements.user_skill_id
    AND (
      us.privacy_level = 'public'::privacy_level
      OR us.user_id = auth.uid()
      OR (
        us.privacy_level = 'organization'::privacy_level
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          JOIN public.organization_members om ON p.organization_id = om.organization_id
          WHERE p.id = us.user_id AND om.user_id = auth.uid()
        )
      )
    )
  )
);

-- Policy: Users can endorse skills
CREATE POLICY "Users can endorse accessible skills"
ON public.skill_endorsements
FOR INSERT
WITH CHECK (
  auth.uid() = endorsed_by
  AND EXISTS (
    SELECT 1 FROM public.user_skills us
    WHERE us.id = skill_endorsements.user_skill_id
    AND us.user_id != auth.uid()
    AND (
      us.privacy_level = 'public'::privacy_level
      OR (
        us.privacy_level = 'organization'::privacy_level
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          JOIN public.organization_members om ON p.organization_id = om.organization_id
          WHERE p.id = us.user_id AND om.user_id = auth.uid()
        )
      )
    )
  )
);

-- Policy: Users can delete their own endorsements
CREATE POLICY "Users can delete their own endorsements"
ON public.skill_endorsements
FOR DELETE
USING (auth.uid() = endorsed_by);

-- Add endorsement count column to user_skills for quick access
ALTER TABLE public.user_skills ADD COLUMN IF NOT EXISTS endorsement_count INTEGER DEFAULT 0;

-- Create function to update endorsement count
CREATE OR REPLACE FUNCTION public.update_endorsement_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.user_skills
    SET endorsement_count = endorsement_count + 1
    WHERE id = NEW.user_skill_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_skills
    SET endorsement_count = GREATEST(endorsement_count - 1, 0)
    WHERE id = OLD.user_skill_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for endorsement count updates
DROP TRIGGER IF EXISTS update_endorsement_count_trigger ON public.skill_endorsements;
CREATE TRIGGER update_endorsement_count_trigger
AFTER INSERT OR DELETE ON public.skill_endorsements
FOR EACH ROW
EXECUTE FUNCTION public.update_endorsement_count();

-- Migration: 20251109051140
-- Fix security issue: Set search_path for update_updated_at_column function
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers for updated_at
CREATE TRIGGER update_job_postings_updated_at
BEFORE UPDATE ON public.job_postings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_skill_gaps_updated_at
BEFORE UPDATE ON public.skill_gaps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_skills_updated_at
BEFORE UPDATE ON public.user_skills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251109051206
-- Fix security issue: Set search_path for handle_new_user function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Migration: 20251109054217
-- Add goals table for tracking career goals and learning objectives
CREATE TABLE IF NOT EXISTS public.career_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_skills TEXT[] DEFAULT '{}',
  timeline TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  target_date TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.career_goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own goals"
  ON public.career_goals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_career_goals_updated_at
  BEFORE UPDATE ON public.career_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add learning resources table
CREATE TABLE IF NOT EXISTS public.learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skill_framework(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('course', 'book', 'article', 'video', 'certification', 'project', 'mentor')),
  url TEXT,
  description TEXT,
  provider TEXT,
  duration TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for learning resources
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;

-- Create policies for learning resources
CREATE POLICY "Users can manage their own learning resources"
  ON public.learning_resources
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add trigger for learning resources updated_at
CREATE TRIGGER update_learning_resources_updated_at
  BEFORE UPDATE ON public.learning_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add skill history table to track skill evolution over time
CREATE TABLE IF NOT EXISTS public.skill_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skill_framework(id) ON DELETE CASCADE,
  proficiency_level TEXT NOT NULL CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  data_source_id UUID REFERENCES public.data_sources(id) ON DELETE SET NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- Enable RLS for skill history
ALTER TABLE public.skill_history ENABLE ROW LEVEL SECURITY;

-- Create policies for skill history
CREATE POLICY "Users can view their own skill history"
  ON public.skill_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert skill history"
  ON public.skill_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for efficient time-series queries
CREATE INDEX idx_skill_history_user_skill_time 
  ON public.skill_history(user_id, skill_id, recorded_at DESC);

-- Add comments
COMMENT ON TABLE public.career_goals IS 'Stores user career goals and learning objectives';
COMMENT ON TABLE public.learning_resources IS 'Tracks learning materials and resources for skill development';
COMMENT ON TABLE public.skill_history IS 'Maintains historical record of skill proficiency changes over time';


-- Migration: 20251109061244
-- Fix infinite recursion in RLS policy for organization_members by using a SECURITY DEFINER helper

-- 1) Helper function to check org membership without triggering RLS recursion
create or replace function public.is_member_of_org(_user_id uuid, _org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where user_id = _user_id
      and organization_id = _org_id
  );
$$;

-- 2) Replace recursive policy with non-recursive one that uses the helper
drop policy if exists "Members can view organization members" on public.organization_members;

create policy "Members can view organization members"
on public.organization_members
for select
to authenticated
using (
  public.is_member_of_org(auth.uid(), organization_id)
  or user_id = auth.uid()
);


-- Migration: 20251109061402
-- Create learning_paths table to persist generated learning paths with versioning

CREATE TABLE public.learning_paths (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES public.career_goals(id) ON DELETE SET NULL,
  path_title text NOT NULL,
  estimated_duration text,
  path_data jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

-- Users can view their own learning paths
CREATE POLICY "Users can view their own learning paths"
ON public.learning_paths
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own learning paths
CREATE POLICY "Users can insert their own learning paths"
ON public.learning_paths
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own learning paths
CREATE POLICY "Users can update their own learning paths"
ON public.learning_paths
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own learning paths
CREATE POLICY "Users can delete their own learning paths"
ON public.learning_paths
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_learning_paths_user_id ON public.learning_paths(user_id);
CREATE INDEX idx_learning_paths_goal_id ON public.learning_paths(goal_id);
CREATE INDEX idx_learning_paths_created_at ON public.learning_paths(created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_learning_paths_updated_at
BEFORE UPDATE ON public.learning_paths
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251109064656
-- Create enum for application status
CREATE TYPE application_status AS ENUM ('interested', 'applied', 'rejected');

-- Create job applications tracking table
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'interested',
  notes TEXT,
  applied_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own applications"
  ON public.job_applications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
  ON public.job_applications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
  ON public.job_applications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications"
  ON public.job_applications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251109070037
-- Enable realtime for user_skills table
ALTER TABLE public.user_skills REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_skills;

-- Migration: 20251109080151
-- Step 1: Create org_role enum
CREATE TYPE public.org_role AS ENUM ('member', 'manager', 'admin', 'owner');

-- Step 2: Drop the default constraint temporarily, convert column, then restore default
ALTER TABLE public.organization_members 
  ALTER COLUMN role DROP DEFAULT;

ALTER TABLE public.organization_members 
  ALTER COLUMN role TYPE org_role 
  USING role::org_role;

ALTER TABLE public.organization_members 
  ALTER COLUMN role SET DEFAULT 'member'::org_role;

-- Step 3: Create SECURITY DEFINER function to check org roles
CREATE OR REPLACE FUNCTION public.has_org_role(
  _user_id uuid,
  _org_id uuid,
  _required_role org_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role = _required_role
  );
$$;

-- Step 4: Create role audit table
CREATE TABLE public.organization_role_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  old_role org_role,
  new_role org_role NOT NULL,
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.organization_role_audit ENABLE ROW LEVEL SECURITY;

-- Org admins can view role audit logs
CREATE POLICY "Org admins can view role audit logs"
ON public.organization_role_audit
FOR SELECT
USING (
  public.has_org_role(auth.uid(), organization_id, 'admin')
  OR public.has_org_role(auth.uid(), organization_id, 'owner')
);

-- Step 5: Create trigger function for role change auditing
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.organization_role_audit (
      user_id,
      organization_id,
      old_role,
      new_role,
      changed_by
    ) VALUES (
      NEW.user_id,
      NEW.organization_id,
      OLD.role,
      NEW.role,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Step 6: Create trigger for role changes
CREATE TRIGGER audit_role_changes
AFTER UPDATE OF role ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.log_role_change();

-- Step 7: Add RLS policy to prevent self-promotion
CREATE POLICY "Users cannot change their own role"
ON public.organization_members
FOR UPDATE
USING (
  user_id != auth.uid() 
  OR role = (SELECT role FROM public.organization_members WHERE id = organization_members.id)
)
WITH CHECK (
  user_id != auth.uid()
  OR role = (SELECT role FROM public.organization_members WHERE id = organization_members.id)
);

-- Migration: 20251109080843
-- Create rate_limits table for tracking API usage
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_endpoint_window UNIQUE(user_id, endpoint, window_start)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rate limits
CREATE POLICY "Users can view their own rate limits"
ON public.rate_limits
FOR SELECT
USING (auth.uid() = user_id);

-- Allow edge functions to manage rate limits (service role)
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for efficient lookups
CREATE INDEX idx_rate_limits_user_endpoint ON public.rate_limits(user_id, endpoint, window_start DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_rate_limits_updated_at
BEFORE UPDATE ON public.rate_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add cleanup function to remove old rate limit records (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < now() - INTERVAL '24 hours';
END;
$$;
