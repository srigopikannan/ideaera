-- =============================================================================
-- IdeaConnect Production RLS Policies
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_applications ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1. PROFILES
-- -----------------------------------------------------------------------------
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 2. SKILLS & INTERESTS (Global Lists)
-- -----------------------------------------------------------------------------
CREATE POLICY "Skills are viewable by everyone" ON skills FOR SELECT USING (true);
CREATE POLICY "Interests are viewable by everyone" ON interests FOR SELECT USING (true);

-- -----------------------------------------------------------------------------
-- 3. USER-SPECIFIC DATA (Skills, Interests, Exp, Certs, Achievements)
-- -----------------------------------------------------------------------------
CREATE POLICY "User skills are viewable by everyone" ON user_skills FOR SELECT USING (true);
CREATE POLICY "Users can manage own skills" ON user_skills FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "User interests are viewable by everyone" ON user_interests FOR SELECT USING (true);
CREATE POLICY "Users can manage own interests" ON user_interests FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Experience is viewable by everyone" ON experience FOR SELECT USING (true);
CREATE POLICY "Users can manage own experience" ON experience FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Certifications are viewable by everyone" ON certifications FOR SELECT USING (true);
CREATE POLICY "Users can manage own certifications" ON certifications FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Achievements are viewable by everyone" ON achievements FOR SELECT USING (true);
CREATE POLICY "Users can manage own achievements" ON achievements FOR ALL USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. SOCIAL & NETWORKING
-- -----------------------------------------------------------------------------
-- Bookmarks (Private)
CREATE POLICY "Bookmarks are private" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);

-- Connections (Participants only)
CREATE POLICY "Connections viewable by participants" ON connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can manage own connection requests" ON connections FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Messages (Private to participants)
CREATE POLICY "Messages private to participants" ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can mark messages as read" ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Notifications (Private to receiver)
CREATE POLICY "Notifications private to receiver" ON notifications FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can mark notifications as read" ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 5. IDEAS
-- -----------------------------------------------------------------------------
CREATE POLICY "Public ideas are viewable by everyone" ON ideas FOR SELECT
  USING (visibility = 'public' OR auth.uid() = creator_id);
CREATE POLICY "Users can manage own ideas" ON ideas FOR ALL
  USING (auth.uid() = creator_id);

CREATE POLICY "Idea requirements viewable by everyone" ON idea_requirements FOR SELECT USING (true);
CREATE POLICY "Users can manage requirements for own ideas" ON idea_requirements FOR ALL
  USING (EXISTS (SELECT 1 FROM ideas WHERE ideas.id = idea_id AND ideas.creator_id = auth.uid()));

CREATE POLICY "Idea bookmarks are private" ON idea_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own idea bookmarks" ON idea_bookmarks FOR ALL USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 6. PROJECTS (Workspace)
-- -----------------------------------------------------------------------------
CREATE POLICY "Project members can view project" ON projects FOR SELECT
  USING (EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid()));
CREATE POLICY "Project owners can manage project" ON projects FOR ALL
  USING (EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid() AND role = 'Owner'));

CREATE POLICY "Project membership viewable by members" ON project_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM project_members WHERE project_id = project_members.project_id AND user_id = auth.uid()));
CREATE POLICY "Project owners can manage membership" ON project_members FOR ALL
  USING (EXISTS (SELECT 1 FROM project_members WHERE project_id = project_members.project_id AND user_id = auth.uid() AND role = 'Owner'));

CREATE POLICY "Milestones viewable by project members" ON milestones FOR SELECT
  USING (EXISTS (SELECT 1 FROM project_members WHERE project_id = milestones.project_id AND user_id = auth.uid()));
CREATE POLICY "Project owners can manage milestones" ON milestones FOR ALL
  USING (EXISTS (SELECT 1 FROM project_members WHERE project_id = milestones.project_id AND user_id = auth.uid() AND role = 'Owner'));

CREATE POLICY "Tasks viewable by project members" ON tasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM project_members WHERE project_id = tasks.project_id AND user_id = auth.uid()));
CREATE POLICY "Project owners and assignees can manage tasks" ON tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM project_members WHERE project_id = tasks.project_id AND user_id = auth.uid() AND (role = 'Owner' OR tasks.assigned_to = auth.uid())));

-- -----------------------------------------------------------------------------
-- 7. HACKATHONS
-- -----------------------------------------------------------------------------
CREATE POLICY "Hackathons are viewable by everyone" ON hackathons FOR SELECT USING (true);
CREATE POLICY "Organizers can manage hackathons" ON hackathons FOR ALL
  USING (auth.uid() = organizer_id);

CREATE POLICY "Hackathon registrations private to user/admin" ON hackathon_registrations FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can register for hackathons" ON hackathon_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Hackathon teams viewable by everyone" ON hackathon_teams FOR SELECT USING (true);
CREATE POLICY "Captains can manage teams" ON hackathon_teams FOR ALL
  USING (EXISTS (SELECT 1 FROM hackathon_team_members WHERE team_id = hackathon_teams.id AND user_id = auth.uid() AND role = 'Captain'));

CREATE POLICY "Team membership viewable by everyone" ON hackathon_team_members FOR SELECT USING (true);
CREATE POLICY "Captains can manage team members" ON hackathon_team_members FOR ALL
  USING (EXISTS (SELECT 1 FROM hackathon_team_members WHERE team_id = hackathon_team_members.team_id AND user_id = auth.uid() AND role = 'Captain'));

-- -----------------------------------------------------------------------------
-- 8. COMPANIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Companies are viewable by everyone" ON companies FOR SELECT USING (true);
CREATE POLICY "Owners can manage companies" ON companies FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Company projects are viewable by everyone" ON company_projects FOR SELECT USING (true);

CREATE POLICY "Applications private to applicant/company" ON company_applications FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid()));
CREATE POLICY "Users can apply to companies" ON company_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Company owners can manage applications" ON company_applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- STORAGE POLICIES (Conceptual - to be applied in Supabase Dashboard)
-- -----------------------------------------------------------------------------
-- Bucket: avatars
-- SELECT: Public access
-- INSERT/UPDATE: auth.uid() = owner_id (handled by path naming convention typically)

-- Bucket: resumes
-- SELECT: Company owner of a project the user applied to, or the user themselves
-- INSERT: auth.uid() = owner
