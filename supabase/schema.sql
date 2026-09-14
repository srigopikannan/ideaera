-- ====================================================================
-- IDEACONNECT - Production PostgreSQL Schema with Row Level Security (RLS)
-- ====================================================================

-- 1. Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- ====================================================================
-- 2. PROFILES TABLE (Linked with Supabase Auth)
-- ====================================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  full_name text not null,
  avatar_url text,
  bio text,
  headline text,
  location text,
  website text,
  github_url text,
  linkedin_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_created_at on public.profiles(created_at desc);

-- ====================================================================
-- 3. SKILLS & PROFILE SKILLS
-- ====================================================================
create table if not exists public.skills (
  id uuid default gen_random_uuid() primary key,
  name text unique not null
);

create index if not exists idx_skills_name on public.skills(name);

create table if not exists public.profile_skills (
  profile_id uuid references public.profiles(id) on delete cascade not null,
  skill_id uuid references public.skills(id) on delete cascade not null,
  primary key (profile_id, skill_id)
);

create index if not exists idx_profile_skills_profile on public.profile_skills(profile_id);
create index if not exists idx_profile_skills_skill on public.profile_skills(skill_id);

-- ====================================================================
-- 4. IDEAS
-- ====================================================================
create table if not exists public.ideas (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  category text not null,
  tags text[] default '{}' not null,
  status text default 'open' not null, -- open, in_progress, implemented
  likes_count integer default 0 not null,
  comments_count integer default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_ideas_author on public.ideas(author_id);
create index if not exists idx_ideas_category on public.ideas(category);
create index if not exists idx_ideas_likes_count on public.ideas(likes_count desc);
create index if not exists idx_ideas_created_at on public.ideas(created_at desc);

-- ====================================================================
-- 5. IDEA LIKES & COMMENTS
-- ====================================================================
create table if not exists public.idea_likes (
  idea_id uuid references public.ideas(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (idea_id, user_id)
);

create index if not exists idx_idea_likes_user on public.idea_likes(user_id);

create table if not exists public.idea_comments (
  id uuid default gen_random_uuid() primary key,
  idea_id uuid references public.ideas(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_idea_comments_idea on public.idea_comments(idea_id);
create index if not exists idx_idea_comments_user on public.idea_comments(user_id);

-- ====================================================================
-- 6. PROJECTS & MEMBERS
-- ====================================================================
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  description text not null,
  image_url text,
  repository_url text,
  website_url text,
  status text default 'in_development' not null, -- idea, in_development, beta, launched
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_projects_owner on public.projects(owner_id);
create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_projects_status on public.projects(status);

create table if not exists public.project_members (
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'Contributor' not null,
  joined_at timestamptz default now() not null,
  primary key (project_id, user_id)
);

create index if not exists idx_project_members_user on public.project_members(user_id);

-- ====================================================================
-- 7. HACKATHONS
-- ====================================================================
create table if not exists public.hackathons (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  organizer text not null,
  location text not null,
  mode text default 'Online' not null, -- Online, In-Person, Hybrid
  start_date timestamptz not null,
  end_date timestamptz not null,
  registration_url text not null,
  image_url text,
  created_at timestamptz default now() not null
);

create index if not exists idx_hackathons_start_date on public.hackathons(start_date);
create index if not exists idx_hackathons_mode on public.hackathons(mode);

-- ====================================================================
-- 8. CONNECTIONS
-- ====================================================================
create table if not exists public.connections (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' not null, -- pending, accepted, rejected
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (requester_id, receiver_id)
);

create index if not exists idx_connections_requester on public.connections(requester_id);
create index if not exists idx_connections_receiver on public.connections(receiver_id);
create index if not exists idx_connections_status on public.connections(status);

-- ====================================================================
-- 9. MESSAGES
-- ====================================================================
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null,
  read_at timestamptz
);

create index if not exists idx_messages_sender on public.messages(sender_id);
create index if not exists idx_messages_receiver on public.messages(receiver_id);
create index if not exists idx_messages_created_at on public.messages(created_at);

-- ====================================================================
-- 10. NOTIFICATIONS
-- ====================================================================
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- connection_request, connection_accepted, message, idea_like, idea_comment, project_invite
  title text not null,
  message text not null,
  related_id text,
  read boolean default false not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_notifications_user on public.notifications(user_id, read);

-- ====================================================================
-- 11. COMPANIES (Company Discovery ONLY - NO JOBS)
-- ====================================================================
create table if not exists public.companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  logo_url text,
  description text not null,
  website text,
  industry text not null,
  location text not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_companies_slug on public.companies(slug);
create index if not exists idx_companies_industry on public.companies(industry);

-- ====================================================================
-- 12. TRIGGERS & FUNCTIONS
-- ====================================================================

-- Trigger: auto-create profile on Supabase auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    username,
    full_name,
    avatar_url,
    headline,
    bio
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/shapes/svg?seed=' || new.id::text),
    coalesce(new.raw_user_meta_data->>'headline', 'Innovator & Creator on IdeaConnect'),
    'Passionate about turning innovative concepts into impactful technology products.'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: update updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger trg_ideas_updated_at before update on public.ideas for each row execute procedure public.handle_updated_at();
create trigger trg_projects_updated_at before update on public.projects for each row execute procedure public.handle_updated_at();
create trigger trg_connections_updated_at before update on public.connections for each row execute procedure public.handle_updated_at();

-- Trigger: maintain idea likes_count
create or replace function public.handle_idea_likes_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.ideas set likes_count = likes_count + 1 where id = new.idea_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.ideas set likes_count = greatest(likes_count - 1, 0) where id = old.idea_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_idea_likes_count on public.idea_likes;
create trigger trg_idea_likes_count
  after insert or delete on public.idea_likes
  for each row execute procedure public.handle_idea_likes_count();

-- Trigger: maintain idea comments_count
create or replace function public.handle_idea_comments_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.ideas set comments_count = comments_count + 1 where id = new.idea_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.ideas set comments_count = greatest(comments_count - 1, 0) where id = old.idea_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_idea_comments_count on public.idea_comments;
create trigger trg_idea_comments_count
  after insert or delete on public.idea_comments
  for each row execute procedure public.handle_idea_comments_count();

-- ====================================================================
-- 13. ROW LEVEL SECURITY (RLS)
-- ====================================================================

alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.profile_skills enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_likes enable row level security;
alter table public.idea_comments enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.hackathons enable row level security;
alter table public.connections enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.companies enable row level security;

-- Profiles: Public can read, user can update only own
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Skills: Public can read, authenticated can add
create policy "Skills are viewable by everyone" on public.skills for select using (true);
create policy "Authenticated users can insert skills" on public.skills for insert with check (auth.role() = 'authenticated');

-- Profile Skills: Public can read, user can manage own
create policy "Profile skills are viewable by everyone" on public.profile_skills for select using (true);
create policy "Users can manage their own skills" on public.profile_skills for all using (auth.uid() = profile_id);

-- Ideas: Public can read, authenticated author can insert/update/delete own
create policy "Ideas are viewable by everyone" on public.ideas for select using (true);
create policy "Authenticated users can create ideas" on public.ideas for insert with check (auth.uid() = author_id);
create policy "Users can update their own ideas" on public.ideas for update using (auth.uid() = author_id);
create policy "Users can delete their own ideas" on public.ideas for delete using (auth.uid() = author_id);

-- Idea Likes: Public can read, user can manage own like
create policy "Idea likes are viewable by everyone" on public.idea_likes for select using (true);
create policy "Users can toggle own likes" on public.idea_likes for all using (auth.uid() = user_id);

-- Idea Comments: Public can read, authenticated users can comment, authors can delete
create policy "Comments are viewable by everyone" on public.idea_comments for select using (true);
create policy "Authenticated users can comment" on public.idea_comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on public.idea_comments for delete using (auth.uid() = user_id);

-- Projects: Public can read, owner can manage
create policy "Projects are viewable by everyone" on public.projects for select using (true);
create policy "Authenticated users can create projects" on public.projects for insert with check (auth.uid() = owner_id);
create policy "Owners can update their projects" on public.projects for update using (auth.uid() = owner_id);
create policy "Owners can delete their projects" on public.projects for delete using (auth.uid() = owner_id);

-- Project Members: Public can read, owner or member can manage
create policy "Project members are viewable by everyone" on public.project_members for select using (true);
create policy "Project owners can manage members" on public.project_members for all using (
  exists (select 1 from public.projects where id = project_members.project_id and owner_id = auth.uid())
);

-- Hackathons: Public viewable, authenticated can insert
create policy "Hackathons are viewable by everyone" on public.hackathons for select using (true);
create policy "Authenticated can suggest hackathon" on public.hackathons for insert with check (auth.role() = 'authenticated');

-- Connections: Involved users can read, manage
create policy "Users can view their connections" on public.connections for select using (
  auth.uid() = requester_id or auth.uid() = receiver_id
);
create policy "Users can create connection requests" on public.connections for insert with check (
  auth.uid() = requester_id
);
create policy "Users can update connection status" on public.connections for update using (
  auth.uid() = requester_id or auth.uid() = receiver_id
);
create policy "Users can delete connections" on public.connections for delete using (
  auth.uid() = requester_id or auth.uid() = receiver_id
);

-- Messages: Only sender and receiver can see and manage
create policy "Users can view their messages" on public.messages for select using (
  auth.uid() = sender_id or auth.uid() = receiver_id
);
create policy "Users can send messages" on public.messages for insert with check (
  auth.uid() = sender_id
);
create policy "Users can mark messages as read" on public.messages for update using (
  auth.uid() = receiver_id
);

-- Notifications: Only recipient can view and update
create policy "Users can view their own notifications" on public.notifications for select using (
  auth.uid() = user_id
);
create policy "Users can update their own notifications" on public.notifications for update using (
  auth.uid() = user_id
);

-- Companies: Public can read
create policy "Companies are viewable by everyone" on public.companies for select using (true);

-- ====================================================================
-- 14. SEED DATA (Skills, Companies, Hackathons)
-- ====================================================================

insert into public.skills (name) values
  ('React'), ('Next.js'), ('TypeScript'), ('Node.js'), ('Python'),
  ('Rust'), ('Go'), ('AI / LLMs'), ('Machine Learning'), ('PyTorch'),
  ('UI/UX Design'), ('Figma'), ('Product Management'), ('Tailwind CSS'),
  ('PostgreSQL'), ('GraphQL'), ('Docker'), ('Kubernetes'), ('Web3 / Solidity'),
  ('Mobile App Dev'), ('DevOps'), ('Data Engineering'), ('Computer Vision')
on conflict (name) do nothing;

insert into public.companies (name, slug, logo_url, description, website, industry, location) values
  ('VoxelForge AI', 'voxelforge-ai', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80', 'Building next-generation generative spatial compute and 3D simulation tools for developers.', 'https://voxelforge.ai', 'Artificial Intelligence', 'San Francisco, CA'),
  ('Synapse Bio', 'synapse-bio', 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=150&auto=format&fit=crop&q=80', 'Developing computational biology pipelines and open neural interface diagnostics.', 'https://synapsebio.org', 'Biotechnology', 'Boston, MA'),
  ('Aether Labs', 'aether-labs', 'https://images.unsplash.com/photo-1534972195531-a756b1126f24?w=150&auto=format&fit=crop&q=80', 'Decentralized verifiable computing infrastructure for privacy-first collaborative applications.', 'https://aetherlabs.tech', 'Web3 & Cloud', 'Zurich, Switzerland'),
  ('Hyperion Robotics', 'hyperion-robotics', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=150&auto=format&fit=crop&q=80', 'Autonomous robotics and perception systems for agricultural automation and re-forestation.', 'https://hyperionrobotics.io', 'Robotics & Hardware', 'Austin, TX'),
  ('Kite Flow', 'kite-flow', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&auto=format&fit=crop&q=80', 'Next-gen collaborative workflow and canvas architecture for engineering and product teams.', 'https://kiteflow.app', 'Developer Tools', 'Remote / Global')
on conflict (slug) do nothing;

insert into public.hackathons (title, description, organizer, location, mode, start_date, end_date, registration_url, image_url) values
  ('Global AI Innovators Hackathon 2026', 'Build autonomous agents, multimodal generative tools, and breakthrough intelligence apps in 48 hours with $75,000 in prizes.', 'Anthropic & Supabase', 'San Francisco & Online', 'Hybrid', now() + interval '14 days', now() + interval '17 days', 'https://ideaconnect.dev/hackathons/global-ai', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80'),
  ('Open Collab Hack 2026', 'A worldwide virtual hackathon dedicated to open-source developer tooling, accessible software, and community infrastructure.', 'GitHub & IdeaConnect', 'Global', 'Online', now() + interval '21 days', now() + interval '24 days', 'https://ideaconnect.dev/hackathons/open-collab', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80'),
  ('ClimateTech Nexus Challenge', 'Architect digital solutions, satellite data pipelines, and clean energy optimizations for planetary sustainability.', 'Earthshot Collective', 'Seattle, WA', 'In-Person', now() + interval '35 days', now() + interval '37 days', 'https://ideaconnect.dev/hackathons/climate-nexus', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80');
