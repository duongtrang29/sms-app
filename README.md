# Student Management System

Hệ thống quản lý sinh viên xây dựng bằng `Next.js 16.2 + TypeScript + Supabase`, phục vụ ba vai trò:

- `ADMIN`
- `LECTURER`
- `STUDENT`

Repo này đã có đủ route, server actions, schema và seed để chạy local, staging và production. Tài liệu dưới đây là cổng vào chính thức cho trạng thái hiện tại của codebase.

## 1. Tài liệu nên đọc

- [Hướng dẫn sử dụng + setup DEV/PROD](./docs/guides/HUONG_DAN_SU_DUNG_SETUP.md)
- [Kế hoạch kiểm thử theo báo cáo](./docs/guides/KIEM_THU_THEO_BAO_CAO.md)

Nếu bạn mới bắt đầu:

1. đọc mục `Quickstart` bên dưới
2. dựng local theo [docs/guides/HUONG_DAN_SU_DUNG_SETUP.md](./docs/guides/HUONG_DAN_SU_DUNG_SETUP.md)
3. chạy checklist kiểm thử tại [docs/guides/KIEM_THU_THEO_BAO_CAO.md](./docs/guides/KIEM_THU_THEO_BAO_CAO.md)

## 2. Stack hiện tại

- Next.js 16 App Router
- React 19
- TypeScript strict
- Tailwind CSS 4
- shadcn/ui
- Supabase Auth + PostgreSQL
- React Hook Form + Zod
- TanStack Table
- Recharts

## 3. Năng lực nghiệp vụ hiện có

- đăng nhập, đăng xuất, quên mật khẩu, đặt lại mật khẩu
- cập nhật hồ sơ cá nhân và đổi mật khẩu
- phân quyền `ADMIN / LECTURER / STUDENT`
- quản lý khoa, ngành, lớp sinh hoạt, học kỳ, phòng học
- quản lý môn học, môn tiên quyết, học phần mở, phân công giảng dạy
- quản lý sinh viên, giảng viên, import CSV sinh viên
- quản lý lịch học, chống trùng phòng ở DB layer
- đăng ký và hủy đăng ký học phần qua RPC server-side
- nhập điểm, lưu nháp, gửi duyệt, duyệt điểm, khóa/mở khóa điểm
- gửi và xử lý phúc khảo
- báo cáo tổng hợp và audit log

## 4. Route chuẩn của hệ thống

### Public / xác thực

- `/` -> redirect sang `/dashboard`
- `/login`
- `/forgot-password`
- `/reset-password`
- `/auth/callback`

### Dùng chung sau khi đăng nhập

- `/dashboard` -> redirect sang trang chủ theo role
- `/profile`

### Admin

- `/admin`
- `/admin/students`
- `/admin/lecturers`
- `/admin/departments`
- `/admin/majors`
- `/admin/classes`
- `/admin/semesters`
- `/admin/courses`
- `/admin/offerings`
- `/admin/rooms`
- `/admin/schedules`
- `/admin/grades`
- `/admin/regrade-requests`
- `/admin/reports`
- `/admin/audit-logs`

### Lecturer

- `/lecturer`
- `/lecturer/courses`
- `/lecturer/grades/[id]`
- `/lecturer/schedule`
- `/lecturer/regrade-requests`

### Student

- `/student`
- `/student/enrollment`
- `/student/schedule`
- `/student/grades`
- `/student/regrade-requests`

### Legacy alias vẫn đang hoạt động

- `/lecturer/offerings` -> alias cũ của danh sách lớp giảng dạy
- `/lecturer/offerings/[offeringId]` -> alias cũ của bảng điểm giảng viên
- `/student/enrollments` -> alias cũ của đăng ký học phần

Tài liệu người dùng từ giờ dùng route chuẩn, không dùng alias cũ.

## 5. Quickstart local

### Bước 1: cài dependency

```bash
npm install
```

### Bước 2: tạo file env

Tạo `.env.local` từ `.env.example`.

```bash
cp .env.example .env.local
```

Trên Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

### Bước 3: cấu hình Supabase trong `.env.local`

Chỉ cần đảm bảo đúng 4 biến:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Bước 4: chạy schema baseline duy nhất

- `supabase/migrations/0001_schema.sql`

Các migration lịch sử được lưu tại `supabase/migrations_archive/` để tra cứu, không dùng cho `db push` mới.
Hướng dẫn chi tiết nằm ở [docs/guides/HUONG_DAN_SU_DUNG_SETUP.md](./docs/guides/HUONG_DAN_SU_DUNG_SETUP.md).

### Bước 5: tạo admin đăng nhập (lệnh ngắn)

```bash
npm run admin:bootstrap
```

Mặc định script sẽ tạo/cập nhật:

- Email: `admin@sms.local`
- Password: `Admin@123456`
- Role: `ADMIN`
- Status: `ACTIVE`

Muốn đổi thông tin thì sửa trong `.env.local`:

- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`
- `ADMIN_BOOTSTRAP_FULL_NAME`

### Bước 6 (tuỳ chọn): nạp dữ liệu demo

- demo nhẹ: `npm run seed:demo`
- dataset ICTU đầy đủ: chạy `supabase/seed.sql`

### Bước 7: chạy app

```bash
npm run dev
```

Mở `http://localhost:3000`.

## 6. Các lệnh quan trọng

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run check
npm run test
npm run test:sql
npm run admin:bootstrap
npm run setup:quick
npm run seed:demo
npm run reset:demo
```

`npm run test:sql` yêu cầu Docker Desktop đang chạy để Supabase local có thể `db reset`.

## 7. Chiến lược dữ liệu khởi tạo

### Khuyến nghị cho local dev nghiêm túc / staging / production

- chạy `supabase/migrations/0001_schema.sql`
- bootstrap admin riêng bằng `npm run admin:bootstrap`
- không seed dữ liệu mẫu nếu không cần demo

### Dùng `supabase/seed.sql`

Phù hợp khi cần dataset ICTU nhiều dữ liệu để demo báo cáo, bảng điểm và phúc khảo.

- mật khẩu mặc định: `Ictu@2026Seed`
- admin mẫu: `daotao.admin@ictu.edu.vn`

### Dùng `npm run seed:demo`

Phù hợp khi cần dataset nhẹ hơn, reset nhanh bằng script.

- mật khẩu mặc định: `Demo@123456`
- admin mẫu: `admin.demo@sms.local`
- lecturer mẫu: `ha.nguyen@sms.local`
- student mẫu: `se22001@sms.local`

## 8. Lưu ý môi trường production

- app runtime và các script quản trị đều dùng `SUPABASE_SERVICE_ROLE_KEY` cho một số tác vụ quản trị người dùng, vì vậy biến này phải có trên server và tuyệt đối không được lộ phía client
- `NEXT_PUBLIC_APP_URL` phải khớp domain thật của môi trường đang chạy, nhất là cho flow quên mật khẩu / reset password
- `public.profiles` là nguồn sự thật cho phân quyền; tạo Auth user mà không có profile tương ứng thì user không vào được hệ thống

Nếu cần nâng nhanh user có sẵn lên admin trong SQL Editor:

```sql
select public.promote_profile_to_admin('admin@sms.local');
```

Hướng dẫn production chi tiết nằm ở [docs/guides/HUONG_DAN_SU_DUNG_SETUP.md](./docs/guides/HUONG_DAN_SU_DUNG_SETUP.md).

## 9. Những điểm kỹ thuật cần nhớ

- `src/proxy.ts` dùng để refresh session/cookies trên các request động
- `/auth/callback` là điểm vào để Supabase đổi `code` lấy session
- route `/dashboard` không phải dashboard riêng, mà là điểm redirect về `/admin`, `/lecturer` hoặc `/student`
- `npm run check` hiện pass với `0 errors`; còn `1` warning đã chấp nhận ở `useReactTable` do React Compiler không memo hóa an toàn API của TanStack Table

## 10. Cấu trúc repo

```text
sms-app/
├─ docs/
├─ public/
├─ scripts/
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ features/
│  ├─ lib/
│  └─ types/
├─ supabase/
│  ├─ migrations/
│  ├─ migrations_archive/
│  └─ seed.sql
├─ .env.example
└─ package.json
```
