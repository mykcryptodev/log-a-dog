import { type Profile, type Report } from "@prisma/client";

export type ReportWithContent = Report & {
  profile: Profile | null;
};