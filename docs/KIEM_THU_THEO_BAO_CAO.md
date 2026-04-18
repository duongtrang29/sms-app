# Kế Hoạch Kiểm Thử SMS (Bản Mới Nhất)

Cập nhật: 19/04/2026

## 1. Mục tiêu

1. Xác nhận flow chính hoạt động đúng cho `ADMIN/LECTURER/STUDENT`.
2. Xác nhận dữ liệu và trạng thái DB cập nhật thật, không success ảo.
3. Xác nhận các trang đã fix theo báo cáo vận hành gần nhất.

## 2. Môi trường kiểm thử

1. App local: `http://localhost:3000`
2. DB: Supabase DEV đã chạy `supabase/migrations/0001_schema.sql`
3. Seed data:

```bash
npm run db:clear
npm run db:seed
```

## 3. Tài khoản kiểm thử chuẩn

1. Admin: `admin@sms.edu.vn / Admin@123456`
2. Lecturer: `gv.nguyen@sms.edu.vn / Gv@123456`
3. Lecturer: `gv.tran@sms.edu.vn / Gv@123456`
4. Student: `sv.003@sms.edu.vn / Sv@123456`
5. Student: `sv.004@sms.edu.vn / Sv@123456`
6. Student: `sv.005@sms.edu.vn / Sv@123456`
7. Student bị khóa: `sv.006@sms.edu.vn / Sv@123456`

## 4. Test kỹ thuật tự động

Chạy:

```bash
npm run lint
npm run typecheck
npm run check
npm run build
```

Tiêu chí pass:

1. Không có TypeScript/build error.
2. App build thành công.

## 5. Checklist SIT/UAT theo flow

## 5.1 Auth + Middleware

| ID | Bước kiểm thử | Kết quả mong đợi |
|---|---|---|
| TC-AUTH-01 | Login `admin@sms.edu.vn` | Redirect đúng vào khu vực admin |
| TC-AUTH-02 | Login `sv.006@sms.edu.vn` | Bị chặn do `INACTIVE` |
| TC-AUTH-03 | User đã login truy cập route sai role (ví dụ student vào `/admin`) | Redirect về dashboard đúng role |

## 5.2 Admin offerings `/admin/offerings`

| ID | Bước kiểm thử | Kết quả mong đợi |
|---|---|---|
| TC-OFF-01 | Tạo học phần mới hợp lệ | Lưu thành công + list cập nhật ngay |
| TC-OFF-02 | Tạo lịch học trùng phòng/trùng giờ | Bị chặn với message từ DB |
| TC-OFF-03 | Mở đăng ký/đóng đăng ký | Status và thời điểm mở/đóng cập nhật đúng |

## 5.3 Student enrollment `/student/enrollment`

| ID | Bước kiểm thử | Kết quả mong đợi |
|---|---|---|
| TC-ENR-01 | `SV003` đăng ký HP2 hợp lệ | Thành công, card chuyển sang đã đăng ký |
| TC-ENR-02 | `SV003` đăng ký HP3 (đã full) | Bị từ chối với lỗi đúng từ RPC |
| TC-ENR-03 | `SV003` hủy HP1 | Thành công, `enrolled_count` giảm đúng |

## 5.4 Lecturer grades `/lecturer/offerings/[offeringId]`

| ID | Bước kiểm thử | Kết quả mong đợi |
|---|---|---|
| TC-GRD-01 | Lecturer nhập điểm HP1 và save draft | Lưu batch thành công |
| TC-GRD-02 | Submit bảng điểm khi thiếu cột điểm | Nút submit bị chặn |
| TC-GRD-03 | Submit bảng điểm đầy đủ | Status chuyển `SUBMITTED` |
| TC-GRD-04 | Offering đã `LOCKED` | Input bị disable, không cho lưu |

## 5.5 Admin grades `/admin/grades`

| ID | Bước kiểm thử | Kết quả mong đợi |
|---|---|---|
| TC-APP-01 | Duyệt HP5 | Các grade `SUBMITTED -> APPROVED` |
| TC-APP-02 | Reject bảng điểm với lý do | Grade về `DRAFT` + lưu lý do |
| TC-APP-03 | Lock bảng điểm | Grade chuyển `LOCKED` |

## 5.6 Student grades `/student/grades`

| ID | Bước kiểm thử | Kết quả mong đợi |
|---|---|---|
| TC-STG-01 | `SV004` xem điểm | Chỉ thấy `APPROVED/LOCKED` |
| TC-STG-02 | `SV004` gửi phúc khảo | Tạo request thành công |
| TC-STG-03 | `SV005` gửi phúc khảo lần 2 | Bị chặn do đã có `PENDING` |

## 5.7 Reports `/admin/reports`

| ID | Bước kiểm thử | Kết quả mong đợi |
|---|---|---|
| TC-RPT-01 | Mở trang báo cáo | Tải được dữ liệu view, không trắng trang |
| TC-RPT-02 | Export Excel | File tải thành công, dữ liệu đúng cột |

## 6. SQL verify sau test

### 6.1 Enrollment theo sinh viên

```sql
select e.id, s.student_code, co.section_code, e.status, e.enrolled_at
from public.enrollments e
join public.students s on s.id = e.student_id
join public.course_offerings co on co.id = e.course_offering_id
where s.student_code = 'SV003'
order by e.created_at;
```

### 6.2 Grade status theo học phần

```sql
select co.section_code, g.status, count(*) as row_count
from public.grades g
join public.enrollments e on e.id = g.enrollment_id
join public.course_offerings co on co.id = e.course_offering_id
where co.section_code in ('HP5','HP6')
group by co.section_code, g.status
order by co.section_code, g.status;
```

### 6.3 Regrade theo sinh viên

```sql
select rr.id, s.student_code, rr.status, rr.reason, rr.created_at
from public.regrade_requests rr
join public.students s on s.id = rr.student_id
where s.student_code in ('SV004','SV005')
order by rr.created_at desc;
```

## 7. Tiêu chí nghiệm thu

1. Pass mục 4 (lint/typecheck/build).
2. Pass toàn bộ case critical ở mục 5.
3. Không xuất hiện success ảo ở mutate chính.
4. DB phản ánh đúng trạng thái sau thao tác UI.
