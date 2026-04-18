import type { LucideIcon } from "lucide-react";
import {
  AwardIcon,
  BarChart3Icon,
  BookMarkedIcon,
  BookOpenIcon,
  BriefcaseIcon,
  Building2Icon,
  CalendarDaysIcon,
  CalendarIcon,
  ClipboardCheckIcon,
  DoorOpenIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  PenLineIcon,
  PlusCircleIcon,
  ScrollTextIcon,
  UserCheckIcon,
  UserCircleIcon,
  UsersIcon,
} from "lucide-react";

import type { AppRole } from "@/types/app";

export type SidebarNavChild = {
  href: string;
  icon: LucideIcon;
  label: string;
};

export type SidebarNavItem = {
  children?: SidebarNavChild[];
  href?: string;
  icon: LucideIcon;
  label: string;
};

export type SidebarNavGroup = {
  items: SidebarNavItem[];
  label: string;
};

export const roleNavGroups: Record<AppRole, SidebarNavGroup[]> = {
  ADMIN: [
    {
      label: "Tổng quan",
      items: [
        {
          href: "/admin",
          icon: LayoutDashboardIcon,
          label: "Dashboard",
        },
      ],
    },
    {
      label: "Danh mục",
      items: [
        {
          icon: Building2Icon,
          label: "Danh mục đào tạo",
          children: [
            { href: "/admin/departments", icon: Building2Icon, label: "Khoa" },
            { href: "/admin/majors", icon: BookMarkedIcon, label: "Ngành" },
            { href: "/admin/classes", icon: UsersIcon, label: "Lớp sinh hoạt" },
            { href: "/admin/semesters", icon: CalendarIcon, label: "Học kỳ" },
            { href: "/admin/rooms", icon: DoorOpenIcon, label: "Phòng học" },
            { href: "/admin/courses", icon: BookOpenIcon, label: "Môn học" },
          ],
        },
      ],
    },
    {
      label: "Học phần & Phân công",
      items: [
        {
          icon: GraduationCapIcon,
          label: "Điều phối học phần",
          children: [
            { href: "/admin/offerings", icon: GraduationCapIcon, label: "Học phần mở" },
            { href: "/admin/offerings", icon: UserCheckIcon, label: "Phân công GV" },
            { href: "/admin/schedules", icon: CalendarDaysIcon, label: "Lịch học" },
          ],
        },
      ],
    },
    {
      label: "Sinh viên & GV",
      items: [
        {
          icon: UsersIcon,
          label: "Hồ sơ học vụ",
          children: [
            { href: "/admin/students", icon: UserCircleIcon, label: "Hồ sơ sinh viên" },
            { href: "/admin/lecturers", icon: BriefcaseIcon, label: "Hồ sơ GV" },
          ],
        },
      ],
    },
    {
      label: "Điểm & Phúc khảo",
      items: [
        {
          icon: ClipboardCheckIcon,
          label: "Điểm và phúc khảo",
          children: [
            { href: "/admin/grades", icon: ClipboardCheckIcon, label: "Duyệt điểm" },
            { href: "/admin/regrade-requests", icon: MessageSquareIcon, label: "Phúc khảo" },
          ],
        },
      ],
    },
    {
      label: "Báo cáo",
      items: [
        {
          icon: BarChart3Icon,
          label: "Báo cáo hệ thống",
          children: [
            { href: "/admin/reports", icon: BarChart3Icon, label: "Thống kê" },
            { href: "/admin/audit-logs", icon: ScrollTextIcon, label: "Nhật ký" },
          ],
        },
      ],
    },
  ],
  LECTURER: [
    {
      label: "Lớp của tôi",
      items: [
        {
          icon: LayoutDashboardIcon,
          label: "Giảng dạy",
          children: [
            { href: "/lecturer", icon: LayoutDashboardIcon, label: "Tổng quan" },
            { href: "/lecturer/offerings", icon: BookOpenIcon, label: "Học phần phụ trách" },
          ],
        },
      ],
    },
    {
      label: "Nghiệp vụ",
      items: [
        {
          icon: PenLineIcon,
          label: "Nhập điểm",
          children: [
            { href: "/lecturer/offerings", icon: PenLineIcon, label: "Nhập điểm" },
            { href: "/lecturer/regrade-requests", icon: MessageSquareIcon, label: "Phúc khảo" },
          ],
        },
      ],
    },
  ],
  STUDENT: [
    {
      label: "Học tập",
      items: [
        {
          icon: LayoutDashboardIcon,
          label: "Không gian học tập",
          children: [
            { href: "/student", icon: LayoutDashboardIcon, label: "Tổng quan" },
            { href: "/student/enrollment", icon: PlusCircleIcon, label: "Đăng ký học phần" },
            { href: "/student/schedule", icon: CalendarIcon, label: "Thời khóa biểu" },
          ],
        },
      ],
    },
    {
      label: "Kết quả",
      items: [
        {
          icon: AwardIcon,
          label: "Kết quả học tập",
          children: [
            { href: "/student/grades", icon: AwardIcon, label: "Kết quả học tập" },
            { href: "/student/regrade-requests", icon: MessageSquareIcon, label: "Phúc khảo" },
          ],
        },
      ],
    },
    {
      label: "Cá nhân",
      items: [
        {
          href: "/profile",
          icon: UserCircleIcon,
          label: "Hồ sơ cá nhân",
        },
      ],
    },
  ],
};

export function flattenNavLinks(groups: SidebarNavGroup[]) {
  return groups.flatMap((group) =>
    group.items.flatMap((item) => {
      const links: Array<{ href: string; label: string }> = [];

      if (item.href) {
        links.push({ href: item.href, label: item.label });
      }

      if (item.children && item.children.length > 0) {
        links.push(
          ...item.children.map((child) => ({
            href: child.href,
            label: child.label,
          })),
        );
      }

      return links;
    }),
  );
}
