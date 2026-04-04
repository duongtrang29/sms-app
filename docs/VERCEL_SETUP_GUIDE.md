# Vercel Deployment Guide

Tài liệu này mô tả quy trình deploy hiện tại của `sms-app` lên Vercel theo hướng production-ready.

Mục tiêu:

- deploy frontend Next.js đúng cấu hình
- cấu hình Supabase Auth đúng callback URL
- tạo tài khoản admin riêng sau khi database sẵn sàng
- tránh dùng dữ liệu demo trên production nếu không cần

## 1. Điều kiện trước khi deploy

Bạn cần có:

- 1 repository GitHub chứa project
- 1 tài khoản Vercel
- 1 project Supabase riêng cho production hoặc staging
- migration đã sẵn trong repo:
  - `supabase/migrations/0001_init_sms.sql`
  - `supabase/migrations/0002_authz_hardening.sql`
  - `supabase/migrations/0003_fix_schedule_room_overlap.sql`

## 2. Chuẩn bị database production

Tạo project Supabase production riêng. Không dùng chung database local hoặc demo.

### 2.1 Chạy migration

Chạy đúng thứ tự:

1. `0001_init_sms.sql`
2. `0002_authz_hardening.sql`
3. `0003_fix_schedule_room_overlap.sql`

Bạn có thể dùng:

- Supabase CLI với `supabase db push`
- hoặc Supabase SQL Editor

### 2.2 Không seed dữ liệu mẫu nếu đây là môi trường thật

Khuyến nghị cho production:

- không chạy `supabase/seed.sql`
- không chạy `npm run seed:demo`

Nếu đây là staging phục vụ demo, bạn có thể seed sau, nhưng hãy làm có chủ đích.

## 3. Cấu hình Supabase Auth cho production

Ví dụ domain production:

- `https://sms.example.com`

Trong `Authentication > URL Configuration`:

- `Site URL`: `https://sms.example.com`

`Redirect URLs` nên có:

- `https://sms.example.com/auth/callback`
- `https://sms.example.com/**`
- `http://localhost:3000/**`

Nếu bạn dùng Vercel Preview Deployments, thêm wildcard preview phù hợp với team của bạn. Ví dụ:

- `https://*-your-team.vercel.app/**`

## 4. Import project vào Vercel

### 4.1 Push source lên GitHub

```bash
git add .
git commit -m "Prepare deployment"
git push origin main
```

### 4.2 Tạo project trên Vercel

1. Vào Vercel Dashboard.
2. Chọn `Add New...`
3. Chọn `Project`
4. Import repository chứa `sms-app`

### 4.3 Kiểm tra project settings

Vercel thường sẽ tự nhận diện `Next.js`.

Xác nhận:

- Framework Preset: `Next.js`
- Root Directory: thư mục chứa `package.json`
- Build Command: mặc định
- Install Command: mặc định
- Output Directory: mặc định

## 5. Environment Variables trên Vercel

Thêm các biến sau trong `Project Settings > Environment Variables`:

```env
NEXT_PUBLIC_APP_URL=https://sms.example.com
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
DEMO_BATCH=sms-demo-2026
```

### 5.1 Biến nào thực sự cần cho production

- `NEXT_PUBLIC_APP_URL`: bắt buộc
- `NEXT_PUBLIC_SUPABASE_URL`: bắt buộc
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: bắt buộc
- `SUPABASE_SERVICE_ROLE_KEY`: bắt buộc vì app có các thao tác quản trị server-side và script bootstrap admin
- `DEMO_BATCH`: không dùng nếu không seed demo, nhưng nên đặt nhất quán để các script quản trị không lỗi env

### 5.2 Environment nên chọn

Tối thiểu:

- `Production`
- `Preview`

## 6. Deploy lần đầu

Sau khi cấu hình env:

1. nhấn `Deploy`
2. chờ build hoàn tất
3. mở URL Vercel được cấp

## 7. Bootstrap tài khoản admin sau deploy

Sau khi production database đã chạy migration, tạo tài khoản admin riêng bằng script chính thức.

Chạy trên máy có source code và `.env.local` hoặc env shell trỏ đúng production Supabase:

```bash
npm run admin:bootstrap -- --email admin@your-domain.com --password "StrongPassword123!" --full-name "System Administrator"
```

Nếu đang ở Windows PowerShell:

```bash
npm.cmd run admin:bootstrap -- --email admin@your-domain.com --password "StrongPassword123!" --full-name "System Administrator"
```

Khuyến nghị:

- chỉ bootstrap admin production trên database production
- không dùng tài khoản demo trên production
- sau lần đăng nhập đầu tiên, đổi mật khẩu ngay tại `/profile`

## 8. Seed dữ liệu trên staging hoặc demo

Nếu môi trường deploy không phải production thật mà là staging/demo, bạn có thể chọn một trong hai cách:

### 8.1 Seed SQL đầy đủ

Chạy:

- `supabase/seed.sql`

Tài khoản SQL seed mặc định:

- Admin: `daotao.admin@ictu.edu.vn` / `Ictu@2026Seed`

### 8.2 Seed demo script

Chạy:

```bash
npm run seed:demo
```

Tài khoản demo mặc định:

- Admin: `admin.demo@sms.local` / `Demo@123456`

Không nên trộn cả hai chiến lược seed trên cùng một database nếu bạn không chủ động quản lý dataset.

## 9. Checklist sau deploy

Kiểm tra các mục sau:

- login hoạt động
- redirect `/auth/callback` hoạt động
- tài khoản admin riêng đăng nhập được
- `/dashboard` và các route admin mở đúng
- quên mật khẩu và reset password trả về đúng domain
- không còn dùng tài khoản mẫu nếu đây là production

## 10. Lỗi thường gặp

### Build fail vì thiếu env

Nguyên nhân phổ biến:

- thiếu `NEXT_PUBLIC_APP_URL`
- thiếu `NEXT_PUBLIC_SUPABASE_URL`
- thiếu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- thiếu `SUPABASE_SERVICE_ROLE_KEY`

### Login hoạt động local nhưng lỗi trên production

Thường do:

- `Site URL` trong Supabase sai domain
- thiếu `Redirect URLs`
- `NEXT_PUBLIC_APP_URL` trên Vercel không khớp domain production

### Tạo auth user xong nhưng không vào được hệ thống

Nguyên nhân:

- thiếu bản ghi trong `public.profiles`
- `role_code` không phải `ADMIN | LECTURER | STUDENT`
- `status` không phải `ACTIVE`

Khuyến nghị: dùng `npm run admin:bootstrap` để tránh lệch giữa Auth và `profiles`.

## 11. Tham khảo thêm

- [README.md](../README.md)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Auth Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
