# Kế Hoạch Test Và Kiểm Thử SMS (Theo Báo Cáo)

Cập nhật: 17/04/2026  
Nguồn đối chiếu chính:

1. `docs/reports/security_review.md`
2. `docs/reports/performance_review.md`
3. `docs/reports/routes_check_report.md`

## 1. Mục tiêu

1. Xác nhận hệ thống chạy đúng nghiệp vụ theo 3 vai trò `ADMIN/LECTURER/STUDENT`.
2. Xác nhận các rủi ro chính trong báo cáo đã được kiểm tra đầy đủ.
3. Chốt tiêu chí pass/fail trước khi release.

## 2. Môi trường kiểm thử

1. Frontend local: `http://localhost:3000`
2. Backend: Supabase DEV đã chạy `supabase/migrations/0001_schema.sql`
3. Dữ liệu: chọn 1 bộ
   - `npm run seed:demo`
   - hoặc `supabase/seed.sql`

Tài khoản test nhanh (nếu dùng `seed:demo`):

1. `ADMIN`: `admin.demo@sms.local` / `Demo@123456`
2. `LECTURER`: `ha.nguyen@sms.local` / `Demo@123456`
3. `STUDENT`: `se22001@sms.local` / `Demo@123456`

## 3. Test tự động

### 3.1 Lệnh chạy

```bash
npm run lint
npm run typecheck
npm run check
npm run build
```

### 3.2 Tiêu chí pass

1. Không có TypeScript/build error.
2. `npm run check` pass.
3. Warning React Compiler tại DataTable được ghi nhận là warning chấp nhận.

## 4. Checklist kiểm thử thủ công (SIT/UAT)

## 4.1 Auth và profile

| ID | Vai trò | Bước kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| TC-AUTH-01 | tất cả | Đăng nhập bằng account hợp lệ | Đăng nhập thành công, vào dashboard theo role |
| TC-AUTH-02 | tất cả | Quên mật khẩu -> mở link reset | Link callback đúng domain, đổi mật khẩu thành công |
| TC-AUTH-03 | tất cả | Đổi mật khẩu tại `/profile` | Cập nhật thành công, đăng nhập lại được |

## 4.2 Student flow

| ID | Vai trò | Bước kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| TC-STU-01 | STUDENT | Đăng ký học phần hợp lệ | Thành công |
| TC-STU-02 | STUDENT | Đăng ký vi phạm điều kiện (tiên quyết/trùng lịch/quá tín chỉ/hết chỗ) | Bị chặn với thông báo rõ |
| TC-STU-03 | STUDENT | Hủy đăng ký học phần trong cửa sổ cho phép | Thành công, trạng thái enrollment cập nhật |
| TC-STU-04 | STUDENT | Gửi yêu cầu phúc khảo | Thành công, trạng thái ban đầu đúng |

## 4.3 Lecturer flow

| ID | Vai trò | Bước kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| TC-LEC-01 | LECTURER | Nhập điểm thành phần tại `/lecturer/grades/[id]` | Lưu được `DRAFT` |
| TC-LEC-02 | LECTURER | Submit bảng điểm | Chỉ submit khi dữ liệu hợp lệ |
| TC-LEC-03 | LECTURER | Sửa điểm khi trạng thái không cho phép | Bị chặn đúng state machine |
| TC-LEC-04 | LECTURER | Theo dõi phúc khảo lớp phụ trách | Hiển thị đúng theo phân quyền |

## 4.4 Admin flow

| ID | Vai trò | Bước kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| TC-ADM-01 | ADMIN | Tạo sinh viên/giảng viên | Tạo đủ auth user + profile + record nghiệp vụ |
| TC-ADM-02 | ADMIN | Quản lý học phần mở + lịch học | Lưu thành công, chặn trùng phòng đúng |
| TC-ADM-03 | ADMIN | Duyệt/khóa/mở khóa điểm | Chỉ cho phép transition hợp lệ |
| TC-ADM-04 | ADMIN | Xử lý phúc khảo | Cập nhật trạng thái + ghi chú đúng |
| TC-ADM-05 | ADMIN | Vào báo cáo/audit log | Dữ liệu hiển thị đúng, không lỗi quyền |

## 5. Checklist theo nhóm rủi ro báo cáo

## 5.1 Security / Data Integrity

| ID | Mapping báo cáo | Kịch bản | Kết quả mong đợi |
|---|---|---|---|
| SEC-01 | security_review | Sinh viên đọc/sửa dữ liệu của sinh viên khác | Bị chặn bởi RLS |
| SEC-02 | security_review | Gọi `log_audit_event` không đúng quyền | Không ghi được log tùy ý |
| SEC-03 | security_review | Gửi transition điểm sai (ví dụ `DRAFT -> APPROVED`) | DB từ chối |
| SEC-04 | security_review | Xóa dữ liệu gây vi phạm quan hệ học tập | Bị chặn theo FK/rule |

## 5.2 Performance / UX

| ID | Mapping báo cáo | Kịch bản | Kết quả mong đợi |
|---|---|---|---|
| PERF-01 | performance_review | Mở `/admin/audit-logs` với dữ liệu lớn | Không timeout |
| PERF-02 | performance_review | Mở danh sách phúc khảo, lọc liên tục | UI ổn định |
| PERF-03 | performance_review | Mở trang student enrollment/grades với dữ liệu lớn | Không treo |

## 5.3 Route / UC consistency

| ID | Mapping báo cáo | Kịch bản | Kết quả mong đợi |
|---|---|---|---|
| ROUTE-01 | routes_check_report | Truy cập route chuẩn theo role | Hoạt động đúng |
| ROUTE-02 | routes_check_report | Truy cập alias legacy | Hoạt động tương thích |
| ROUTE-03 | routes_check_report | Truy cập route trái role | Bị chặn hoặc redirect đúng |

## 6. SQL verify sau test

## 6.1 Enrollment + grade

```sql
select id, student_id, course_offering_id, status
from public.enrollments
where student_id = '<STUDENT_UUID>'
order by created_at desc;
```

```sql
select id, enrollment_id, status, attendance_score, midterm_score, final_score, total_score
from public.grades
where enrollment_id = '<ENROLLMENT_UUID>';
```

## 6.2 Regrade

```sql
select id, grade_id, student_id, status, resolved_total_score, resolution_note
from public.regrade_requests
where student_id = '<STUDENT_UUID>'
order by created_at desc;
```

## 6.3 Audit

```sql
select id, actor_id, action, entity_type, entity_id, created_at
from public.audit_logs
order by created_at desc
limit 50;
```

## 7. Tiêu chí nghiệm thu

1. Pass `lint + typecheck + check + build`.
2. Pass toàn bộ test critical ở mục 4 và mục 5.
3. Không có lỗi success ảo ở các mutate chính.
4. Không có lệch quyền giữa UI route/action và backend policy trong flow chính.

## 8. Mẫu ghi lỗi kiểm thử

1. Mã test case: `TC-*`, `SEC-*`, `PERF-*`, `ROUTE-*`
2. Môi trường: `DEV/STAGING/PROD`
3. Vai trò + tài khoản test
4. Bước tái hiện
5. Kết quả thực tế
6. Kỳ vọng
7. Log/Screenshot/SQL chứng minh
