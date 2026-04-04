# Student Management System

Hệ thống quản lý sinh viên xây dựng bằng `Next.js 16 + TypeScript + Supabase`, phục vụ ba vai trò:

- `ADMIN`
- `LECTURER`
- `STUDENT`

Tài liệu này là hướng dẫn chính thức cho trạng thái hiện tại của repo. Mục tiêu là giúp bạn:

- dựng hệ thống từ đầu trên môi trường mới
- tạo tài khoản admin riêng của mình
- chọn đúng chiến lược dữ liệu khởi tạo
- chạy local, kiểm tra chất lượng và chuẩn bị deploy

## 1. Kiến trúc hiện tại

### 1.1 Stack

- Next.js 16 App Router
- TypeScript strict
- Tailwind CSS 4
- shadcn/ui
- Supabase Auth
- Supabase PostgreSQL
- React Hook Form + Zod
- TanStack Table
- Recharts

### 1.2 Năng lực nghiệp vụ

- đăng nhập, đăng xuất, quên mật khẩu, đổi mật khẩu
- phân quyền `ADMIN / LECTURER / STUDENT`
- quản trị khoa, ngành, lớp sinh hoạt, học kỳ, phòng học
- quản trị môn học, môn tiên quyết, học phần mở, phân công giảng dạy
- quản trị sinh viên, giảng viên, import CSV sinh viên
- quản trị lịch học, kiểm tra trùng phòng ở DB layer
- đăng ký và hủy đăng ký học phần bằng RPC server-side
- nhập điểm, duyệt điểm, khóa điểm, xử lý phúc khảo
- báo cáo tổng hợp và audit log

### 1.3 Cấu trúc chính của repo

```text
sms-app/
├─ docs/
├─ scripts/
│  ├─ bootstrap-admin.ts
│  ├─ demo-seed.ts
│  ├─ demo-utils.ts
│  ├─ reset-demo.ts
│  └─ seed-demo.ts
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ features/
│  ├─ lib/
│  └─ types/
├─ supabase/
│  ├─ migrations/
│  │  ├─ 0001_init_sms.sql
│  │  ├─ 0002_authz_hardening.sql
│  │  └─ 0003_fix_schedule_room_overlap.sql
│  └─ seed.sql
├─ .env.example
└─ package.json
```

## 2. Yêu cầu hệ thống

- Node.js 20+ khuyến nghị
- npm
- 1 project Supabase mới hoặc database test sạch
- quyền truy cập Supabase SQL Editor
- tùy chọn: Supabase CLI nếu bạn muốn push migration bằng CLI

## 3. Biến môi trường

Tạo `.env.local` từ `.env.example`.

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEMO_BATCH=sms-demo-2026
```

### 3.1 Ý nghĩa từng biến

| Biến | Bắt buộc | Mục đích |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Có | URL gốc của ứng dụng, dùng trong auth callback và reset password |
| `NEXT_PUBLIC_SUPABASE_URL` | Có | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Có | Public anon key cho app |
| `SUPABASE_SERVICE_ROLE_KEY` | Có cho bootstrap admin và demo scripts | Dùng cho các tác vụ quản trị hệ thống ngoài giao diện |
| `DEMO_BATCH` | Có khi dùng demo scripts | Marker để seed/reset đúng batch demo |

### 3.2 Lưu ý trên Windows PowerShell

Nếu PowerShell chặn `npm.ps1`, dùng `npm.cmd` thay cho `npm`.

Ví dụ:

```bash
npm.cmd install
npm.cmd run dev
```

## 4. Dựng hệ thống từ đầu

### Bước 1: cài dependency

```bash
npm install
```

### Bước 2: tạo project Supabase

Trong Supabase:

1. Tạo project mới.
2. Lấy:
   - Project URL
   - anon key
   - service role key
3. Điền các giá trị đó vào `.env.local`.

### Bước 3: chạy migration database

Chạy đúng thứ tự:

1. `supabase/migrations/0001_init_sms.sql`
2. `supabase/migrations/0002_authz_hardening.sql`
3. `supabase/migrations/0003_fix_schedule_room_overlap.sql`

Bạn có 2 cách:

#### Cách A: dùng Supabase CLI

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

#### Cách B: dùng SQL Editor

Mở SQL Editor và chạy từng file migration theo đúng thứ tự trên.

`0003_fix_schedule_room_overlap.sql` là migration sửa ràng buộc trùng phòng theo cả khung ngày hiệu lực, nên bắt buộc có khi setup hệ thống mới.

### Bước 4: cấu hình Supabase Auth

Trong `Authentication > URL Configuration`:

- `Site URL`: `http://localhost:3000`
- `Redirect URLs`:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/**`

Nếu bạn deploy ở môi trường khác, `Site URL` và `Redirect URLs` phải đổi theo domain thực tế của môi trường đó.

## 5. Tạo tài khoản admin riêng

Đây là cách khởi tạo được khuyến nghị cho hệ thống thật. Bạn không cần dùng tài khoản mẫu hoặc seed demo nếu mục tiêu là tự vận hành hệ thống bằng tài khoản của mình.

### 5.1 Cách khuyến nghị: bootstrap bằng script

Repo hiện có script chính thức để tạo tài khoản admin đầu tiên:

```bash
npm run admin:bootstrap -- --email admin@your-domain.com --password "StrongPassword123!" --full-name "System Administrator"
```

Ví dụ trên Windows PowerShell:

```bash
npm.cmd run admin:bootstrap -- --email admin@your-domain.com --password "StrongPassword123!" --full-name "System Administrator"
```

Tùy chọn thêm:

- `--phone 0900000000`
- `--must-change-password true`

Ví dụ đầy đủ:

```bash
npm run admin:bootstrap -- --email admin@company.com --password "StrongPassword123!" --full-name "Nguyen Van A" --phone 0900000000 --must-change-password true
```

Script sẽ:

- tạo user trong `auth.users`
- tạo profile tương ứng trong `public.profiles`
- gán `role_code = 'ADMIN'`
- gán `status = 'ACTIVE'`

### 5.2 Khi nào nên dùng cách này

Dùng `admin:bootstrap` khi:

- bạn vừa tạo project Supabase mới
- database chưa có admin thật
- bạn muốn đăng nhập bằng tài khoản riêng thay vì tài khoản seed
- bạn chuẩn bị vận hành staging hoặc production

### 5.3 Cách thủ công nếu không dùng script

1. Vào `Supabase > Authentication > Users`.
2. Tạo một user email/password mới.
3. Lấy `id` của user vừa tạo.
4. Chạy SQL sau trong SQL Editor:

```sql
insert into public.profiles (
  id,
  email,
  full_name,
  role_code,
  status,
  must_change_password,
  metadata
)
values (
  '<AUTH_USER_ID>',
  'admin@your-domain.com',
  'System Administrator',
  'ADMIN',
  'ACTIVE',
  true,
  jsonb_build_object('source', 'manual-bootstrap')
);
```

Không tạo bản ghi trong `public.profiles` thì user sẽ đăng nhập được về mặt Auth nhưng không vào được hệ thống vì middleware và session layer đọc quyền từ bảng `profiles`.

### 5.4 Khuyến nghị sau khi tạo admin

- đăng nhập bằng tài khoản admin vừa tạo
- vào `/profile`
- đổi mật khẩu ngay nếu bạn dùng mật khẩu bootstrap tạm thời
- dùng tài khoản admin này để cấu hình các dữ liệu nền thay vì dựa vào tài khoản demo

## 6. Chọn chiến lược dữ liệu ban đầu

Sau khi đã có admin riêng, bạn cần quyết định database sẽ ở chế độ nào.

### 6.1 Chế độ A: hệ thống sạch cho vận hành thật

Khuyến nghị cho:

- local development nghiêm túc
- staging gần production
- production

Thực hiện:

- chạy migration
- bootstrap admin riêng
- không chạy `supabase/seed.sql`
- không chạy `npm run seed:demo`

Sau đó đăng nhập bằng admin và nhập dữ liệu nền từ giao diện quản trị.

### 6.2 Chế độ B: seed dữ liệu ICTU đầy đủ bằng SQL

Phù hợp khi bạn cần dataset đầy đủ để demo nghiệp vụ theo kịch bản có sẵn.

Chạy toàn bộ file:

- `supabase/seed.sql`

Đặc điểm:

- script tự dọn batch `ictu-seed-2026` trước khi seed lại
- tạo luôn dữ liệu auth, hồ sơ và dữ liệu nghiệp vụ
- tất cả tài khoản trong bộ seed SQL dùng chung mật khẩu `Ictu@2026Seed`

Tài khoản nhanh:

- Admin: `daotao.admin@ictu.edu.vn`
- Lecturer: `pham.hung@ictu.edu.vn`
- Student: `dtc237340405001@st.ictu.edu.vn`

### 6.3 Chế độ C: seed batch demo bằng script TypeScript

Phù hợp khi bạn cần dataset demo nhẹ hơn và có thể reset bằng command local.

```bash
npm run seed:demo
```

Reset và seed lại:

```bash
npm run reset:demo
npm run seed:demo
```

Đặc điểm:

- yêu cầu `SUPABASE_SERVICE_ROLE_KEY`
- dữ liệu được đánh dấu bằng `is_demo = true` và `demo_batch = DEMO_BATCH`
- tất cả tài khoản demo dùng chung mật khẩu `Demo@123456`

Tài khoản nhanh:

- Admin: `admin.demo@sms.local`
- Lecturer: `ha.nguyen@sms.local`
- Student: `se22001@sms.local`

### 6.4 Quy tắc bắt buộc

Không nên trộn các chiến lược dữ liệu trên cùng một database nếu bạn không chủ động quản lý rõ mục đích của từng batch.

Khuyến nghị:

- production: chỉ bootstrap admin riêng, không seed dữ liệu mẫu
- staging demo: chọn một trong hai cách seed
- local: có thể chọn seed hoặc để database sạch tùy mục tiêu phát triển

## 7. Chạy ứng dụng local

```bash
npm run dev
```

Truy cập:

- `http://localhost:3000`

## 8. Kiểm tra chất lượng

Các lệnh chính thức:

```bash
npm run lint
npm run typecheck
npm run check
```

## 9. Scripts chính thức

```bash
npm run admin:bootstrap
npm run seed:demo
npm run reset:demo
npm run dev
npm run lint
npm run typecheck
npm run check
```

## 10. Vận hành dữ liệu demo

### 10.1 File liên quan

- `scripts/bootstrap-admin.ts`: bootstrap admin thật
- `scripts/seed-demo.ts`: entry point seed demo
- `scripts/demo-seed.ts`: dataset và logic seed demo
- `scripts/reset-demo.ts`: reset demo batch
- `scripts/demo-utils.ts`: helper cho service role và demo markers

### 10.2 Nguyên tắc reset demo

- chỉ xóa row có `is_demo = true`
- chỉ xóa đúng `demo_batch` đang cấu hình
- có kiểm tra tránh xóa nhầm dữ liệu live dùng cùng batch marker

## 11. Lộ trình setup khuyến nghị theo từng môi trường

### 11.1 Local phát triển có dữ liệu mẫu

1. tạo project Supabase mới
2. cấu hình `.env.local`
3. chạy migration
4. chọn `supabase/seed.sql` hoặc `npm run seed:demo`
5. chạy app

### 11.2 Local hoặc staging gần production

1. tạo project Supabase mới
2. cấu hình `.env.local`
3. chạy migration
4. chạy `npm run admin:bootstrap`
5. không seed dữ liệu mẫu
6. đăng nhập bằng admin riêng và nhập dữ liệu nền thật

### 11.3 Production

1. tạo project Supabase production riêng
2. chạy migration production
3. bootstrap admin riêng
4. cấu hình env trên Vercel
5. cập nhật Supabase Auth redirect URLs theo domain production
6. không chạy seed demo nếu không thực sự cần dữ liệu mẫu

## 12. Deploy

Hướng dẫn deploy riêng nằm tại:

- [docs/VERCEL_SETUP_GUIDE.md](./docs/VERCEL_SETUP_GUIDE.md)

## 13. Những điểm cần nhớ

- Quyền truy cập của hệ thống đọc từ `public.profiles`, không chỉ từ Supabase Auth.
- Tài khoản admin đầu tiên nên được tạo bằng `npm run admin:bootstrap`.
- `0003_fix_schedule_room_overlap.sql` là một phần của setup chuẩn hiện tại.
- Không dùng tài khoản demo cho production.
- Không trộn `supabase/seed.sql` và `seed:demo` nếu không thực sự chủ ý quản lý hai dataset khác nhau.

## 14. Tài liệu người dùng

Bộ tài liệu hướng dẫn sử dụng cho từng nhóm người dùng nằm tại:

- [docs/user-guides/README.md](./docs/user-guides/README.md)
