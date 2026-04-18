# Bộ Tài Liệu Setup + Vận Hành SMS (Phiên Bản Hiện Tại)

Cập nhật: 18/04/2026  
Phạm vi: setup, sử dụng, vận hành, test và kiểm thử theo codebase hiện tại.

## 0. Bộ tài liệu đi kèm

1. Setup + vận hành: `docs/guides/HUONG_DAN_SU_DUNG_SETUP.md` (file này)
2. Test + kiểm thử SIT/UAT: `docs/guides/KIEM_THU_THEO_BAO_CAO.md`

## 1. Tổng quan hệ thống

Stack chính:

1. Frontend: Next.js 16 + React 19 + TypeScript + TailwindCSS
2. Data/Auth: Supabase PostgreSQL + Auth
3. UI/Data layer: shadcn/ui + React Hook Form + Zod + TanStack Table
4. Runtime: Node.js

Vai trò đang dùng:

1. `ADMIN`
2. `LECTURER`
3. `STUDENT`

Module chính theo route:

1. `/dashboard`
2. `/profile`
3. `/admin/*`
4. `/lecturer/*`
5. `/student/*`
6. `/login`
7. `/forgot-password`
8. `/reset-password`

## 2. Chuẩn bị môi trường

1. Node.js >= 20
2. npm >= 10
3. Supabase CLI mới nhất
4. Supabase project riêng cho DEV và PRODUCTION
5. Vercel account (nếu deploy production)

## 3. Setup mới từ đầu (DEV)

### 3.1 Cài package

```bash
npm install
```

### 3.2 Tạo `.env.local`

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
ADMIN_BOOTSTRAP_EMAIL=admin@sms.local
ADMIN_BOOTSTRAP_PASSWORD=Admin@123456
ADMIN_BOOTSTRAP_FULL_NAME=System Admin
ADMIN_BOOTSTRAP_MUST_CHANGE_PASSWORD=false
```

Lưu ý:

1. Không đưa `SUPABASE_SERVICE_ROLE_KEY` vào client/public.
2. `NEXT_PUBLIC_APP_URL` phải đúng domain chạy thật để flow reset password callback đúng.

### 3.3 Chạy migration đúng thứ tự

Khuyến nghị: dùng project Supabase mới để tránh xung đột schema legacy.

Chạy trong SQL Editor:

1. `supabase/migrations/0001_schema.sql` (bắt buộc)

Ghi chú:

1. Chỉ chạy đúng file ở mục 3.3 cho project mới.
2. Toàn bộ migration cũ nằm ở `supabase/migrations_archive/` và chỉ để tham chiếu lịch sử.
3. Không chạy các file migration legacy cũ.

### 3.4 Verify schema nhanh

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'roles','profiles','departments','majors','academic_classes',
    'semesters','courses','course_prerequisites','rooms','lecturers',
    'students','course_offerings','teaching_assignments','schedules',
    'enrollments','grades','grade_change_logs','regrade_requests','audit_logs'
  )
order by table_name;
```

```sql
select proname
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'register_enrollment',
    'cancel_enrollment',
    'log_audit_event',
    'current_user_role',
    'promote_profile_to_admin'
  )
order by proname;
```

### 3.5 Deploy Edge Functions

SMS hiện tại không có Edge Functions custom bắt buộc cho core flow.  
Bỏ qua bước này.

### 3.6 Set secret cho Edge Functions

SMS hiện tại chưa dùng secret runtime cho Edge Functions custom.  
Bỏ qua bước này.

### 3.7 Bootstrap tài khoản admin đầu tiên

Flow chuẩn:

1. Điền đúng env ở mục 3.2.
2. Chạy bootstrap:

```bash
npm run admin:bootstrap
```

3. Script sẽ tạo/cập nhật user + profile admin và in ra email/password để đăng nhập ngay.

Nếu cần promote user đã tồn tại trong `auth.users`:

```sql
select public.promote_profile_to_admin('user.need.admin@sms.local');
```

## 4. Seed dữ liệu demo local (v2)

Chạy đúng 1 trong 2 hướng:

1. Demo nhẹ:
   1. `npm run reset:demo`
   2. `npm run seed:demo`
2. Dataset ICTU:
   1. `supabase/seed.sql`

Không trộn cả 2 hướng trên cùng một database nếu không chủ động quản lý dữ liệu.

## 5. Chạy ứng dụng

```bash
npm run dev
```

Mặc định: `http://localhost:3000`

## 6. Hướng dẫn sử dụng theo vai trò

### 6.1 `ADMIN`

1. Quản trị user nghiệp vụ tại `/admin/students`, `/admin/lecturers`
2. Quản trị danh mục tại `/admin/departments`, `/admin/majors`, `/admin/classes`, `/admin/semesters`, `/admin/rooms`
3. Quản trị đào tạo tại `/admin/courses`, `/admin/offerings`, `/admin/schedules`, `/admin/grades`, `/admin/regrade-requests`
4. Theo dõi hệ thống tại `/admin/reports`, `/admin/audit-logs`

### 6.2 `LECTURER`

1. Xem học phần giảng dạy và lịch dạy
2. Nhập/sửa/submit điểm theo quyền
3. Xử lý phúc khảo theo luồng nghiệp vụ

### 6.3 `STUDENT`

1. Đăng ký và hủy đăng ký học phần
2. Xem lịch học, điểm
3. Gửi yêu cầu phúc khảo

### 6.4 Luồng vận hành ngày thường cho admin

1. Vào `/admin/semesters` cấu hình học kỳ hiện hành.
2. Vào `/admin/courses` và `/admin/offerings` mở học phần.
3. Vào `/admin/schedules` xếp lịch học.
4. Theo dõi vận hành tại `/admin/reports` và `/admin/audit-logs`.

## 7. Setup production

1. Tạo Supabase project production riêng
2. Chạy cùng migration track như mục 3.3
3. Deploy Edge Functions production: không áp dụng với SMS hiện tại
4. Set secrets production cho Edge Functions: không áp dụng với SMS hiện tại
5. Deploy frontend lên Vercel với:
   1. `NEXT_PUBLIC_APP_URL`
   2. `NEXT_PUBLIC_SUPABASE_URL`
   3. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   4. `SUPABASE_SERVICE_ROLE_KEY`
   5. `ADMIN_BOOTSTRAP_EMAIL`
   6. `ADMIN_BOOTSTRAP_PASSWORD`
   7. `ADMIN_BOOTSTRAP_FULL_NAME`
   8. `ADMIN_BOOTSTRAP_MUST_CHANGE_PASSWORD`

Lưu ý production:

1. Cấu hình Supabase Auth `Site URL` và `Redirect URLs` đúng domain production (`/auth/callback`).
2. Không hardcode service role key trong source code frontend.

## 8. Test kỹ thuật nhanh

```bash
npm run build
npm run test
```

Kết quả mong đợi hiện tại:

1. Build Next.js + TypeScript pass
2. Vitest pass toàn bộ

## 9. Kiểm thử thủ công (UAT/SIT)

Xem checklist chi tiết tại file kiểm thử:

1. [docs/guides/KIEM_THU_THEO_BAO_CAO.md](./KIEM_THU_THEO_BAO_CAO.md)

## 10. Troubleshooting thường gặp

### 10.1 Đăng nhập thất bại sau khi đã tạo tài khoản

Nguyên nhân: thiếu/sai profile role hoặc account chưa ACTIVE.

Xử lý:

1. Chạy lại `npm run admin:bootstrap`
2. Hoặc chạy `select public.promote_profile_to_admin('<email>');`

### 10.2 Lỗi quyền truy cập route theo vai trò

Nguyên nhân: role trong `public.profiles` không đúng `ADMIN/LECTURER/STUDENT`.

Xử lý:

1. Kiểm tra role tại `public.profiles`
2. Đồng bộ role bằng bootstrap/promote SQL

### 10.3 `npm run test:sql` lỗi Docker

Nguyên nhân: chưa chạy Docker Desktop.

Xử lý:

1. Cài Docker Desktop
2. Mở Docker Desktop trước khi chạy `npm run test:sql`

### 10.4 Reset password callback sai domain

Nguyên nhân: `NEXT_PUBLIC_APP_URL` hoặc Supabase Auth URL config sai.

Xử lý:

1. Sửa `NEXT_PUBLIC_APP_URL`
2. Sửa `Site URL` + `Redirect URLs` trong Supabase Auth

## 11. Danh sách file quan trọng

1. `README.md`
2. `docs/README.md`
3. `docs/guides/HUONG_DAN_SU_DUNG_SETUP.md`
4. `docs/guides/KIEM_THU_THEO_BAO_CAO.md`
5. `supabase/migrations/0001_schema.sql`
6. `supabase/seed.sql`
7. `scripts/bootstrap-admin.ts`
8. `scripts/seed-demo.ts`
9. `scripts/reset-demo.ts`
