import type { LucideIcon } from "lucide-react";
import {
  AlertTriangleIcon,
  BellIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  SettingsIcon,
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
      label: "Quản lý",
      items: [
        {
          icon: GraduationCapIcon,
          label: "Sinh viên",
          children: [
            { href: "/admin/students", icon: UsersIcon, label: "Danh sách sinh viên" },
            { href: "/admin/students?mode=create", icon: UsersIcon, label: "Thêm sinh viên" },
            { href: "/admin/reports", icon: AlertTriangleIcon, label: "Cảnh báo học vụ" },
          ],
        },
        {
          icon: UsersIcon,
          label: "Giảng viên",
          children: [
            { href: "/admin/lecturers", icon: UsersIcon, label: "Danh sách giảng viên" },
            { href: "/admin/offerings", icon: BookOpenIcon, label: "Phân công giảng dạy" },
          ],
        },
        {
          icon: BookOpenIcon,
          label: "Môn học",
          children: [
            { href: "/admin/courses", icon: BookOpenIcon, label: "Danh sách môn học" },
            { href: "/admin/offerings", icon: BookOpenIcon, label: "Lớp học phần" },
          ],
        },
        {
          href: "/admin/schedules",
          icon: CalendarDaysIcon,
          label: "Phòng học & Lịch",
        },
      ],
    },
    {
      label: "Báo cáo & Hệ thống",
      items: [
        {
          href: "/admin/reports",
          icon: ClipboardCheckIcon,
          label: "Thống kê & Báo cáo",
        },
        {
          href: "/admin/audit-logs",
          icon: SettingsIcon,
          label: "Cài đặt hệ thống",
        },
      ],
    },
  ],
  LECTURER: [
    {
      label: "Giảng dạy",
      items: [
        { href: "/lecturer", icon: LayoutDashboardIcon, label: "Tổng quan" },
        { href: "/lecturer/schedule", icon: CalendarDaysIcon, label: "Lịch dạy" },
        { href: "/lecturer/courses", icon: BookOpenIcon, label: "Lớp của tôi" },
      ],
    },
    {
      label: "Nghiệp vụ",
      items: [
        {
          icon: ClipboardCheckIcon,
          label: "Điểm danh",
          children: [
            {
              href: "/lecturer/offerings",
              icon: ClipboardCheckIcon,
              label: "Điểm danh nhanh",
            },
            {
              href: "/lecturer/offerings",
              icon: CalendarDaysIcon,
              label: "Lịch sử điểm danh",
            },
          ],
        },
        {
          icon: GraduationCapIcon,
          label: "Nhập điểm",
          children: [
            { href: "/lecturer/offerings", icon: GraduationCapIcon, label: "Bảng điểm" },
            {
              href: "/lecturer/regrade-requests",
              icon: ClipboardCheckIcon,
              label: "Điểm đã chốt",
            },
          ],
        },
        { href: "/lecturer/regrade-requests", icon: BellIcon, label: "Thông báo" },
      ],
    },
  ],
  STUDENT: [
    {
      label: "Học tập",
      items: [
        { href: "/student", icon: LayoutDashboardIcon, label: "Tổng quan" },
        { href: "/student/schedule", icon: CalendarDaysIcon, label: "Thời khóa biểu" },
        { href: "/student/enrollment", icon: BookOpenIcon, label: "Đăng ký môn học" },
        { href: "/student/grades", icon: GraduationCapIcon, label: "Kết quả học tập" },
      ],
    },
    {
      label: "Theo dõi",
      items: [
        { href: "/student/enrollments", icon: ClipboardCheckIcon, label: "Điểm danh" },
        { href: "/student/regrade-requests", icon: CreditCardIcon, label: "Học phí" },
      ],
    },
    {
      label: "Cá nhân",
      items: [
        { href: "/student/regrade-requests", icon: BellIcon, label: "Thông báo" },
        { href: "/profile", icon: UserCircleIcon, label: "Hồ sơ cá nhân" },
      ],
    },
  ],
};

export function flattenNavLinks(groups: SidebarNavGroup[]) {
  return groups.flatMap((group) =>
    group.items.flatMap((item) => {
      if (item.children && item.children.length > 0) {
        return item.children.map((child) => ({
          href: child.href,
          label: child.label,
        }));
      }

      if (!item.href) {
        return [];
      }

      return [{ href: item.href, label: item.label }];
    }),
  );
}
