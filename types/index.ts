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

export interface Idea {
  id: string;
  author_id: string;
  author?: Profile;
  title: string;
  description: string;
  problem?: string | null;
  solution?: string | null;
  category: string;
  tags: string[];
  status: 'open' | 'in_progress' | 'implemented';
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
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  registration_url?: string;
  image_url?: string | null;
  created_at: string;
  tags?: string[];
  prize_pool?: string | null;
  prizes?: string;
  min_team_size?: number;
  max_team_size?: number;
  status?: 'ongoing' | 'upcoming';
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
}

export interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
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
  read_at?: string | null;
}

export interface Conversation {
  other_user: Profile;
  last_message: Message;
  unread_count: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'connection_request' | 'connection_accepted' | 'message' | 'idea_like' | 'idea_comment' | 'project_invite' | 'project_joined';
  title: string;
  message: string;
  related_id?: string | null;
  read: boolean;
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
