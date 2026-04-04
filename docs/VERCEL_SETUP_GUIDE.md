# Hướng dẫn cấu hình, sử dụng và deploy trên Vercel

Tài liệu này dành riêng cho project `sms-app`.

Mục tiêu:

- cấu hình local đúng
- cấu hình Supabase đúng cho auth + redirect
- deploy step-by-step lên Vercel
- thêm domain tùy chỉnh
- biết cách test và sử dụng hệ thống sau khi deploy

## 1. Chuẩn bị

Bạn cần sẵn:

- 1 tài khoản GitHub
- 1 tài khoản Vercel
- 1 project Supabase
- 1 domain riêng nếu muốn gắn domain tùy chỉnh
- Node.js 18+

Project dùng các biến môi trường sau:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEMO_BATCH=sms-demo-2026
```

## 2. Cấu hình local step-by-step

### Bước 1: clone source và cài dependency

```bash
git clone <repo-url>
cd sms-app
npm install
```

### Bước 2: tạo file `.env.local`

Tạo `.env.local` từ `.env.example`:

```bash
cp .env.example .env.local
```

Điền giá trị thật:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
DEMO_BATCH=sms-demo-2026
```

### Bước 3: tạo project Supabase

Trong Supabase:

1. Tạo project mới.
2. Vào `Project Settings`.
3. Lấy:
   - `Project URL`
   - `anon public key`
   - `service_role key`
4. Dán vào `.env.local`.

### Bước 4: chạy migration database

Cách 1, dùng Supabase CLI:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Cách 2, dùng SQL Editor:

1. Mở SQL Editor trong Supabase.
2. Copy file migration:
   - [0001_init_sms.sql](/D:/Project/Hệ%20thống%20quản%20lý%20sinh%20viên/sms-app/supabase/migrations/0001_init_sms.sql)
3. Chạy toàn bộ script.

Lưu ý:

- Nếu bạn từng chạy file này và bị lỗi giữa chừng, sau khi cập nhật file migration mới bạn có thể chạy lại toàn bộ script trên cùng database vì phần lớn câu lệnh đã dùng `if not exists` hoặc `create or replace`.
- Nếu database test đang lộn xộn do nhiều lần chạy thử khác nhau, cách sạch nhất là tạo một project Supabase mới rồi chạy lại migration từ đầu.

### Bước 5: cấu hình Auth URL trong Supabase

Vào:

- `Authentication`
- `URL Configuration`

Thiết lập:

- `Site URL`: `http://localhost:3000`
- `Redirect URLs`:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/**`

Giải thích ngắn gọn:

- `NEXT_PUBLIC_APP_URL` là URL gốc của app trong từng môi trường.
- Ở local, để `NEXT_PUBLIC_APP_URL=http://localhost:3000` là đúng.
- `Site URL` trong Supabase là URL mặc định Supabase dùng khi code không truyền `redirectTo`.
- `Redirect URLs` là danh sách URL Supabase cho phép redirect tới khi đăng nhập, quên mật khẩu, magic link, OAuth.
- Project hiện gọi:

```ts
redirectTo: `${NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`
```

Nên callback thực tế của app là:

- `http://localhost:3000/auth/callback`

Hiểu đơn giản:

- `.env.local`: giữ `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- Supabase `Site URL`: đặt `http://localhost:3000`
- Supabase `Redirect URLs`: tối thiểu thêm `http://localhost:3000/auth/callback`
- Có thể thêm `http://localhost:3000/**` để tiện cho local/dev

Nếu bạn chỉ hỏi riêng chỗ này thì câu trả lời là: có, trong `.env.local` local bạn để `http://localhost:3000` là đúng.

### Bước 6: seed demo data

```bash
npm run seed:demo
```

Nếu muốn xóa và seed lại:

```bash
npm run reset:demo
npm run seed:demo
```

### Bước 7: chạy local

```bash
npm run dev
```

Mở:

- `http://localhost:3000`

## 3. Tài khoản demo để test

Sau khi seed:

- Admin: `admin.demo@sms.local` / `Demo@123456`
- Lecturer: `ha.nguyen@sms.local` / `Demo@123456`
- Student: `se22001@sms.local` / `Demo@123456`

## 4. Hướng dẫn sử dụng hệ thống

## 4.1 Admin

Luồng test khuyến nghị:

1. Đăng nhập bằng admin.
2. Mở `Dashboard` để xem tổng quan.
3. Vào `Sinh viên`:
   - tạo mới sinh viên
   - import CSV sinh viên
4. Vào `Giảng viên`:
   - tạo mới giảng viên
5. Vào `Khoa`, `Ngành`, `Lớp sinh hoạt`, `Học kỳ`, `Phòng học` để kiểm tra master data.
6. Vào `Môn học` để kiểm tra môn và môn tiên quyết.
7. Vào `Học phần mở` để tạo học phần theo học kỳ.
8. Vào `Lịch học` để gán lịch và phòng.
9. Vào `Duyệt điểm` để:
   - xem điểm trạng thái `SUBMITTED`
   - duyệt `APPROVED`
   - khóa `LOCKED`
10. Vào `Phúc khảo` để xem toàn bộ yêu cầu.
11. Vào `Báo cáo` để xem thống kê.
12. Vào `Audit log` để kiểm tra lịch sử thao tác.

## 4.2 Lecturer

Luồng test khuyến nghị:

1. Đăng nhập bằng giảng viên.
2. Vào `Lớp giảng dạy`.
3. Chọn 1 học phần.
4. Nhập điểm thành phần:
   - chuyên cần
   - giữa kỳ
   - cuối kỳ
5. Lưu nháp.
6. Gửi duyệt toàn bộ.
7. Vào `Phúc khảo` để xem yêu cầu thuộc học phần mình phụ trách.
8. Vào `Lịch giảng dạy` để xem lịch dạy.

## 4.3 Student

Luồng test khuyến nghị:

1. Đăng nhập bằng sinh viên.
2. Vào `Đăng ký học phần`.
3. Đăng ký 1 học phần mở.
4. Thử hủy đăng ký.
5. Vào `Thời khóa biểu`.
6. Vào `Kết quả học tập` để xem GPA và điểm.
7. Vào `Yêu cầu phúc khảo` để tạo yêu cầu mới.
8. Vào `Hồ sơ cá nhân` để kiểm tra dữ liệu cá nhân.

## 5. Chuẩn bị deploy production

Khuyến nghị:

- tạo một Supabase project riêng cho production
- không dùng chung database local/demo
- chỉ seed demo trên môi trường demo hoặc staging

### Bước 1: tạo Supabase production

Làm lại các bước giống local nhưng với project production:

1. Tạo project Supabase production.
2. Chạy migration production.
3. Chưa cần seed demo nếu đây là môi trường thật.

### Bước 2: cấu hình Auth production trong Supabase

Ví dụ domain chính bạn chọn là:

- `https://www.sms-demo.com`

Trong `Authentication > URL Configuration`:

- `Site URL`: `https://www.sms-demo.com`

`Redirect URLs` nên thêm:

- `https://www.sms-demo.com/auth/callback`
- `https://sms-demo.com/auth/callback`
- `https://www.sms-demo.com/**`
- `https://sms-demo.com/**`
- `http://localhost:3000/**`

Nếu dùng Preview Deployments trên Vercel, thêm:

- `https://*-<team-or-account-slug>.vercel.app/**`

Ví dụ nếu slug Vercel là `myteam`:

- `https://*-myteam.vercel.app/**`

## 6. Deploy lên Vercel step-by-step

Có 2 cách chính:

- deploy bằng Dashboard
- deploy bằng CLI

Với project này, nên dùng Dashboard + kết nối Git.

## 6.1 Cách khuyến nghị: deploy bằng Dashboard

### Bước 1: push source lên GitHub

```bash
git add .
git commit -m "Initial SMS deployment"
git push origin main
```

### Bước 2: import repo vào Vercel

1. Đăng nhập Vercel.
2. Chọn `Add New...`
3. Chọn `Project`
4. Chọn repo GitHub chứa `sms-app`
5. Nhấn `Import`

### Bước 3: kiểm tra project settings lúc import

Vercel thường tự detect `Next.js`.

Xác nhận:

- Framework Preset: `Next.js`
- Root Directory: thư mục chứa `package.json`
- Build Command: để mặc định
- Install Command: để mặc định
- Output Directory: để mặc định

Nếu repo của bạn chỉ chứa `sms-app` ở root thì không cần đổi `Root Directory`.

### Bước 4: thêm Environment Variables trên Vercel

Trong bước import hoặc sau đó tại:

- `Project`
- `Settings`
- `Environment Variables`

Thêm các biến:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEMO_BATCH`

Giá trị production ví dụ:

```env
NEXT_PUBLIC_APP_URL=https://www.sms-demo.com
NEXT_PUBLIC_SUPABASE_URL=https://<prod-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<prod-service-role-key>
DEMO_BATCH=sms-demo-2026
```

### Bước 5: chọn environment cho từng biến

Tối thiểu chọn:

- `Production`
- `Preview`

Gợi ý dùng:

- `Production`: bắt buộc
- `Preview`: nên có nếu bạn muốn preview build hoạt động

Lưu ý quan trọng cho project hiện tại:

- code đang dùng `NEXT_PUBLIC_APP_URL` để tạo callback URL cho reset password
- vì vậy ở `Production`, biến này phải là domain production thật
- ở `Preview`, nếu bạn chưa có domain preview ổn định thì có thể:
  - tạm đặt cùng domain production
  - hoặc chưa test luồng email reset trên preview

### Bước 6: deploy lần đầu

Nhấn `Deploy`.

Sau khi thành công, bạn sẽ có URL kiểu:

- `https://<project-name>.vercel.app`

### Bước 7: kiểm tra sau deploy

Mở site và test:

1. trang login
2. đăng nhập admin
3. truy cập dashboard
4. vào `students`, `offerings`, `reports`, `audit logs`
5. logout

## 6.2 Cách CLI

Nếu muốn deploy bằng CLI:

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

## 7. Thêm domain tùy chỉnh trên Vercel

## 7.1 Khuyến nghị chọn domain chính

Vercel khuyến nghị:

- dùng `www.domain.com` làm primary
- redirect `domain.com` sang `www.domain.com`

Ví dụ:

- primary: `www.sms-demo.com`
- redirect: `sms-demo.com` -> `www.sms-demo.com`

## 7.2 Thêm domain trong Dashboard

1. Vào project trên Vercel.
2. Chọn `Settings`.
3. Chọn `Domains`.
4. Nhấn `Add Domain`.
5. Nhập:
   - `sms-demo.com`
6. Vercel thường sẽ gợi ý thêm:
   - `www.sms-demo.com`
7. Chấp nhận thêm cả 2.

## 7.3 Cấu hình DNS nếu domain đang quản lý ở nhà cung cấp ngoài

### Trường hợp apex domain

Cho:

- `sms-demo.com`

Thêm record:

- Type: `A`
- Name: `@`
- Value: `76.76.21.21`

### Trường hợp `www`

Cho:

- `www.sms-demo.com`

Thêm record:

- Type: `CNAME`
- Name: `www`
- Value: dùng giá trị Vercel hiển thị trong Dashboard

Giá trị tổng quát Vercel docs nêu là:

- `cname.vercel-dns-0.com`

Nhưng tốt nhất:

- luôn lấy đúng giá trị Vercel hiển thị cho project của bạn

## 7.4 Cấu hình redirect apex -> www

Sau khi cả 2 domain verified:

1. Ở `Project Settings > Domains`
2. Chọn domain `sms-demo.com`
3. Chọn `Edit`
4. Ở `Redirect to`, chọn:
   - `www.sms-demo.com`

## 7.5 Nếu domain đang dùng ở Vercel account khác

Vercel có thể yêu cầu:

- xác minh TXT record

Khi đó:

1. thêm TXT record theo hướng dẫn Vercel
2. chờ verify
3. quay lại dashboard xác nhận

## 7.6 Nếu muốn dùng nameserver của Vercel

Bạn có thể đổi nameserver ở nhà đăng ký domain sang nameserver mà Vercel cung cấp.

Khi dùng cách này:

- Vercel quản lý DNS trực tiếp
- tiện hơn nếu muốn thêm wildcard domain

Lưu ý:

- nếu đổi nameserver sang Vercel, các DNS record cũ như MX/SPF/email phải được thêm lại bên Vercel nếu bạn còn dùng

## 8. Việc phải làm sau khi gắn domain

Sau khi domain verify thành công:

### Bước 1: cập nhật `NEXT_PUBLIC_APP_URL` trên Vercel

Đổi sang domain chính:

```env
NEXT_PUBLIC_APP_URL=https://www.sms-demo.com
```

### Bước 2: redeploy

Vì Vercel env chỉ áp dụng cho deployment mới.

Bạn có thể:

- push commit mới
- hoặc chọn `Redeploy`

### Bước 3: cập nhật lại Supabase Auth URL Configuration

Trong Supabase:

- `Site URL`: `https://www.sms-demo.com`
- `Redirect URLs`:
  - `https://www.sms-demo.com/**`
  - `https://sms-demo.com/**`
  - `http://localhost:3000/**`
  - `https://*-<team-or-account-slug>.vercel.app/**`

### Bước 4: test flow auth thật

Kiểm tra:

1. login
2. logout
3. forgot password
4. reset password qua email
5. callback `/auth/callback`

## 9. Checklist deploy production

Trước khi public site:

- migration đã chạy trên Supabase production
- env trên Vercel đã đủ 5 biến
- `NEXT_PUBLIC_APP_URL` đúng domain chính
- Supabase `Site URL` đúng domain chính
- Supabase `Redirect URLs` đã có local + production + preview
- domain đã verify
- apex/www redirect đã cấu hình xong
- test xong login, reset password, dashboard, role access

## 10. Lỗi thường gặp

### Build fail vì thiếu env

Triệu chứng:

- `next build` fail ở lúc collect page data

Nguyên nhân:

- thiếu:
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Login được local nhưng fail trên production

Thường do:

- Supabase `Site URL` sai
- thiếu `Redirect URLs`
- `NEXT_PUBLIC_APP_URL` không khớp domain production

### Domain đã add nhưng không truy cập được

Thường do:

- DNS chưa propagate
- sai A record hoặc CNAME
- domain đang thuộc Vercel account khác và chưa verify TXT

### Forgot password redirect sai môi trường

Nguyên nhân:

- `NEXT_PUBLIC_APP_URL` của môi trường đó chưa đúng

## 11. Tham khảo chính thức

- [Vercel Getting Started](https://vercel.com/docs/getting-started-with-vercel)
- [Deploying Git Repositories with Vercel](https://vercel.com/docs/git)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Adding & Configuring a Custom Domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
- [Setting up a custom domain](https://vercel.com/docs/domains/set-up-custom-domain)
- [Deploying & Redirecting Domains](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting)
- [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
