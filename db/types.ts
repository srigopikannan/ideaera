import { InferSelectModel } from "drizzle-orm";
import * as schema from "./schema";

export type Profile = InferSelectModel<typeof schema.profiles>;
export type Skill = {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
};
export type UserExperience = InferSelectModel<typeof schema.experience>;
export type Certification = InferSelectModel<typeof schema.certifications>;
export type Achievement = InferSelectModel<typeof schema.achievements>;

export type FullProfile = Profile & {
  skills: Skill[];
  experience: UserExperience[];
  certifications: Certification[];
  achievements: Achievement[];
  interests: string[];
};
