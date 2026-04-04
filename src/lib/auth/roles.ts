import { APP_ROLES, type AppRole } from "@/types/app";

export function isAppRole(value: string | null | undefined): value is AppRole {
  return APP_ROLES.includes(value as AppRole);
}

export function getRoleHomePath(role: AppRole) {
  return `/${role.toLowerCase()}`;
}

export function roleLabel(role: AppRole) {
  switch (role) {
    case "ADMIN":
      return "Quản trị viên";
    case "LECTURER":
      return "Giảng viên";
    case "STUDENT":
      return "Sinh viên";
  }
}
