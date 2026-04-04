import { isAppRole, roleLabel } from "@/lib/auth/roles";

const auditActionLabelMap: Record<string, string> = {
  ACADEMIC_CLASS_CREATED: "Tạo lớp sinh hoạt",
  ACADEMIC_CLASS_UPDATED: "Cập nhật lớp sinh hoạt",
  COURSE_DELETED: "Xóa môn học",
  COURSE_OFFERING_DELETED: "Xóa học phần mở",
  DEPARTMENT_CREATED: "Tạo khoa",
  DEPARTMENT_DELETED: "Xóa khoa",
  DEPARTMENT_UPDATED: "Cập nhật khoa",
  ENROLLMENT_REGISTER_TRIGGERED: "Kích hoạt đăng ký học phần",
  GRADE_BATCH_STATUS_CHANGED: "Đổi trạng thái điểm theo lô",
  GRADE_SAVED: "Lưu điểm",
  GRADE_SHEET_SUBMITTED: "Gửi bảng điểm",
  GRADE_STATUS_CHANGED: "Đổi trạng thái điểm",
  LECTURER_CREATED: "Tạo giảng viên",
  LECTURER_UPDATED: "Cập nhật giảng viên",
  MAJOR_CREATED: "Tạo ngành",
  MAJOR_UPDATED: "Cập nhật ngành",
  REGRADE_REQUEST_CREATED: "Tạo yêu cầu phúc khảo",
  REGRADE_REQUEST_RESOLVED: "Xử lý phúc khảo",
  ROOM_CREATED: "Tạo phòng học",
  ROOM_UPDATED: "Cập nhật phòng học",
  SCHEDULE_CREATED: "Tạo lịch học",
  SCHEDULE_UPDATED: "Cập nhật lịch học",
  SEMESTER_CREATED: "Tạo học kỳ",
  SEMESTER_UPDATED: "Cập nhật học kỳ",
  STUDENT_CREATED: "Tạo sinh viên",
  STUDENT_UPDATED: "Cập nhật sinh viên",
  USER_PROVISIONED: "Cấp tài khoản",
  USER_UPDATED: "Cập nhật tài khoản",
};

const auditEntityLabelMap: Record<string, string> = {
  academic_classes: "Lớp sinh hoạt",
  audit_logs: "Nhật ký hệ thống",
  course_offerings: "Học phần mở",
  courses: "Môn học",
  departments: "Khoa",
  enrollments: "Đăng ký học phần",
  grades: "Bảng điểm",
  lecturers: "Giảng viên",
  majors: "Ngành",
  profiles: "Tài khoản",
  regrade_requests: "Yêu cầu phúc khảo",
  rooms: "Phòng học",
  schedules: "Lịch học",
  semesters: "Học kỳ",
  students: "Sinh viên",
  teaching_assignments: "Phân công giảng dạy",
};

export function getAuditActionLabel(action: string | null | undefined) {
  if (!action) {
    return "Chưa có";
  }

  return auditActionLabelMap[action] ?? action;
}

export function getAuditEntityLabel(entityType: string | null | undefined) {
  if (!entityType) {
    return "Chưa có";
  }

  return auditEntityLabelMap[entityType] ?? entityType;
}

export function getAuditModeLabel(isDemo: boolean) {
  return isDemo ? "Minh họa" : "Dữ liệu thật";
}

export function getAuditRoleLabel(role: string | null | undefined) {
  if (!role) {
    return "Chưa có";
  }

  return isAppRole(role) ? roleLabel(role) : role;
}
