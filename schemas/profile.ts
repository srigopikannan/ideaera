import { z } from "zod";

export const profileSchema = z.object({
  username: z.string().min(3).max(30),
  full_name: z.string().min(2).max(100),
  headline: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  avatar_url: z.string().url().optional(),
  location: z.string().max(100).optional(),
  remote_preference: z.enum(["Remote", "Hybrid", "On-site"]).optional(),
  availability: z.string().max(100).optional(),
  github_url: z.string().url().optional(),
  linkedin_url: z.string().url().optional(),
  portfolio_url: z.string().url().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const skillSchema = z.object({
  skill_id: z.string().uuid(),
  level: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]),
});

export const experienceSchema = z.object({
  company: z.string().min(2).max(100),
  role: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  start_date: z.date(),
  end_date: z.date().optional(),
  is_current: z.boolean().default(false),
});

export const certificationSchema = z.object({
  name: z.string().min(2).max(100),
  issuer: z.string().min(2).max(100),
  issue_date: z.date().optional(),
  credential_url: z.string().url().optional(),
});

export const achievementSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  date: z.date().optional(),
});
