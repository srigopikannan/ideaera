export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  headline?: string | null;
  location?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  show_location?: boolean;
  college?: string | null;
  college_id?: string | null;
  college_location?: string | null;
  age?: number | null;
  show_age?: boolean;
  onboarding_completed?: boolean;
  website?: string | null;
  portfolio_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  skills?: string[];
  interests?: string[];
  created_at: string;
  updated_at: string;
  connection_status?: 'none' | 'pending_sent' | 'pending_received' | 'connected';
  mutual_connections_count?: number;
}

export interface Skill {
  id: string;
  name: string;
}

export interface IdeaVersion {
  version_number?: number;
  version?: number;
  created_at: string;
  changed_by?: string;
  change_summary?: string;
  changes_summary?: string;
}

export interface Idea {
  id: string;
  display_id?: string;
  author_id: string;
  author?: Profile;
  title: string;
  description: string;
  problem?: string | null;
  solution?: string | null;
  goals?: string | null;
    skills_needed?: string[];
    collaboration_info?: string | null;
    problem_id?: string | null;
    problem_rel?: CompanyProblem | null;
    company_id?: string | null;
    company?: Company | null;
    version?: number;
    version_history?: IdeaVersion[];
    category: string;
    tags: string[];
    status: 'open' | 'in_progress' | 'implemented';
    visibility?: 'public' | 'community' | 'selected' | 'private';
    likes_count: number;
    comments_count: number;
    created_at: string;
    updated_at: string;
    is_liked?: boolean;
  }
  
  export interface IdeaComment {
    id: string;
    idea_id: string;
    user_id: string;
    user?: Profile;
    content: string;
    created_at: string;
  }
  
  export interface ProjectMember {
    project_id: string;
    user_id: string;
    role: string;
    joined_at: string;
    user?: Profile;
  }
  
  export interface Project {
    id: string;
    owner_id: string;
    owner?: Profile;
    name: string;
    slug: string;
    description: string;
    image_url?: string | null;
    repository_url?: string | null;
    website_url?: string | null;
    status: 'idea' | 'in_development' | 'beta' | 'launched';
    technologies?: string[];
    members?: ProjectMember[];
    related_idea_id?: string | null;
    created_at: string;
    updated_at: string;
  }
  
  export interface Hackathon {
    id: string;
    title: string;
    description: string;
    organizer?: string;
    organizer_id?: string;
    organizer_profile?: Profile;
    location: string;
    mode?: 'Online' | 'In-Person' | 'Hybrid';
    region?: 'Tamil Nadu' | 'India' | 'Asia' | 'Global' | string;
    start_date: string | null;
    end_date: string | null;
    registration_deadline?: string | null;
    registration_url?: string;
    image_url?: string | null;
    created_at: string;
    tags?: string[];
    prize_pool?: string | null;
    prizes?: string;
    min_team_size?: number;
    max_team_size?: number;
    status?: 'ongoing' | 'upcoming' | 'ended';
    is_date_tbd?: boolean;
  }
  
  export type ProblemType = 'real_world_problem' | 'technical_challenge' | 'innovation_challenge' | 'hackathon_challenge';
  export type ProblemSourceType = 'official_company' | 'community';
  export type ProblemDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
  export type ProblemStatus = 'draft' | 'pending_review' | 'open' | 'in_progress' | 'solved' | 'closed' | 'rejected';
  
  export interface CompanyProblem {
    id: string;
    company_id: string;
    company?: Company;
    title: string;
    slug: string;
    summary: string;
    description: string;
    problem_type: ProblemType;
    source_type: ProblemSourceType;
    source_url?: string | null;
    source_title?: string | null;
    source_published_at?: string | null;
    required_skills: string[];
    industry: string;
    difficulty: ProblemDifficulty;
    status: ProblemStatus;
    created_by?: string | null;
    creator?: Profile | null;
    created_at: string;
    updated_at: string;
    verified_at?: string | null;
    verified_by?: string | null;
    last_reviewed_at?: string | null;
    views_count?: number;
    solutions_count?: number;
    saves_count?: number;
    is_saved?: boolean;
    solutions?: Idea[];
  }
  
  export interface ProblemReport {
    id: string;
    problem_id: string;
    reporter_id?: string | null;
    reason: 'incorrect_information' | 'not_affiliated' | 'copyright_concern' | 'misleading' | 'spam' | 'outdated' | 'other';
    details?: string | null;
    status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
    created_at: string;
    reviewed_at?: string | null;
    resolution_notes?: string | null;
  }
  
  export interface Company {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
    description: string;
    website?: string | null;
    website_url?: string | null;
    industry: string;
    location: string;
    created_at: string;
    updated_at?: string;
    tech_stack?: string[];
    size?: string | null;
    owner_id?: string;
    owner?: Profile;
    verification_status?: 'verified' | 'unverified' | 'pending_verification';
    is_verified?: boolean;
    verified_at?: string | null;
    verified_by?: string | null;
    challenges_count?: number;
    problems?: CompanyProblem[];
    solutions?: Idea[];
  }

export interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  connection_type?: 'public' | 'private';
  requester?: Profile;
  receiver?: Profile;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender?: Profile;
  receiver?: Profile;
  content: string;
  created_at: string;
  delivered_at?: string | null;
  read_at?: string | null;
  is_read?: boolean;
  conversation_id?: string | null;
}

export interface Conversation {
  other_user: Profile;
  last_message: Message;
  unread_count: number;
}

export interface Notification {
  id: string;
  user_id: string;
  recipient_id?: string;
  actor_id?: string | null;
  actor?: Profile;
  connection_id?: string | null;
  type: 'connection_request' | 'connection_accepted' | 'message' | 'idea_like' | 'idea_comment' | 'project_invite' | 'project_joined';
  title: string;
  message: string;
  related_id?: string | null;
  read: boolean;
  is_read?: boolean;
  created_at: string;
}

export interface MatchRecommendation {
  profile: Profile;
  matchScore: number;
  matchReason: string;
  sharedSkills: string[];
  sharedInterests: string[];
  complementarySkills?: string[];
  projects?: { id: string; name: string; slug?: string }[];
}

export interface College {
  id: string;
  name: string;
  normalized_name: string;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  state_id?: string | null;
  country?: string | null;
  country_id?: string | null;
  university?: string | null;
  institution_type?: string | null;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

