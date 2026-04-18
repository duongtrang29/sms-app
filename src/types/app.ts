import type { Enums, Tables } from "@/types/database";

export const APP_ROLES = ["ADMIN", "LECTURER", "STUDENT"] as const;

export type AppRole = (typeof APP_ROLES)[number];
export type Profile = Tables<"profiles">;
export type Department = Tables<"departments">;
export type Major = Tables<"majors">;
export type AcademicClass = Tables<"academic_classes">;
export type Student = Tables<"students">;
export type Lecturer = Tables<"lecturers">;
export type Course = Tables<"courses">;
export type CourseOffering = Tables<"course_offerings">;
export type Semester = Tables<"semesters">;
export type Room = Tables<"rooms">;
export type Schedule = Tables<"schedules">;
export type Enrollment = Tables<"enrollments">;
export type Grade = Tables<"grades">;
export type RegradeRequest = Tables<"regrade_requests">;
export type AuditLog = Tables<"audit_logs">;

export type GradeStatus = Enums<"grade_status">;
export type OfferingStatus = Enums<"offering_status">;
export type EnrollmentStatus = Enums<"enrollment_status">;
export type RegradeStatus = Enums<"regrade_status">;
export type ProfileStatus = Enums<"profile_status">;
export type StudentStatus = Enums<"student_status">;

export type AuthenticatedProfile = Omit<Profile, "role_code"> & {
  role_code: AppRole;
};

export type NavSection =
  | "common"
  | "admin"
  | "teaching"
  | "study";

export type NavIconKey =
  | "dashboard"
  | "profile"
  | "students"
  | "lecturers"
  | "departments"
  | "majors"
  | "classes"
  | "semesters"
  | "courses"
  | "offerings"
  | "rooms"
  | "schedules"
  | "grades"
  | "regrade"
  | "reports"
  | "audit";

export type NavItem = {
  href: string;
  icon: NavIconKey;
  label: string;
  roles: AppRole[];
  section: NavSection;
};

export type ActionOutcomeStatus = "failed" | "partial" | "success";

export type ActionState<T = void> = {
  data?: T | undefined;
  errors?: Record<string, string[]> | undefined;
  message?: string | undefined;
  status: ActionOutcomeStatus;
  success: boolean;
};

export type SearchParams = {
  class?: string;
  department?: string;
  page?: string;
  pageSize?: string;
  q?: string;
  semester?: string;
  status?: string;
};
