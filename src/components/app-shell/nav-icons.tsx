import {
  BarChart3Icon,
  BookOpenCheckIcon,
  Building2Icon,
  CalendarDaysIcon,
  ClipboardCheckIcon,
  DoorClosedIcon,
  FileSearchIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  LibraryBigIcon,
  NotebookPenIcon,
  SchoolIcon,
  ShieldCheckIcon,
  SquareUserRoundIcon,
  Users2Icon,
  UsersRoundIcon,
} from "lucide-react";

import type { NavIconKey, NavSection } from "@/types/app";

export const navIconMap = {
  audit: ShieldCheckIcon,
  classes: SchoolIcon,
  courses: LibraryBigIcon,
  dashboard: LayoutDashboardIcon,
  departments: Building2Icon,
  grades: ClipboardCheckIcon,
  lecturers: UsersRoundIcon,
  majors: GraduationCapIcon,
  offerings: BookOpenCheckIcon,
  profile: SquareUserRoundIcon,
  regrade: FileSearchIcon,
  reports: BarChart3Icon,
  rooms: DoorClosedIcon,
  schedules: CalendarDaysIcon,
  semesters: NotebookPenIcon,
  students: Users2Icon,
} satisfies Record<NavIconKey, React.ComponentType<{ className?: string }>>;

export const navSectionLabelMap = {
  admin: "Quản trị đào tạo",
  common: "Truy cập nhanh",
  study: "Học tập",
  teaching: "Giảng dạy",
} satisfies Record<NavSection, string>;
