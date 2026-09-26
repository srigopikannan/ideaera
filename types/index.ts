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
  availability?: string;
  availability_hours?: string | null;
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
  validation_status?: 'not_validated' | 'testing' | 'validated';
  validation_target_users?: string | null;
  validation_why_it_matters?: string | null;
  validation_alternatives?: string | null;
  validation_expected_benefits?: string | null;
  validation_questions?: string[];
  validation_stats?: {
    total: number;
    valid: number;
    needs_work: number;
    impractical: number;
    percentage: number;
  };
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
    idea_id?: string | null;
    needs_help?: boolean;
    help_category?: string | null;
    help_description?: string | null;
    help_requested_at?: string | null;
    required_skills?: string[];
    tasks_count?: number;
    completed_tasks_count?: number;
    progress?: number;
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

export type NotificationType =
  | 'connection_request'
  | 'connection_accepted'
  | 'connection_rejected'
  | 'follow_request'
  | 'follow_accepted'
  | 'follow_rejected'
  | 'idea_suggestion'
  | 'people_suggestion'
  | 'team_suggestion'
  | 'idea_milestone'
  | 'idea_trending'
  | 'hackathon_suggestion'
  | 'project_activity'
  | 'badge_earned'
  | 'message'
  | 'idea_like'
  | 'idea_comment'
  | 'project_invite'
  | 'project_joined'
  | 'project_rescue_invite'
  | 'task_assigned'
  | 'task_completed'
  | 'validation_feedback';

export interface Notification {
  id: string;
  user_id: string;
  recipient_id?: string;
  actor_id?: string | null;
  actor?: Profile | null;
  connection_id?: string | null;
  connection?: Connection | null;
  connection_status?: 'pending' | 'accepted' | 'rejected' | null;
  idea_id?: string | null;
  project_id?: string | null;
  reference_id?: string | null;
  related_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  is_read?: boolean;
  data?: Record<string, any>;
  created_at: string;
  updated_at?: string;
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

export type BadgeTier = 'bronze' | 'silver' | 'gold';

export type BadgeCategory =
  | 'idea_creator'
  | 'problem_solver'
  | 'team_player'
  | 'hackathon_achiever'
  | 'project_builder'
  | 'collaborator'
  | 'top_performer';

export interface Badge {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  tier: BadgeTier;
  category: BadgeCategory;
  criteria_type: string;
  criteria_value: number;
  criteria_description: string;
  why_it_matters: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  awarded_by: string;
  evidence?: Record<string, any>;
  created_at?: string;
  badge?: Badge;
}

export interface BadgeWithProgress extends Badge {
  is_earned: boolean;
  awarded_at?: string | null;
  awarded_by?: string | null;
  evidence?: Record<string, any>;
  current_value: number;
  percentage: number;
}

export interface BadgeAuditLog {
  id: string;
  user_id: string;
  badge_id: string;
  action: 'awarded' | 'revoked';
  reason: string;
  metrics_snapshot: Record<string, any>;
  created_at: string;
  badge?: Badge;
}

export interface UserActivityMetrics {
  ideas_count: number;
  projects_count: number;
  completed_projects_count?: number;
  connections_count: number;
  hackathons_count: number;
  team_contributions_count?: number;
  completed_tasks_count?: number;
}

export interface TierProgressionRequirement {
  label: string;
  current: number;
  target: number;
  satisfied: boolean;
}

export interface TierProgression {
  currentTier: 'none' | 'bronze' | 'silver' | 'gold';
  currentTierLabel: string;
  nextTier: 'bronze' | 'silver' | 'gold' | null;
  nextTierLabel: string | null;
  progressPercentage: number;
  requirementsToNextTier: TierProgressionRequirement[];
}


export interface BadgeEvaluationResult {
  success: boolean;
  metrics: UserActivityMetrics;
  newly_awarded: Array<{
    badge_id: string;
    name: string;
    slug: string;
    tier: string;
  }>;
  revoked: Array<{
    badge_id: string;
    name: string;
    slug: string;
    tier: string;
    reason: string;
  }>;
  currently_valid: Array<{
    badge_id: string;
    name: string;
    slug: string;
    tier: string;
  }>;
}

export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface ProjectTask {
  id: string;
  project_id: string;
  milestone_id?: string | null;
  title: string;
  description?: string | null;
  assigned_to?: string | null;
  assignee?: Profile | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  created_at: string;
  tasks?: ProjectTask[];
}

export interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  url: string;
  file_type: string;
  uploaded_by?: string | null;
  uploader?: Profile | null;
  created_at: string;
}

export interface ProjectDiscussion {
  id: string;
  project_id: string;
  user_id: string;
  user?: Profile | null;
  content: string;
  created_at: string;
  updated_at?: string;
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  user_id?: string | null;
  user?: Profile | null;
  action: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface ProjectRescueInvitation {
  id: string;
  project_id: string;
  sender_id: string;
  receiver_id: string;
  category: string;
  message?: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at?: string;
  project?: Project;
  receiver?: Profile;
}

export interface SkillGapAnalysis {
  required_skills: string[];
  team_skills: { skill: string; members: { id: string; name: string; username: string; avatar_url?: string | null }[] }[];
  skill_gaps: string[];
  coverage_percentage: number;
}

export interface IdeaValidationFeedback {
  id: string;
  idea_id: string;
  user_id: string;
  user?: Profile;
  vote: 'valid' | 'needs_work' | 'impractical';
  feedback: string;
  answers?: Record<string, string>;
  created_at: string;
  updated_at?: string;
}

export interface IdeaValidationData {
  status: 'not_validated' | 'testing' | 'validated';
  target_users?: string | null;
  why_it_matters?: string | null;
  alternatives?: string | null;
  expected_benefits?: string | null;
  questions: string[];
  feedback: IdeaValidationFeedback[];
  summary: {
    total: number;
    valid_count: number;
    needs_work_count: number;
    impractical_count: number;
    positive_percentage: number;
  };
}

export interface NextStepRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'idea' | 'validation' | 'project' | 'skills' | 'rescue' | 'task' | 'hackathon' | 'community';
  action_label: string;
  action_url: string;
  priority: 'high' | 'medium' | 'low';
}

export interface PersonalInnovationDashboard {
  ideas: {
    created: Idea[];
    developing: Idea[];
    total_count: number;
    validated_count: number;
  };
  projects: {
    active: Project[];
    completed: Project[];
    needs_help: Project[];
    total_count: number;
  };
  team: {
    member_of: Project[];
    collaborators_count: number;
  };
  hackathons: {
    joined: Hackathon[];
    total_count: number;
  };
  skills: {
    profile_skills: string[];
    project_skills_needed: string[];
    gap_skills: string[];
  };
  badges: any;
  next_steps: NextStepRecommendation[];
}

export interface UserConsent {
  id: string;
  user_id: string;
  privacy_policy_version: string;
  terms_version: string;
  cookie_policy_version: string;
  consent_type: 'signup' | 'policy_update' | 're_consent';
  accepted_at: string;
  created_at: string;
  user_agent?: string | null;
  metadata?: Record<string, any>;
}



