# Student Management System

Hệ thống quản lý sinh viên theo hướng production-ready ở mức đồ án/demo mạnh, xây dựng bằng `Next.js App Router + TypeScript + Tailwind + shadcn/ui + Supabase`.

Ứng dụng phục vụ 3 nhóm người dùng:

- `ADMIN`
- `LECTURER`
- `STUDENT`

Trọng tâm của phiên bản này là:

- mô hình dữ liệu đúng nghiệp vụ đại học
- auth + role model rõ ràng
- kiểm tra phân quyền ở server-side
- Row Level Security trên Supabase
- seed/reset demo data tách biệt với dữ liệu thật bằng `is_demo` + `demo_batch`
- cấu trúc code đủ sạch để tiếp tục nâng cấp thành hệ thống thật

## Stack

- Next.js 16 App Router
- TypeScript strict
- Tailwind CSS 4
- shadcn/ui
- Supabase Auth
- Supabase PostgreSQL
- React Hook Form
- Zod
- TanStack Table
- Recharts

## Refactor Highlights

Phiên bản hiện tại đã được refactor theo hướng giữ nguyên nền nghiệp vụ nhưng nâng rõ trải nghiệm dùng thử và độ sẵn sàng demo:

- làm mới design system theo nền sáng, màu trung tính + màu nhấn chính + màu trạng thái
- chuẩn hóa màu cho `badge`, `button`, `card`, `table`, `form`, `alert`
- thêm `loading`, `empty`, `error`, `success` states ở các màn hình quan trọng
- làm giàu dashboard admin, student enrollment, lecturer gradebook và các màn hình quản trị chính
- siết lại một số CRUD để thao tác thật với Supabase an toàn hơn
- bổ sung rollback khi tạo user/profile thất bại ở module sinh viên và giảng viên
- bổ sung xóa an toàn cho `courses` và `course_offerings`
- giữ demo data tách biệt hoàn toàn khỏi dữ liệu live bằng `is_demo + demo_batch`

### Màu và trạng thái

Hệ thống dùng nhóm màu semantic thay vì tô màu ngẫu nhiên:

- `primary`: hành động chính, điều hướng chính
- `success`: hoàn tất, approved, active
- `warning`: draft, submitted, pending
- `info`: open, enrolled, under review
- `danger`: rejected, cancelled, thao tác xóa
- `neutral`: locked, closed, inactive

## Tính năng chính

### Auth và hồ sơ

- đăng nhập, đăng xuất
- quên mật khẩu, đổi mật khẩu
- phân vai `ADMIN / LECTURER / STUDENT`
- hồ sơ cá nhân theo từng role

### Master data

- khoa
- ngành
- lớp sinh hoạt
- học kỳ
- phòng học
- môn học
- môn tiên quyết
- học phần mở
- phân công giảng dạy

### Sinh viên và giảng viên

- admin tạo/sửa sinh viên
- import sinh viên từ CSV
- admin tạo/sửa giảng viên
- trạng thái tài khoản và trạng thái học tập tách riêng

### Thời khóa biểu và đăng ký học phần

- mở học phần theo học kỳ
- tạo lịch học và gán phòng
- kiểm tra trùng lịch ở DB layer
- đăng ký/hủy đăng ký học phần bằng RPC server-side
- kiểm tra:
  - trùng lịch
  - quá số tín chỉ
  - thiếu môn tiên quyết
  - quá sĩ số
  - ngoài thời gian đăng ký

### Điểm và phúc khảo

- giảng viên nhập điểm thành phần
- giảng viên gửi duyệt bảng điểm
- admin duyệt / khóa / mở khóa điểm
- sinh viên xem GPA và bảng điểm cá nhân
- sinh viên gửi phúc khảo
- giảng viên và admin xử lý phúc khảo
- lưu lịch sử thay đổi điểm trong `grade_change_logs`

### Báo cáo và audit

- thống kê sinh viên theo khoa/ngành/lớp
- tỷ lệ đạt theo môn
- GPA trung bình theo lớp
- cảnh báo học vụ
- audit log cho thao tác quan trọng

## Kiến trúc thư mục

```text
sms-app/
├─ scripts/
│  ├─ demo-utils.ts
│  ├─ demo-seed.ts
│  ├─ seed-demo.ts
│  └─ reset-demo.ts
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  ├─ (protected)/
│  │  │  ├─ admin/
│  │  │  ├─ lecturer/
│  │  │  └─ student/
│  │  └─ auth/callback/
│  ├─ components/
│  │  ├─ app-shell/
│  │  ├─ auth/
│  │  ├─ dashboard/
│  │  ├─ data-table/
│  │  ├─ forms/
│  │  ├─ shared/
│  │  └─ ui/
│  ├─ features/
│  │  ├─ auth/
│  │  ├─ departments/
│  │  ├─ majors/
│  │  ├─ academic-classes/
│  │  ├─ students/
│  │  ├─ lecturers/
│  │  ├─ semesters/
│  │  ├─ rooms/
│  │  ├─ courses/
│  │  ├─ course-offerings/
│  │  ├─ schedules/
│  │  ├─ enrollments/
│  │  ├─ grades/
│  │  ├─ admin-grades/
│  │  ├─ regrades/
│  │  ├─ reports/
│  │  └─ audit-logs/
│  ├─ lib/
│  │  ├─ auth/
│  │  ├─ constants/
│  │  ├─ demo/
│  │  ├─ supabase/
│  │  └─ *.ts
│  └─ types/
├─ supabase/
│  └─ migrations/
│     └─ 0001_init_sms.sql
└─ .env.example
```

## Database

Migration chính nằm tại:

- [supabase/migrations/0001_init_sms.sql](/D:/Project/Hệ%20thống%20quản%20lý%20sinh%20viên/sms-app/supabase/migrations/0001_init_sms.sql)

Schema bao gồm các nhóm bảng chính:

- `roles`
- `profiles`
- `students`
- `lecturers`
- `departments`
- `majors`
- `academic_classes`
- `semesters`
- `courses`
- `course_prerequisites`
- `course_offerings`
- `teaching_assignments`
- `rooms`
- `schedules`
- `enrollments`
- `grades`
- `grade_change_logs`
- `regrade_requests`
- `audit_logs`

### Nguyên tắc nghiệp vụ dữ liệu

- điểm gắn với `enrollment`, không gắn trực tiếp với `student + course`
- `course_offering` là học phần mở theo học kỳ
- `teaching_assignments` xác định giảng viên nào được nhập điểm cho học phần nào
- `register_enrollment()` và `cancel_enrollment()` là RPC để khóa nghiệp vụ nhạy cảm ở DB layer
- trigger ở bảng `grades` tự tính:
  - `total_score`
  - `letter_grade`
  - `gpa_value`
- trigger chuyển trạng thái điểm chặn sai workflow

## RLS và bảo mật

Migration đã bật RLS cho các bảng chính.

Các nguyên tắc hiện tại:

- student chỉ xem dữ liệu của chính mình
- lecturer chỉ xem dữ liệu của học phần được phân công
- admin có toàn quyền quản trị
- audit log chỉ admin đọc
- regrade insert chỉ hợp lệ khi:
  - đúng sinh viên sở hữu bản ghi
  - điểm thuộc trạng thái `APPROVED` hoặc `LOCKED`
  - đang nằm trong khoảng thời gian phúc khảo của học kỳ

## Cấu hình môi trường

Tạo file `.env.local` từ `.env.example`.

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEMO_BATCH=sms-demo-2026
```

### Lưu ý

- `NEXT_PUBLIC_APP_URL` dùng cho flow reset password
- `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng cho script seed/reset và server-side helper đặc biệt
- nếu thiếu các biến này, `next build` sẽ fail ngay từ lúc collect config

## Cài đặt local

### 1. Cài dependency

```bash
npm install
```

### 2. Tạo project Supabase

1. Tạo một project mới trên Supabase.
2. Lấy:
   - Project URL
   - anon key
   - service role key
3. Điền vào `.env.local`.

### 3. Chạy migration

Có thể dùng Supabase CLI hoặc chạy SQL trực tiếp trong SQL Editor.

Ví dụ với CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Hoặc copy toàn bộ nội dung file migration và chạy trong SQL Editor:

- [supabase/migrations/0001_init_sms.sql](/D:/Project/Hệ%20thống%20quản%20lý%20sinh%20viên/sms-app/supabase/migrations/0001_init_sms.sql)

### 4. Cấu hình Auth redirect

Trong Supabase Auth:

- Site URL: `NEXT_PUBLIC_APP_URL`
- Redirect URL cần có:
  - `http://localhost:3000/auth/callback`

### 5. Chạy ứng dụng

```bash
npm run dev
```

## Seed demo data

Demo data chỉ nằm ở layer `scripts`.

- UI không hard-code tài khoản mẫu hoặc record demo để render.
- `scripts/seed-demo.ts` là entry script để seed demo data.
- `scripts/demo-seed.ts` chứa toàn bộ logic và dataset seed.
- `scripts/reset-demo.ts` là entry script để xóa demo data.
- `scripts/demo-utils.ts` chứa helper service-role, marker `is_demo/demo_batch` và reset an toàn theo batch.

### Seed

```bash
npm run seed:demo
```

Script seed sẽ:

- xóa demo batch cũ trước khi seed lại
- tạo demo users trong `auth.users`
- tạo `profiles`, `students`, `lecturers`
- tạo master data
- tạo offerings, schedules, enrollments, grades
- tạo phúc khảo, grade history, audit log mẫu

### Reset demo

```bash
npm run reset:demo
```

Script reset sẽ:

- chỉ xóa các row có `is_demo = true` và `demo_batch = <DEMO_BATCH>`
- kiểm tra batch đang reset không lẫn dữ liệu live dùng cùng `demo_batch`
- xóa theo đúng thứ tự quan hệ
- xóa luôn auth users của batch demo

### Luồng dùng khuyến nghị

```bash
npm run reset:demo
npm run seed:demo
```

Luồng này giúp làm sạch batch demo trước khi tạo lại dữ liệu mẫu mới.

### Quy tắc an toàn khi reset demo

- chỉ reset những bản ghi mang đúng `is_demo = true`
- chỉ reset đúng `demo_batch` đang cấu hình trong env
- không reset dữ liệu live ngay cả khi cùng schema
- không có demo record nào được hard-code trực tiếp trong UI

## Chiến lược demo data

Tất cả dữ liệu demo được đánh dấu bằng:

- `is_demo = true`
- `demo_batch = <DEMO_BATCH>`

Điều này giúp:

- seed lại nhiều lần mà không đụng dữ liệu thật
- xóa đúng batch demo trước khi deploy hoặc chuyển sang dùng thật
- kiểm tra nhanh dữ liệu demo/live trong báo cáo và audit log
- cô lập toàn bộ demo data trong script thay vì rải trong app/UI

### Ngoại lệ

`course_prerequisites` không có cột `is_demo`/`demo_batch`.

Vì vậy script reset xử lý riêng:

- xóa các quan hệ tiên quyết có liên quan đến demo courses
- sau đó mới xóa demo courses

## Demo accounts mặc định

Sau khi chạy `npm run seed:demo`, có thể dùng nhanh:

- Admin: `admin.demo@sms.local` / `Demo@123456`
- Lecturer: `ha.nguyen@sms.local` / `Demo@123456`
- Student: `se22001@sms.local` / `Demo@123456`

Một số tài khoản bổ sung:

- `linh.pham@sms.local`
- `huy.vo@sms.local`
- `se22002@sms.local`
- `se22003@sms.local`
- `ds23001@sms.local`
- `fin23001@sms.local`

Tất cả dùng chung mật khẩu demo: `Demo@123456`

## Kịch bản test nhanh sau khi seed

Sau khi chạy seed demo, có thể kiểm tra nhanh theo thứ tự này:

### 1. Admin dashboard

- đăng nhập bằng tài khoản admin demo
- vào `/admin`
- kiểm tra các stat card, quick links, vùng cảnh báo vận hành
- mở các module `students`, `lecturers`, `courses`, `offerings`, `reports`

### 2. Students CRUD

- vào `/admin/students`
- tạo một sinh viên mới
- sửa lại trạng thái truy cập hoặc trạng thái học tập
- import thử CSV bằng form import
- kiểm tra danh sách đã lọc được theo `q`, lớp, trạng thái

### 3. Lecturers CRUD

- vào `/admin/lecturers`
- tạo hoặc cập nhật một giảng viên
- kiểm tra bộ lọc theo khoa và trạng thái

### 4. Courses CRUD

- vào `/admin/courses`
- tạo một môn học mới
- cập nhật số tín chỉ hoặc môn tiên quyết
- thử xóa một môn học không có học phần mở
- kiểm tra hệ thống chặn xóa khi môn đang bị dùng làm tiên quyết hoặc đã có offering

### 5. Course offerings CRUD

- vào `/admin/offerings`
- mở một học phần mới
- gán giảng viên chính
- thử xóa một học phần chưa có enrollment
- kiểm tra hệ thống chặn xóa nếu học phần đã có đăng ký

### 6. Enrollment flow

- đăng nhập bằng student demo
- vào `/student/enrollments`
- đăng ký một học phần còn chỗ
- kiểm tra thông báo lỗi nếu vi phạm trùng lịch / tín chỉ / điều kiện đăng ký
- hủy đăng ký trong thời gian cho phép

### 7. Grades flow

- đăng nhập lecturer demo
- vào lớp học phần được phân công
- lưu điểm thành phần ở trạng thái `DRAFT`
- gửi duyệt bảng điểm
- đăng nhập admin và vào `/admin/grades`
- duyệt hoặc khóa điểm
- đăng nhập student và kiểm tra bảng điểm cá nhân

### 8. Reports

- vào `/admin/reports`
- kiểm tra số lượng sinh viên theo khoa/ngành/lớp
- kiểm tra GPA trung bình, tỷ lệ đạt, danh sách cảnh báo học vụ

## Scripts hữu ích

```bash
npm run dev
npm run lint
npm run typecheck
npm run check
npm run seed:demo
npm run reset:demo
```

## Kiểm tra chất lượng

Đã kiểm tra:

- `npm run typecheck`
- `npm run lint`
- `npm run build` khi env Supabase hợp lệ

`npm run build` hiện chỉ chạy tiếp được khi đã cấu hình đầy đủ biến môi trường Supabase trong `.env.local`.

## Deploy

Khuyến nghị:

- deploy frontend trên Vercel
- dùng Supabase managed Postgres/Auth

Hướng dẫn step-by-step chi tiết:

- [docs/VERCEL_SETUP_GUIDE.md](/D:/Project/Hệ%20thống%20quản%20lý%20sinh%20viên/sms-app/docs/VERCEL_SETUP_GUIDE.md)

Checklist deploy:

1. tạo project production trên Supabase
2. chạy migration production
3. cấu hình env trên Vercel
4. cập nhật Supabase Auth redirect URLs
5. không chạy `seed:demo` trên production nếu không muốn dữ liệu demo

## Hướng mở rộng tiếp theo

- thêm bulk import/export mạnh hơn cho sinh viên, giảng viên, điểm
- thêm filter/phân trang server-side cho bảng lớn
- thêm dashboard chi tiết theo học kỳ hiện tại
- thêm workflow mở khóa điểm có lý do và log chi tiết hơn
- thêm kiểm thử integration cho RPC đăng ký học phần và workflow điểm
