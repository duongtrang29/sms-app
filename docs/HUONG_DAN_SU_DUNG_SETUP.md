# Bộ Tài Liệu Setup + Vận Hành SMS (Bản Mới Nhất)

Cập nhật: 19/04/2026  
Phạm vi: setup local, chạy test, seed dữ liệu demo mới và deploy production lên Vercel.

## 0. Bộ tài liệu đi kèm

1. Setup + vận hành: `docs/HUONG_DAN_SU_DUNG_SETUP.md` (file này)
2. Test + kiểm thử SIT/UAT: `docs/KIEM_THU_THEO_BAO_CAO.md`
3. Chỉ mục tài liệu: `docs/README.md`

## 1. Tổng quan hệ thống

Stack chính:

1. Frontend: Next.js 16 + React 19 + TypeScript + Tailwind CSS
2. Auth + Database: Supabase Auth + PostgreSQL
3. UI/Form/Data: shadcn/ui + React Hook Form + Zod + TanStack Table
4. Charts: Recharts

Vai trò:

1. `ADMIN`
2. `LECTURER`
3. `STUDENT`

## 2. Chuẩn bị môi trường

1. Node.js >= 20
2. npm >= 10
3. Supabase project riêng cho DEV và PRODUCTION
4. (Khuyến nghị) Supabase CLI để quản lý local db/project
5. Vercel account để deploy production

## 3. Setup local từ đầu

### 3.1 Cài dependency

```bash
npm install
```

### 3.2 Tạo `.env.local`

Copy từ `.env.example`:

```bash
cp .env.example .env.local
```

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Các biến bắt buộc:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

Biến tùy chọn (bootstrap admin):

```env
ADMIN_BOOTSTRAP_EMAIL=admin@sms.local
ADMIN_BOOTSTRAP_PASSWORD=Admin@123456
ADMIN_BOOTSTRAP_FULL_NAME=System Admin
ADMIN_BOOTSTRAP_MUST_CHANGE_PASSWORD=false
```

Lưu ý:

1. Không đưa `SUPABASE_SERVICE_ROLE_KEY` vào client/public bundle.
2. `NEXT_PUBLIC_APP_URL` phải đúng URL chạy thật để flow reset password callback hoạt động.

### 3.3 Chạy schema database

Project mới chỉ chạy:

1. `supabase/migrations/0001_schema.sql`

Không chạy lại các migration trong `supabase/migrations_archive/` trên project mới.

### 3.4 Bootstrap admin

```bash
npm run admin:bootstrap
```

Nếu cần promote user hiện có trong DB:

```sql
select public.promote_profile_to_admin('user.need.admin@sms.local');
```

## 4. Seed dữ liệu demo

### 4.1 Bộ seed mới nhất (khuyến nghị)

1. Xóa dữ liệu demo cũ:

```bash
npm run db:clear
```

2. Seed đầy đủ:

```bash
npm run db:seed
```

Bộ seed này phục vụ test các flow cập nhật:

1. `/admin/offerings`
2. `/student/enrollment`
3. `/lecturer/offerings/[offeringId]` (alias) hoặc `/lecturer/grades/[id]`
4. `/admin/grades`
5. `/student/grades`
6. `/admin/reports`

Tài khoản demo chính:

1. `admin@sms.edu.vn / Admin@123456`
2. `gv.nguyen@sms.edu.vn / Gv@123456`
3. `gv.tran@sms.edu.vn / Gv@123456`
4. `gv.le@sms.edu.vn / Gv@123456`
5. `sv.001@sms.edu.vn ... sv.010@sms.edu.vn / Sv@123456`
6. Account khóa để test middleware: `sv.006@sms.edu.vn` (`INACTIVE`)

### 4.2 Seed legacy (vẫn giữ để tương thích)

1. Demo nhẹ cũ:
   1. `npm run reset:demo`
   2. `npm run seed:demo`
2. Dataset SQL lớn:
   1. `supabase/seed.sql`

Không trộn đồng thời seed legacy và seed mới nếu không có kế hoạch dọn dữ liệu rõ ràng.

## 5. Chạy và kiểm tra kỹ thuật

### 5.1 Chạy app local

```bash
npm run dev
```

URL mặc định: `http://localhost:3000`

### 5.2 Lệnh kiểm tra chất lượng

```bash
npm run lint
npm run typecheck
npm run check
npm run build
npm run test
```

## 6. Deploy production (Vercel + Supabase)

### 6.1 Chuẩn bị Supabase production

1. Tạo project Supabase production riêng.
2. Chạy `supabase/migrations/0001_schema.sql`.
3. Cấu hình Supabase Auth:
   1. `Site URL` = domain production (ví dụ `https://sms.example.com`)
   2. `Redirect URLs` gồm `https://sms.example.com/auth/callback`

### 6.2 Cấu hình project Vercel

Thiết lập Environment Variables trên Vercel cho `Production`:

1. `NEXT_PUBLIC_APP_URL`
2. `NEXT_PUBLIC_SUPABASE_URL`
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. `SUPABASE_SERVICE_ROLE_KEY`
5. `ADMIN_BOOTSTRAP_EMAIL` (khuyến nghị)
6. `ADMIN_BOOTSTRAP_PASSWORD` (khuyến nghị)
7. `ADMIN_BOOTSTRAP_FULL_NAME` (khuyến nghị)
8. `ADMIN_BOOTSTRAP_MUST_CHANGE_PASSWORD` (khuyến nghị)

### 6.3 Deploy

1. Push code lên branch release/main.
2. Tạo production deployment trên Vercel.
3. Theo dõi build log và xác nhận build pass.

### 6.4 Khởi tạo admin sau deploy

Chạy `npm run admin:bootstrap` trong môi trường đã trỏ đúng biến production để tạo profile admin đầu tiên.

### 6.5 Checklist sau deploy

1. Đăng nhập admin thành công.
2. Redirect `/dashboard` về đúng role.
3. Flow reset password hoạt động với domain production.
4. Các route role-protected bị chặn đúng khi truy cập sai vai trò.
5. Chạy thử `npm run db:seed` trên staging riêng (không chạy trên production trừ khi có chủ đích demo).

## 7. Troubleshooting nhanh

### 7.1 Lỗi đăng nhập dù user tồn tại trong auth

Nguyên nhân thường gặp: thiếu `public.profiles` hoặc sai `role_code/status`.

Xử lý:

1. Chạy lại `npm run admin:bootstrap` (với tài khoản admin)
2. Hoặc dùng `promote_profile_to_admin(...)`

### 7.2 Lỗi callback/reset password

Nguyên nhân: sai `NEXT_PUBLIC_APP_URL` hoặc Supabase Auth URL config.

Xử lý:

1. Sửa `NEXT_PUBLIC_APP_URL`
2. Sửa `Site URL` + `Redirect URLs` trong Supabase

### 7.3 Seed lỗi duplicate key

1. Chạy lại `npm run db:clear`
2. Chạy `npm run db:seed`

Script seed mới đã tự dọn dữ liệu demo theo `code/email` để chạy lặp lại an toàn.

## 8. File quan trọng

1. `README.md`
2. `docs/README.md`
3. `docs/HUONG_DAN_SU_DUNG_SETUP.md`
4. `docs/KIEM_THU_THEO_BAO_CAO.md`
5. `supabase/migrations/0001_schema.sql`
6. `scripts/seed.ts`
7. `scripts/bootstrap-admin.ts`
