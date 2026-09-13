import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const skillLevelEnum = pgEnum("skill_level", ["Beginner", "Intermediate", "Advanced", "Expert"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().notNull(), // Matches auth.users.id
  username: text("username").unique().notNull(),
  full_name: text("full_name").notNull(),
  headline: text("headline"),
  bio: text("bio"),
  avatar_url: text("avatar_url"),
  location: text("location"),
  remote_preference: text("remote_preference"), // e.g., "Remote", "Hybrid", "On-site"
  availability: text("availability"), // e.g., "Available Now", "Open to offers", "Not looking"
  github_url: text("github_url"),
  linkedin_url: text("linkedin_url"),
  portfolio_url: text("portfolio_url"),
  updated_at: timestamp("updated_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").unique().notNull(),
});

export const user_skills = pgTable("user_skills", {
  user_id: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  skill_id: uuid("skill_id").references(() => skills.id, { onDelete: "cascade" }).notNull(),
  level: skillLevelEnum("level").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  pk: {
    composite: [t.user_id, t.skill_id],
  },
}));

export const experience = pgTable("experience", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  description: text("description"),
  start_date: timestamp("start_date").notNull(),
  end_date: timestamp("end_date"),
  is_current: boolean("is_current").default(false),
});

export const certifications = pgTable("certifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  issuer: text("issuer").notNull(),
  issue_date: timestamp("issue_date"),
  credential_url: text("credential_url"),
});

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date"),
});

export const interests = pgTable("interests", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").unique().notNull(),
});

export const user_interests = pgTable("user_interests", {
  user_id: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  interest_id: uuid("interest_id").references(() => interests.id, { onDelete: "cascade" }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  pk: {
    composite: [t.user_id, t.interest_id],
  },
}));

export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  target_user_id: uuid("target_user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  pk: {
    composite: [t.user_id, t.target_user_id],
  },
}));

export const connections = pgTable("connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  requester_id: uuid("requester_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  receiver_id: uuid("receiver_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  status: text("status").notNull(), // "pending", "accepted", "rejected"
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (t) => ({
  unique_request: {
    composite: [t.requester_id, t.receiver_id],
  },
}));

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sender_id: uuid("sender_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  receiver_id: uuid("receiver_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // "connection_request", "connection_accepted", "project_invite", etc.
  entity_id: uuid("entity_id"), // ID of the project, user, etc.
  message: text("message").notNull(),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const ideaStageEnum = pgEnum("idea_stage", ["Idea", "Planning", "Prototype", "MVP", "Testing", "Launch"]);

export const ideas = pgTable("ideas", {
  id: uuid("id").primaryKey().defaultRandom(),
  creator_id: uuid("creator_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  problem: text("problem").notNull(),
  solution: text("solution").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  stage: ideaStageEnum("stage").default("Idea").notNull(),
  visibility: text("visibility").default("public").notNull(), // "public", "private"
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const idea_requirements = pgTable("idea_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  idea_id: uuid("idea_id").references(() => ideas.id, { onDelete: "cascade" }).notNull(),
  skill_id: uuid("skill_id").references(() => skills.id, { onDelete: "cascade" }).notNull(),
  min_level: skillLevelEnum("min_level").notNull(),
  priority: text("priority").default("medium").notNull(), // "low", "medium", "high"
});

export const idea_bookmarks = pgTable("idea_bookmarks", {
  user_id: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  idea_id: uuid("idea_id").references(() => ideas.id, { onDelete: "cascade" }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  pk: {
    composite: [t.user_id, t.idea_id],
  },
}));

export const projectRoleEnum = pgEnum("project_role", ["Owner", "Contributor", "Viewer"]);
export const taskStatusEnum = pgEnum("task_status", ["Todo", "In Progress", "Review", "Completed"]);
export const taskPriorityEnum = pgEnum("task_priority", ["Low", "Medium", "High", "Urgent"]);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  owner_id: uuid("owner_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  idea_id: uuid("idea_id").references(() => ideas.id),
  repository_url: text("repository_url"),
  deployment_url: text("deployment_url"),
  status: text("status").default("active").notNull(), // "active", "archived", "completed"
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const project_members = pgTable("project_members", {
  project_id: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  user_id: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  role: projectRoleEnum("role").default("Contributor").notNull(),
  joined_at: timestamp("joined_at").defaultNow().notNull(),
}, (t) => ({
  pk: {
    composite: [t.project_id, t.user_id],
  },
}));

export const milestones = pgTable("milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  due_date: timestamp("due_date"),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  milestone_id: uuid("milestone_id").references(() => milestones.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  assigned_to: uuid("assigned_to").references(() => profiles.id, { onDelete: "set null" }),
  status: taskStatusEnum("status").default("Todo").notNull(),
  priority: taskPriorityEnum("priority").default("Medium").notNull(),
  due_date: timestamp("due_date"),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const hackathons = pgTable("hackathons", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  organizer_id: uuid("organizer_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  start_date: timestamp("start_date").notNull(),
  end_date: timestamp("end_date").notNull(),
  location: text("location").notNull(), // "Online", "City, Country", etc.
  prize_pool: text("prize_pool"),
  max_team_size: integer("max_team_size").default(4),
  min_team_size: integer("min_team_size").default(1),
  registration_deadline: timestamp("registration_deadline").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const hackathon_registrations = pgTable("hackathon_registrations", {
  user_id: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  hackathon_id: uuid("hackathon_id").references(() => hackathons.id, { onDelete: "cascade" }).notNull(),
  registered_at: timestamp("registered_at").defaultNow().notNull(),
}, (t) => ({
  pk: {
    composite: [t.user_id, t.hackathon_id],
  },
}));

export const hackathon_teams = pgTable("hackathon_teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  hackathon_id: uuid("hackathon_id").references(() => hackathons.id, { onDelete: "cascade" }).notNull(),
  team_name: text("team_name").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const hackathon_team_members = pgTable("hackathon_team_members", {
  team_id: uuid("team_id").references(() => hackathon_teams.id, { onDelete: "cascade" }).notNull(),
  user_id: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  role: text("role").default("Member").notNull(), // "Captain", "Member"
  joined_at: timestamp("joined_at").defaultNow().notNull(),
}, (t) => ({
  pk: {
    composite: [t.team_id, t.user_id],
  },
}));

export const applicationStatusEnum = pgEnum("application_status", ["Pending", "Reviewing", "Accepted", "Rejected"]);

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description").notNull(),
  website_url: text("website_url"),
  logo_url: text("logo_url"),
  industry: text("industry"),
  size: text("size"), // e.g. "1-10", "11-50", "51-200", "201+"
  location: text("location"),
  owner_id: uuid("owner_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const company_projects = pgTable("company_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  project_id: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
}, (t) => ({
  pk: {
    composite: [t.company_id, t.project_id],
  },
}));

export const company_applications = pgTable("company_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  user_id: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  project_id: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  status: applicationStatusEnum("status").default("Pending").notNull(),
  cover_letter: text("cover_letter"),
  resume_url: text("resume_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow(),
});
export const profilesRelations = relations(profiles, ({ many }) => ({
  userSkills: many(user_skills),
  userInterests: many(user_interests),
  experiences: many(experience),
  certifications: many(certifications),
  achievements: many(achievements),
  ideas: many(ideas),
  ownedProjects: many(projects),
  projectMemberships: many(project_members),
  hackathons: many(hackathons),
  hackathonRegistrations: many(hackathon_registrations),
  hackathonTeamMemberships: many(hackathon_team_members),
  companyMemberships: many(company_applications),
  sentMessages: many(messages, {
    relationName: "sender",
  }),
  receivedMessages: many(messages, {
    relationName: "receiver",
  }),
  notifications: many(notifications),
  bookmarks: many(bookmarks, {
    relationName: "bookmarkOwner",
  }),
  bookmarkedBy: many(bookmarks, {
    relationName: "bookmarkedUser",
  }),
  requestedConnections: many(connections, {
    relationName: "requester",
  }),
  receivedConnections: many(connections, {
    relationName: "receiver",
  }),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  userSkills: many(user_skills),
  ideaRequirements: many(idea_requirements),
}));

export const userSkillsRelations = relations(user_skills, ({ one }) => ({
  user: one(profiles, {
    fields: [user_skills.user_id],
    references: [profiles.id],
  }),
  skill: one(skills, {
    fields: [user_skills.skill_id],
    references: [skills.id],
  }),
}));

export const interestsRelations = relations(interests, ({ many }) => ({
  userInterests: many(user_interests),
}));

export const userInterestsRelations = relations(user_interests, ({ one }) => ({
  user: one(profiles, {
    fields: [user_interests.user_id],
    references: [profiles.id],
  }),
  interest: one(interests, {
    fields: [user_interests.interest_id],
    references: [interests.id],
  }),
}));

export const experienceRelations = relations(experience, ({ one }) => ({
  user: one(profiles, {
    fields: [experience.user_id],
    references: [profiles.id],
  }),
}));

export const certificationsRelations = relations(certifications, ({ one }) => ({
  user: one(profiles, {
    fields: [certifications.user_id],
    references: [profiles.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(profiles, {
    fields: [achievements.user_id],
    references: [profiles.id],
  }),
}));

export const ideasRelations = relations(ideas, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [ideas.creator_id],
    references: [profiles.id],
  }),
  requirements: many(idea_requirements),
  bookmarks: many(idea_bookmarks),
  projects: many(projects),
}));

export const ideaRequirementsRelations = relations(
  idea_requirements,
  ({ one }) => ({
    idea: one(ideas, {
      fields: [idea_requirements.idea_id],
      references: [ideas.id],
    }),
    skill: one(skills, {
      fields: [idea_requirements.skill_id],
      references: [skills.id],
    }),
  })
);

export const ideaBookmarksRelations = relations(idea_bookmarks, ({ one }) => ({
  user: one(profiles, {
    fields: [idea_bookmarks.user_id],
    references: [profiles.id],
  }),
  idea: one(ideas, {
    fields: [idea_bookmarks.idea_id],
    references: [ideas.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [projects.owner_id],
    references: [profiles.id],
  }),
  idea: one(ideas, {
    fields: [projects.idea_id],
    references: [ideas.id],
  }),
  members: many(project_members),
  milestones: many(milestones),
  tasks: many(tasks),
  companyProjects: many(company_projects),
}));

export const projectMembersRelations = relations(
  project_members,
  ({ one }) => ({
    project: one(projects, {
      fields: [project_members.project_id],
      references: [projects.id],
    }),
    user: one(profiles, {
      fields: [project_members.user_id],
      references: [profiles.id],
    }),
  })
);

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  project: one(projects, {
    fields: [milestones.project_id],
    references: [projects.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.project_id],
    references: [projects.id],
  }),
  milestone: one(milestones, {
    fields: [tasks.milestone_id],
    references: [milestones.id],
  }),
  assignee: one(profiles, {
    fields: [tasks.assigned_to],
    references: [profiles.id],
  }),
}));

export const hackathonsRelations = relations(
  hackathons,
  ({ one, many }) => ({
    organizer: one(profiles, {
      fields: [hackathons.organizer_id],
      references: [profiles.id],
    }),
    registrations: many(hackathon_registrations),
    teams: many(hackathon_teams),
  })
);

export const hackathonRegistrationsRelations = relations(
  hackathon_registrations,
  ({ one }) => ({
    user: one(profiles, {
      fields: [hackathon_registrations.user_id],
      references: [profiles.id],
    }),
    hackathon: one(hackathons, {
      fields: [hackathon_registrations.hackathon_id],
      references: [hackathons.id],
    }),
  })
);

export const hackathonTeamsRelations = relations(
  hackathon_teams,
  ({ one, many }) => ({
    hackathon: one(hackathons, {
      fields: [hackathon_teams.hackathon_id],
      references: [hackathons.id],
    }),
    members: many(hackathon_team_members),
  })
);

export const hackathonTeamMembersRelations = relations(
  hackathon_team_members,
  ({ one }) => ({
    team: one(hackathon_teams, {
      fields: [hackathon_team_members.team_id],
      references: [hackathon_teams.id],
    }),
    user: one(profiles, {
      fields: [hackathon_team_members.user_id],
      references: [profiles.id],
    }),
  })
);

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(profiles, {
    fields: [messages.sender_id],
    references: [profiles.id],
    relationName: "sender",
  }),
  receiver: one(profiles, {
    fields: [messages.receiver_id],
    references: [profiles.id],
    relationName: "receiver",
  }),
}));

export const notificationsRelations = relations(
  notifications,
  ({ one }) => ({
    user: one(profiles, {
      fields: [notifications.user_id],
      references: [profiles.id],
    }),
  })
);

export const connectionsRelations = relations(
  connections,
  ({ one }) => ({
    requester: one(profiles, {
      fields: [connections.requester_id],
      references: [profiles.id],
      relationName: "requester",
    }),
    receiver: one(profiles, {
      fields: [connections.receiver_id],
      references: [profiles.id],
      relationName: "receiver",
    }),
  })
);

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  bookmarkOwner: one(profiles, {
    fields: [bookmarks.user_id],
    references: [profiles.id],
    relationName: "bookmarkOwner",
  }),
  bookmarkedUser: one(profiles, {
    fields: [bookmarks.target_user_id],
    references: [profiles.id],
    relationName: "bookmarkedUser",
  }),
}));

export const companiesRelations = relations(
  companies,
  ({ one, many }) => ({
    owner: one(profiles, {
      fields: [companies.owner_id],
      references: [profiles.id],
    }),
    projects: many(company_projects),
    applications: many(company_applications),
  })
);

export const companyProjectsRelations = relations(
  company_projects,
  ({ one }) => ({
    company: one(companies, {
      fields: [company_projects.company_id],
      references: [companies.id],
    }),
    project: one(projects, {
      fields: [company_projects.project_id],
      references: [projects.id],
    }),
  })
);

export const companyApplicationsRelations = relations(
  company_applications,
  ({ one }) => ({
    company: one(companies, {
      fields: [company_applications.company_id],
      references: [companies.id],
    }),
    user: one(profiles, {
      fields: [company_applications.user_id],
      references: [profiles.id],
    }),
    project: one(projects, {
      fields: [company_applications.project_id],
      references: [projects.id],
    }),
  })
);