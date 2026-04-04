-- ICTU-context seed data for the Student Management System.
-- Public context used: Trường Đại học Công nghệ Thông tin và Truyền thông, trực thuộc Đại học Thái Nguyên;
-- dataset focuses on Khoa Công nghệ thông tin và Khoa Hệ thống thông tin kinh tế cùng các ngành
-- Kỹ thuật phần mềm, Hệ thống thông tin, Hệ thống thông tin quản lý, Thương mại điện tử.
-- All lecturer/student names, emails, phones, addresses, grades, and audit traces below are fabricated.
-- Demo password for seeded auth accounts: Ictu@2026Seed

begin;

-- Seed configuration
create temporary table tmp_seed_config (
  seed_batch text primary key,
  default_password text not null
) on commit drop;

insert into tmp_seed_config (seed_batch, default_password)
values ('ictu-seed-2026', 'Ictu@2026Seed');

-- Accounts mapped to auth.users + public.profiles
create temporary table tmp_seed_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  role_code text not null,
  profile_status text not null,
  phone text,
  must_change_password boolean not null default false,
  employee_code text,
  academic_title text,
  department_code text,
  hire_date date,
  office_location text,
  bio text,
  student_code text,
  class_code text,
  enrollment_year integer,
  current_status text,
  gender text,
  date_of_birth date,
  address text,
  emergency_contact text
) on commit drop;

-- Public master data
create temporary table tmp_departments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text
) on commit drop;

create temporary table tmp_majors (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  department_code text not null,
  degree_level text not null default 'UNDERGRADUATE'
) on commit drop;

create temporary table tmp_classes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  major_code text not null,
  cohort_year integer not null
) on commit drop;

create temporary table tmp_semesters (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  academic_year text not null,
  start_date date not null,
  end_date date not null,
  enrollment_start timestamptz not null,
  enrollment_end timestamptz not null,
  regrade_open_at timestamptz,
  regrade_close_at timestamptz,
  max_credits integer not null,
  is_current boolean not null
) on commit drop;

create temporary table tmp_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  building text,
  capacity integer not null
) on commit drop;

create temporary table tmp_courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  department_code text not null,
  credit_hours integer not null,
  total_sessions smallint not null,
  description text
) on commit drop;

create temporary table tmp_course_prerequisites (
  course_code text not null,
  prerequisite_code text not null,
  minimum_score numeric(4, 2) not null
) on commit drop;

create temporary table tmp_offerings (
  id uuid primary key default gen_random_uuid(),
  offering_key text not null unique,
  course_code text not null,
  semester_code text not null,
  section_code text not null,
  title text,
  max_capacity integer not null,
  registration_open_at timestamptz not null,
  registration_close_at timestamptz not null,
  attendance_weight numeric(5, 2) not null,
  midterm_weight numeric(5, 2) not null,
  final_weight numeric(5, 2) not null,
  passing_score numeric(4, 2) not null,
  status text not null,
  notes text
) on commit drop;

create temporary table tmp_teaching_assignments (
  id uuid primary key default gen_random_uuid(),
  offering_key text not null,
  lecturer_email text not null,
  assignment_role text not null,
  is_primary boolean not null
) on commit drop;

create temporary table tmp_schedules (
  id uuid primary key default gen_random_uuid(),
  offering_key text not null,
  room_code text,
  day_of_week smallint not null,
  start_time time not null,
  end_time time not null,
  week_pattern text not null default 'ALL',
  start_date date,
  end_date date,
  note text
) on commit drop;

create temporary table tmp_enrollments (
  id uuid primary key default gen_random_uuid(),
  enrollment_key text not null unique,
  student_code text not null,
  offering_key text not null,
  status text not null,
  enrolled_at timestamptz not null,
  dropped_at timestamptz,
  drop_reason text,
  approved_by_email text
) on commit drop;

create temporary table tmp_grades (
  id uuid primary key default gen_random_uuid(),
  grade_key text not null unique,
  enrollment_key text not null,
  attendance_score numeric(4, 2),
  midterm_score numeric(4, 2),
  final_score numeric(4, 2),
  status text not null,
  remark text,
  submitted_at timestamptz,
  submitted_by_email text,
  approved_at timestamptz,
  approved_by_email text,
  locked_at timestamptz,
  locked_by_email text
) on commit drop;

create temporary table tmp_grade_change_logs (
  id uuid primary key default gen_random_uuid(),
  grade_key text not null,
  changed_by_email text,
  change_type text not null,
  old_payload jsonb not null,
  new_payload jsonb not null,
  note text,
  created_at timestamptz not null
) on commit drop;

create temporary table tmp_regrade_requests (
  id uuid primary key default gen_random_uuid(),
  request_key text not null unique,
  grade_key text not null,
  enrollment_key text not null,
  student_code text not null,
  reason text not null,
  status text not null,
  previous_total_score numeric(4, 2),
  resolved_total_score numeric(4, 2),
  reviewed_at timestamptz,
  reviewed_by_email text,
  resolution_note text,
  submitted_at timestamptz not null
) on commit drop;

create temporary table tmp_audit_logs (
  actor_email text,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id text,
  target_email text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null
) on commit drop;

insert into tmp_seed_users (
  email,
  full_name,
  role_code,
  profile_status,
  phone,
  must_change_password,
  employee_code,
  academic_title,
  department_code,
  hire_date,
  office_location,
  bio,
  address
)
values
  (
    'daotao.admin@ictu.edu.vn',
    'Quản trị đào tạo ICTU',
    'ADMIN',
    'ACTIVE',
    '02083790001',
    false,
    null,
    null,
    null,
    null,
    'C1-301',
    'Tài khoản quản trị phục vụ vận hành và trình chiếu hệ thống.',
    'Phường Tân Thịnh, TP. Thái Nguyên'
  ),
  (
    'pham.hung@ictu.edu.vn',
    'Phạm Quang Hưng',
    'LECTURER',
    'ACTIVE',
    '0326801001',
    false,
    'ICTU-CNTT-01',
    'TS.',
    'CNTT',
    date '2016-09-01',
    'C1-401',
    'Phụ trách học phần lập trình và kỹ thuật phần mềm.',
    'TP. Thái Nguyên, Thái Nguyên'
  ),
  (
    'minh.ha@ictu.edu.vn',
    'Nguyễn Minh Hà',
    'LECTURER',
    'ACTIVE',
    '0326801002',
    false,
    'ICTU-CNTT-02',
    'ThS.',
    'CNTT',
    date '2018-08-15',
    'C1-403',
    'Giảng dạy cơ sở dữ liệu, phát triển ứng dụng web và hệ quản trị cơ sở dữ liệu.',
    'TP. Sông Công, Thái Nguyên'
  ),
  (
    'thu.phuong@ictu.edu.vn',
    'Trần Thu Phương',
    'LECTURER',
    'ACTIVE',
    '0326801003',
    false,
    'ICTU-CNTT-03',
    'ThS.',
    'CNTT',
    date '2019-09-10',
    'C1-405',
    'Giảng viên nhóm học phần kiến trúc dữ liệu và kiểm thử phần mềm.',
    'Phổ Yên, Thái Nguyên'
  ),
  (
    'quoc.bao@ictu.edu.vn',
    'Lê Quốc Bảo',
    'LECTURER',
    'ACTIVE',
    '0326801004',
    false,
    'ICTU-CNTT-04',
    'ThS.',
    'CNTT',
    date '2020-02-03',
    'C1-407',
    'Giảng viên phụ trách các học phần hạ tầng mạng và hỗ trợ phòng máy.',
    'Đại Từ, Thái Nguyên'
  ),
  (
    'hai.yen@ictu.edu.vn',
    'Vũ Hải Yến',
    'LECTURER',
    'ACTIVE',
    '0326801005',
    false,
    'ICTU-HTTTKT-01',
    'TS.',
    'HTTTKT',
    date '2015-09-01',
    'C1-501',
    'Phụ trách nhóm học phần hệ thống thông tin quản lý và phân tích thiết kế hệ thống.',
    'TP. Thái Nguyên, Thái Nguyên'
  ),
  (
    'thanh.tung@ictu.edu.vn',
    'Đỗ Thanh Tùng',
    'LECTURER',
    'ACTIVE',
    '0326801006',
    false,
    'ICTU-HTTTKT-02',
    'ThS.',
    'HTTTKT',
    date '2018-11-20',
    'C1-503',
    'Giảng dạy các học phần thương mại điện tử và marketing số.',
    'Phú Bình, Thái Nguyên'
  ),
  (
    'ngoc.lan@ictu.edu.vn',
    'Bùi Ngọc Lan',
    'LECTURER',
    'ACTIVE',
    '0326801007',
    false,
    'ICTU-HTTTKT-03',
    'ThS.',
    'HTTTKT',
    date '2021-01-11',
    'C1-505',
    'Giảng viên phụ trách trải nghiệm người học ngành thương mại điện tử.',
    'TP. Tuyên Quang, Tuyên Quang'
  ),
  (
    'trung.kien@ictu.edu.vn',
    'Phan Trung Kiên',
    'LECTURER',
    'ACTIVE',
    '0326801008',
    false,
    'ICTU-HTTTKT-04',
    'ThS.',
    'HTTTKT',
    date '2022-03-14',
    'C1-507',
    'Hỗ trợ giảng dạy học phần hệ thống thông tin kinh doanh và cố vấn học tập.',
    'Bắc Giang, Bắc Giang'
  );

insert into tmp_departments (code, name, description)
values
  ('CNTT', 'Khoa Công nghệ thông tin', 'Đơn vị đào tạo khối máy tính và công nghệ thông tin của ICTU.'),
  ('HTTTKT', 'Khoa Hệ thống thông tin kinh tế', 'Đơn vị đào tạo các ngành hệ thống thông tin quản lý và thương mại điện tử.');

insert into tmp_majors (code, name, department_code, degree_level)
values
  ('7480103', 'Kỹ thuật phần mềm', 'CNTT', 'UNDERGRADUATE'),
  ('7480104', 'Hệ thống thông tin', 'CNTT', 'UNDERGRADUATE'),
  ('7340405', 'Hệ thống thông tin quản lý', 'HTTTKT', 'UNDERGRADUATE'),
  ('7340122', 'Thương mại điện tử', 'HTTTKT', 'UNDERGRADUATE');

insert into tmp_classes (code, name, major_code, cohort_year)
values
  ('KTPM K23A', 'Lớp Kỹ thuật phần mềm K23A', '7480103', 2023),
  ('KTPM K23B', 'Lớp Kỹ thuật phần mềm K23B', '7480103', 2023),
  ('HTTT K23A', 'Lớp Hệ thống thông tin K23A', '7480104', 2023),
  ('HTTTQL K23A', 'Lớp Hệ thống thông tin quản lý K23A', '7340405', 2023),
  ('TMĐT K24A', 'Lớp Thương mại điện tử K24A', '7340122', 2024);

insert into tmp_semesters (
  code,
  name,
  academic_year,
  start_date,
  end_date,
  enrollment_start,
  enrollment_end,
  regrade_open_at,
  regrade_close_at,
  max_credits,
  is_current
)
values
  (
    '2025-2026-HK1',
    'Học kỳ 1 năm học 2025-2026',
    '2025-2026',
    date '2025-09-08',
    date '2026-01-11',
    timestamptz '2025-08-18 08:00:00+07',
    timestamptz '2025-09-05 23:59:59+07',
    timestamptz '2026-01-20 08:00:00+07',
    timestamptz '2026-01-27 17:00:00+07',
    21,
    false
  ),
  (
    '2025-2026-HK2',
    'Học kỳ 2 năm học 2025-2026',
    '2025-2026',
    date '2026-02-16',
    date '2026-06-21',
    timestamptz '2026-01-26 08:00:00+07',
    timestamptz '2026-04-20 23:59:59+07',
    timestamptz '2026-06-24 08:00:00+07',
    timestamptz '2026-07-05 17:00:00+07',
    21,
    true
  );

insert into tmp_rooms (code, name, building, capacity)
values
  ('A2-301', 'Phòng học A2-301', 'Nhà A2', 70),
  ('A2-305', 'Phòng học A2-305', 'Nhà A2', 70),
  ('C1-202', 'Phòng học C1-202', 'Nhà C1', 60),
  ('C1-402', 'Phòng học C1-402', 'Nhà C1', 60),
  ('LAB3-01', 'Phòng máy LAB3-01', 'Khu thực hành', 45),
  ('C2-205', 'Phòng học C2-205', 'Nhà C2', 55);

insert into tmp_courses (
  code,
  name,
  department_code,
  credit_hours,
  total_sessions,
  description
)
values
  ('INT2204', 'Lập trình hướng đối tượng', 'CNTT', 3, 30, 'Môn nền tảng về lập trình hướng đối tượng cho khối ngành CNTT.'),
  ('INT2306', 'Cấu trúc dữ liệu và giải thuật', 'CNTT', 3, 30, 'Trang bị kiến thức về cấu trúc dữ liệu, độ phức tạp và giải thuật cơ bản.'),
  ('INT2403', 'Cơ sở dữ liệu', 'CNTT', 3, 30, 'Thiết kế mô hình dữ liệu và thao tác dữ liệu quan hệ.'),
  ('INT2408', 'Mạng máy tính', 'CNTT', 3, 30, 'Kiến thức căn bản về kiến trúc mạng, TCP/IP và dịch vụ mạng.'),
  ('INT3305', 'Phát triển ứng dụng web', 'CNTT', 3, 30, 'Xây dựng ứng dụng web phục vụ nghiệp vụ doanh nghiệp và tổ chức.'),
  ('INT3308', 'Kiểm thử phần mềm', 'CNTT', 2, 24, 'Kỹ thuật kiểm thử chức năng và quản lý lỗi phần mềm.'),
  ('MIS2301', 'Hệ thống thông tin quản lý', 'HTTTKT', 3, 30, 'Kiến thức cơ bản về hệ thống thông tin trong doanh nghiệp và tổ chức.'),
  ('MIS3302', 'Phân tích và thiết kế hệ thống thông tin', 'HTTTKT', 3, 30, 'Phân tích yêu cầu và thiết kế giải pháp hệ thống thông tin.'),
  ('MIS3304', 'Hệ quản trị cơ sở dữ liệu', 'HTTTKT', 3, 30, 'Quản trị, tối ưu và bảo đảm an toàn cho hệ quản trị cơ sở dữ liệu.'),
  ('ECO3301', 'Thương mại điện tử', 'HTTTKT', 3, 30, 'Nghiệp vụ giao dịch điện tử, sàn thương mại điện tử và thanh toán số.'),
  ('ECO3303', 'Marketing số', 'HTTTKT', 2, 24, 'Kênh truyền thông số, đo lường hiệu quả và tối ưu chiến dịch.');

insert into tmp_course_prerequisites (course_code, prerequisite_code, minimum_score)
values
  ('INT2306', 'INT2204', 5.00),
  ('INT2403', 'INT2204', 5.00),
  ('INT3305', 'INT2403', 5.00),
  ('INT3308', 'INT2204', 5.00),
  ('MIS3302', 'MIS2301', 5.00),
  ('MIS3304', 'INT2403', 5.00),
  ('ECO3301', 'MIS2301', 5.00);

insert into tmp_seed_users (
  email,
  full_name,
  role_code,
  profile_status,
  phone,
  student_code,
  class_code,
  enrollment_year,
  current_status,
  gender,
  date_of_birth,
  address,
  emergency_contact
)
values
  ('dtc237480103001@st.ictu.edu.vn', 'Nguyễn Hải Đăng', 'STUDENT', 'ACTIVE', '0326802001', 'DTC237480103001', 'KTPM K23A', 2023, 'ACTIVE', 'MALE', date '2005-02-14', 'TP. Thái Nguyên, Thái Nguyên', '0368903001'),
  ('dtc237480103002@st.ictu.edu.vn', 'Trần Thu Hà', 'STUDENT', 'ACTIVE', '0326802002', 'DTC237480103002', 'KTPM K23A', 2023, 'ACTIVE', 'FEMALE', date '2005-05-22', 'Phổ Yên, Thái Nguyên', '0368903002'),
  ('dtc237480103003@st.ictu.edu.vn', 'Lê Minh Quân', 'STUDENT', 'ACTIVE', '0326802003', 'DTC237480103003', 'KTPM K23A', 2023, 'ACTIVE', 'MALE', date '2005-01-30', 'Sông Công, Thái Nguyên', '0368903003'),
  ('dtc237480103004@st.ictu.edu.vn', 'Phạm Khánh Linh', 'STUDENT', 'ACTIVE', '0326802004', 'DTC237480103004', 'KTPM K23A', 2023, 'ACTIVE', 'FEMALE', date '2005-09-11', 'Đại Từ, Thái Nguyên', '0368903004'),
  ('dtc237480103005@st.ictu.edu.vn', 'Bùi Đức Anh', 'STUDENT', 'ACTIVE', '0326802005', 'DTC237480103005', 'KTPM K23A', 2023, 'ACTIVE', 'MALE', date '2005-07-03', 'Phú Bình, Thái Nguyên', '0368903005'),
  ('dtc237480103006@st.ictu.edu.vn', 'Hoàng Ngọc Mai', 'STUDENT', 'ACTIVE', '0326802006', 'DTC237480103006', 'KTPM K23B', 2023, 'ACTIVE', 'FEMALE', date '2005-03-18', 'Phú Lương, Thái Nguyên', '0368903006'),
  ('dtc237480103007@st.ictu.edu.vn', 'Vũ Quang Huy', 'STUDENT', 'ACTIVE', '0326802007', 'DTC237480103007', 'KTPM K23B', 2023, 'ACTIVE', 'MALE', date '2005-08-09', 'Đồng Hỷ, Thái Nguyên', '0368903007'),
  ('dtc237480103008@st.ictu.edu.vn', 'Đặng Thùy Dương', 'STUDENT', 'ACTIVE', '0326802008', 'DTC237480103008', 'KTPM K23B', 2023, 'ACTIVE', 'FEMALE', date '2005-10-27', 'Võ Nhai, Thái Nguyên', '0368903008'),
  ('dtc237480103009@st.ictu.edu.vn', 'Đỗ Gia Bảo', 'STUDENT', 'ACTIVE', '0326802009', 'DTC237480103009', 'KTPM K23B', 2023, 'ACTIVE', 'MALE', date '2005-12-01', 'Bắc Giang, Bắc Giang', '0368903009'),
  ('dtc237480103010@st.ictu.edu.vn', 'Phan Minh Châu', 'STUDENT', 'ACTIVE', '0326802010', 'DTC237480103010', 'KTPM K23B', 2023, 'ACTIVE', 'FEMALE', date '2005-04-16', 'Tuyên Quang, Tuyên Quang', '0368903010');

insert into tmp_seed_users (
  email,
  full_name,
  role_code,
  profile_status,
  phone,
  student_code,
  class_code,
  enrollment_year,
  current_status,
  gender,
  date_of_birth,
  address,
  emergency_contact
)
values
  ('dtc237480104001@st.ictu.edu.vn', 'Nguyễn Đức Mạnh', 'STUDENT', 'ACTIVE', '0326802011', 'DTC237480104001', 'HTTT K23A', 2023, 'ACTIVE', 'MALE', date '2005-03-07', 'Vĩnh Yên, Vĩnh Phúc', '0368903011'),
  ('dtc237480104002@st.ictu.edu.vn', 'Trịnh Thu Trang', 'STUDENT', 'ACTIVE', '0326802012', 'DTC237480104002', 'HTTT K23A', 2023, 'ACTIVE', 'FEMALE', date '2005-06-19', 'Yên Dũng, Bắc Giang', '0368903012'),
  ('dtc237480104003@st.ictu.edu.vn', 'Hà Quốc Khánh', 'STUDENT', 'ACTIVE', '0326802013', 'DTC237480104003', 'HTTT K23A', 2023, 'ACTIVE', 'MALE', date '2005-11-02', 'TP. Bắc Kạn, Bắc Kạn', '0368903013'),
  ('dtc237480104004@st.ictu.edu.vn', 'Lương Bảo Ngân', 'STUDENT', 'ACTIVE', '0326802014', 'DTC237480104004', 'HTTT K23A', 2023, 'ACTIVE', 'FEMALE', date '2005-01-25', 'Việt Trì, Phú Thọ', '0368903014'),
  ('dtc237480104005@st.ictu.edu.vn', 'Cao Minh Nhật', 'STUDENT', 'ACTIVE', '0326802015', 'DTC237480104005', 'HTTT K23A', 2023, 'ACTIVE', 'MALE', date '2005-09-28', 'Lạng Giang, Bắc Giang', '0368903015');

insert into tmp_seed_users (
  email,
  full_name,
  role_code,
  profile_status,
  phone,
  student_code,
  class_code,
  enrollment_year,
  current_status,
  gender,
  date_of_birth,
  address,
  emergency_contact
)
values
  ('dtc237340405001@st.ictu.edu.vn', 'Nguyễn Phương Anh', 'STUDENT', 'ACTIVE', '0326802016', 'DTC237340405001', 'HTTTQL K23A', 2023, 'ACTIVE', 'FEMALE', date '2005-02-10', 'TP. Thái Nguyên, Thái Nguyên', '0368903016'),
  ('dtc237340405002@st.ictu.edu.vn', 'Lại Quốc Trung', 'STUDENT', 'ACTIVE', '0326802017', 'DTC237340405002', 'HTTTQL K23A', 2023, 'ACTIVE', 'MALE', date '2005-07-14', 'Phú Bình, Thái Nguyên', '0368903017'),
  ('dtc237340405003@st.ictu.edu.vn', 'Hồ Thu Uyên', 'STUDENT', 'ACTIVE', '0326802018', 'DTC237340405003', 'HTTTQL K23A', 2023, 'ACTIVE', 'FEMALE', date '2005-10-05', 'Sông Công, Thái Nguyên', '0368903018'),
  ('dtc237340405004@st.ictu.edu.vn', 'Phạm Thành Nam', 'STUDENT', 'ACTIVE', '0326802019', 'DTC237340405004', 'HTTTQL K23A', 2023, 'ACTIVE', 'MALE', date '2005-12-12', 'Yên Thế, Bắc Giang', '0368903019'),
  ('dtc237340405005@st.ictu.edu.vn', 'Dương Hải Yến', 'STUDENT', 'ACTIVE', '0326802020', 'DTC237340405005', 'HTTTQL K23A', 2023, 'SUSPENDED', 'FEMALE', date '2005-04-03', 'Tam Đảo, Vĩnh Phúc', '0368903020'),
  ('dtc247340122001@st.ictu.edu.vn', 'Võ Minh Khang', 'STUDENT', 'ACTIVE', '0326802021', 'DTC247340122001', 'TMĐT K24A', 2024, 'ACTIVE', 'MALE', date '2006-02-21', 'TP. Tuyên Quang, Tuyên Quang', '0368903021'),
  ('dtc247340122002@st.ictu.edu.vn', 'Quách Thanh Huyền', 'STUDENT', 'ACTIVE', '0326802022', 'DTC247340122002', 'TMĐT K24A', 2024, 'ACTIVE', 'FEMALE', date '2006-05-09', 'TP. Thái Nguyên, Thái Nguyên', '0368903022'),
  ('dtc247340122003@st.ictu.edu.vn', 'Đinh Tuấn Kiệt', 'STUDENT', 'ACTIVE', '0326802023', 'DTC247340122003', 'TMĐT K24A', 2024, 'ACTIVE', 'MALE', date '2006-07-27', 'Hiệp Hòa, Bắc Giang', '0368903023'),
  ('dtc247340122004@st.ictu.edu.vn', 'Mai Ngọc Anh', 'STUDENT', 'ACTIVE', '0326802024', 'DTC247340122004', 'TMĐT K24A', 2024, 'ACTIVE', 'FEMALE', date '2006-10-14', 'Phổ Yên, Thái Nguyên', '0368903024'),
  ('dtc247340122005@st.ictu.edu.vn', 'Tạ Đức Long', 'STUDENT', 'LOCKED', '0326802025', 'DTC247340122005', 'TMĐT K24A', 2024, 'DROPPED', 'MALE', date '2006-12-03', 'Na Rì, Bắc Kạn', '0368903025');

insert into tmp_offerings (
  offering_key,
  course_code,
  semester_code,
  section_code,
  title,
  max_capacity,
  registration_open_at,
  registration_close_at,
  attendance_weight,
  midterm_weight,
  final_weight,
  passing_score,
  status,
  notes
)
values
  ('OOP-HK1-01', 'INT2204', '2025-2026-HK1', '01', 'Lập trình hướng đối tượng - Nhóm 01', 60, timestamptz '2025-08-18 08:00:00+07', timestamptz '2025-09-05 23:59:59+07', 10, 30, 60, 5, 'FINISHED', 'Học phần nền tảng cho sinh viên khối CNTT khóa 23.'),
  ('MIS-HK1-01', 'MIS2301', '2025-2026-HK1', '01', 'Hệ thống thông tin quản lý - Nhóm 01', 55, timestamptz '2025-08-18 08:00:00+07', timestamptz '2025-09-05 23:59:59+07', 10, 30, 60, 5, 'FINISHED', 'Học phần nền tảng cho khối HTTTQL và TMĐT.'),
  ('DB-HK1-01', 'INT2403', '2025-2026-HK1', '01', 'Cơ sở dữ liệu - Nhóm 01', 45, timestamptz '2025-08-18 08:00:00+07', timestamptz '2025-09-05 23:59:59+07', 10, 30, 60, 5, 'FINISHED', 'Lớp học phần đã hoàn tất, dùng cho kiểm thử bảng điểm và điều kiện tiên quyết.'),
  ('DS-HK2-01', 'INT2306', '2025-2026-HK2', '01', 'Cấu trúc dữ liệu và giải thuật - Nhóm 01', 10, timestamptz '2026-01-26 08:00:00+07', timestamptz '2026-04-20 23:59:59+07', 10, 30, 60, 5, 'OPEN', 'Lớp học phần chính cho sinh viên KTPM và HTTT khóa 23.'),
  ('DB-HK2-02', 'INT2403', '2025-2026-HK2', '02', 'Cơ sở dữ liệu - Nhóm 02', 6, timestamptz '2026-01-26 08:00:00+07', timestamptz '2026-04-20 23:59:59+07', 10, 30, 60, 5, 'OPEN', 'Mở cho sinh viên chưa hoàn thành học phần ở học kỳ trước.'),
  ('WEB-HK2-01', 'INT3305', '2025-2026-HK2', '01', 'Phát triển ứng dụng web - Nhóm 01', 4, timestamptz '2026-01-26 08:00:00+07', timestamptz '2026-04-20 23:59:59+07', 10, 30, 60, 5, 'OPEN', 'Lớp học phần thực hành web cho sinh viên đã qua Cơ sở dữ liệu.'),
  ('TEST-HK2-01', 'INT3308', '2025-2026-HK2', '01', 'Kiểm thử phần mềm - Nhóm 01', 6, timestamptz '2026-01-26 08:00:00+07', timestamptz '2026-04-20 23:59:59+07', 10, 30, 60, 5, 'OPEN', 'Phục vụ luồng phân công giảng dạy và nhập điểm ở khoa CNTT.'),
  ('SAD-HK2-01', 'MIS3302', '2025-2026-HK2', '01', 'Phân tích và thiết kế hệ thống thông tin - Nhóm 01', 8, timestamptz '2026-01-26 08:00:00+07', timestamptz '2026-04-20 23:59:59+07', 10, 30, 60, 5, 'OPEN', 'Học phần trọng tâm của ngành Hệ thống thông tin quản lý.'),
  ('DBMS-HK2-01', 'MIS3304', '2025-2026-HK2', '01', 'Hệ quản trị cơ sở dữ liệu - Nhóm 01', 6, timestamptz '2026-01-26 08:00:00+07', timestamptz '2026-04-20 23:59:59+07', 10, 30, 60, 5, 'OPEN', 'Dùng để kiểm thử điều kiện tiên quyết và kiểm tra trùng lịch.'),
  ('ECOM-HK2-01', 'ECO3301', '2025-2026-HK2', '01', 'Thương mại điện tử - Nhóm 01', 10, timestamptz '2026-01-26 08:00:00+07', timestamptz '2026-04-20 23:59:59+07', 10, 30, 60, 5, 'OPEN', 'Lớp học phần ngành TMĐT và HTTTQL.'),
  ('DMKT-HK2-01', 'ECO3303', '2025-2026-HK2', '01', 'Marketing số - Nhóm 01', 8, timestamptz '2026-01-26 08:00:00+07', timestamptz '2026-03-10 17:00:00+07', 10, 30, 60, 5, 'CLOSED', 'Đã khép đợt đăng ký để kiểm thử bộ lọc trạng thái học phần mở.');

insert into tmp_teaching_assignments (offering_key, lecturer_email, assignment_role, is_primary)
values
  ('OOP-HK1-01', 'pham.hung@ictu.edu.vn', 'PRIMARY', true),
  ('MIS-HK1-01', 'hai.yen@ictu.edu.vn', 'PRIMARY', true),
  ('DB-HK1-01', 'minh.ha@ictu.edu.vn', 'PRIMARY', true),
  ('DS-HK2-01', 'pham.hung@ictu.edu.vn', 'PRIMARY', true),
  ('DB-HK2-02', 'minh.ha@ictu.edu.vn', 'PRIMARY', true),
  ('WEB-HK2-01', 'minh.ha@ictu.edu.vn', 'PRIMARY', true),
  ('TEST-HK2-01', 'thu.phuong@ictu.edu.vn', 'PRIMARY', true),
  ('SAD-HK2-01', 'hai.yen@ictu.edu.vn', 'PRIMARY', true),
  ('DBMS-HK2-01', 'minh.ha@ictu.edu.vn', 'PRIMARY', true),
  ('ECOM-HK2-01', 'thanh.tung@ictu.edu.vn', 'PRIMARY', true),
  ('ECOM-HK2-01', 'ngoc.lan@ictu.edu.vn', 'ASSISTANT', false),
  ('DMKT-HK2-01', 'ngoc.lan@ictu.edu.vn', 'PRIMARY', true);

insert into tmp_schedules (
  offering_key,
  room_code,
  day_of_week,
  start_time,
  end_time,
  week_pattern,
  start_date,
  end_date,
  note
)
values
  ('OOP-HK1-01', 'A2-301', 1, time '07:30', time '10:00', 'ALL', date '2025-09-08', date '2026-01-11', 'Ca sáng thứ Hai tại giảng đường A2.'),
  ('MIS-HK1-01', 'C1-202', 4, time '13:30', time '16:00', 'ALL', date '2025-09-11', date '2026-01-08', 'Buổi chiều thứ Năm cho khối HTTTKT.'),
  ('DB-HK1-01', 'LAB3-01', 2, time '07:30', time '10:00', 'ALL', date '2025-09-09', date '2026-01-06', 'Thực hành tại phòng máy LAB3-01.'),
  ('DS-HK2-01', 'A2-301', 1, time '07:30', time '10:00', 'ALL', date '2026-02-16', date '2026-06-15', 'Ca sáng thứ Hai cho lớp dữ liệu và giải thuật.'),
  ('DB-HK2-02', 'LAB3-01', 2, time '07:30', time '10:00', 'ALL', date '2026-02-17', date '2026-06-16', 'Phòng máy dùng cho học phần cơ sở dữ liệu.'),
  ('WEB-HK2-01', 'LAB3-01', 2, time '13:30', time '16:00', 'ALL', date '2026-02-17', date '2026-06-16', 'Ca chiều thực hành web.'),
  ('TEST-HK2-01', 'A2-305', 6, time '07:30', time '09:50', 'ALL', date '2026-02-21', date '2026-06-20', 'Ca sáng thứ Sáu.'),
  ('SAD-HK2-01', 'C1-202', 3, time '13:30', time '16:00', 'ALL', date '2026-02-18', date '2026-06-17', 'Thứ Tư chiều dành cho HTTTQL.'),
  ('DBMS-HK2-01', 'C1-402', 2, time '07:30', time '10:00', 'ALL', date '2026-02-17', date '2026-06-16', 'Trùng khung giờ với Cơ sở dữ liệu để kiểm thử cảnh báo xung đột lịch.'),
  ('ECOM-HK2-01', 'C1-402', 4, time '07:30', time '10:00', 'ALL', date '2026-02-19', date '2026-06-18', 'Ca sáng thứ Năm cho TMĐT.'),
  ('DMKT-HK2-01', 'C2-205', 4, time '10:15', time '12:35', 'ALL', date '2026-02-19', date '2026-06-18', 'Học phần marketing số đã đóng đăng ký.');

insert into tmp_enrollments (
  enrollment_key,
  student_code,
  offering_key,
  status,
  enrolled_at,
  dropped_at,
  drop_reason,
  approved_by_email
)
values
  ('e_oop_001', 'DTC237480103001', 'OOP-HK1-01', 'COMPLETED', timestamptz '2025-08-22 08:00:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_oop_002', 'DTC237480103002', 'OOP-HK1-01', 'COMPLETED', timestamptz '2025-08-22 08:02:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_oop_003', 'DTC237480103003', 'OOP-HK1-01', 'COMPLETED', timestamptz '2025-08-22 08:04:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_oop_004', 'DTC237480103004', 'OOP-HK1-01', 'COMPLETED', timestamptz '2025-08-22 08:06:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_oop_005', 'DTC237480103005', 'OOP-HK1-01', 'COMPLETED', timestamptz '2025-08-22 08:08:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_oop_006', 'DTC237480103006', 'OOP-HK1-01', 'COMPLETED', timestamptz '2025-08-22 08:10:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_oop_007', 'DTC237480103007', 'OOP-HK1-01', 'COMPLETED', timestamptz '2025-08-22 08:12:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_oop_008', 'DTC237480103008', 'OOP-HK1-01', 'COMPLETED', timestamptz '2025-08-22 08:14:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_oop_009', 'DTC237480103009', 'OOP-HK1-01', 'COMPLETED', timestamptz '2025-08-22 08:16:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_oop_010', 'DTC237480103010', 'OOP-HK1-01', 'COMPLETED', timestamptz '2025-08-22 08:18:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_oop_011', 'DTC237480104001', 'OOP-HK1-01', 'COMPLETED', timestamptz '2025-08-22 08:20:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_oop_012', 'DTC237480104002', 'OOP-HK1-01', 'COMPLETED', timestamptz '2025-08-22 08:22:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_oop_013', 'DTC237480104003', 'OOP-HK1-01', 'COMPLETED', timestamptz '2025-08-22 08:24:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_oop_014', 'DTC237480104004', 'OOP-HK1-01', 'COMPLETED', timestamptz '2025-08-22 08:26:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_oop_015', 'DTC237480104005', 'OOP-HK1-01', 'COMPLETED', timestamptz '2025-08-22 08:28:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_mis_016', 'DTC237340405001', 'MIS-HK1-01', 'COMPLETED', timestamptz '2025-08-23 09:00:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_mis_017', 'DTC237340405002', 'MIS-HK1-01', 'COMPLETED', timestamptz '2025-08-23 09:02:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_mis_018', 'DTC237340405003', 'MIS-HK1-01', 'COMPLETED', timestamptz '2025-08-23 09:04:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_mis_019', 'DTC237340405004', 'MIS-HK1-01', 'COMPLETED', timestamptz '2025-08-23 09:06:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_mis_020', 'DTC237340405005', 'MIS-HK1-01', 'COMPLETED', timestamptz '2025-08-23 09:08:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_mis_021', 'DTC247340122001', 'MIS-HK1-01', 'COMPLETED', timestamptz '2025-08-23 09:10:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_mis_022', 'DTC247340122002', 'MIS-HK1-01', 'COMPLETED', timestamptz '2025-08-23 09:12:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_mis_023', 'DTC247340122003', 'MIS-HK1-01', 'COMPLETED', timestamptz '2025-08-23 09:14:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_mis_024', 'DTC247340122004', 'MIS-HK1-01', 'COMPLETED', timestamptz '2025-08-23 09:16:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_dbh_001', 'DTC237480103001', 'DB-HK1-01', 'COMPLETED', timestamptz '2025-08-24 08:00:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_dbh_002', 'DTC237480103002', 'DB-HK1-01', 'COMPLETED', timestamptz '2025-08-24 08:02:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_dbh_003', 'DTC237480103003', 'DB-HK1-01', 'COMPLETED', timestamptz '2025-08-24 08:04:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_dbh_004', 'DTC237480103004', 'DB-HK1-01', 'COMPLETED', timestamptz '2025-08-24 08:06:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_dbh_016', 'DTC237340405001', 'DB-HK1-01', 'COMPLETED', timestamptz '2025-08-24 08:08:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_dbh_018', 'DTC237340405003', 'DB-HK1-01', 'COMPLETED', timestamptz '2025-08-24 08:10:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_dbh_019', 'DTC237340405004', 'DB-HK1-01', 'COMPLETED', timestamptz '2025-08-24 08:12:00+07', null, null, 'daotao.admin@ictu.edu.vn'),
  ('e_ds_001', 'DTC237480103001', 'DS-HK2-01', 'ENROLLED', timestamptz '2026-02-03 08:00:00+07', null, null, null),
  ('e_ds_002', 'DTC237480103002', 'DS-HK2-01', 'ENROLLED', timestamptz '2026-02-03 08:03:00+07', null, null, null),
  ('e_ds_003', 'DTC237480103003', 'DS-HK2-01', 'ENROLLED', timestamptz '2026-02-03 08:06:00+07', null, null, null),
  ('e_ds_004', 'DTC237480103004', 'DS-HK2-01', 'ENROLLED', timestamptz '2026-02-03 08:09:00+07', null, null, null),
  ('e_ds_005', 'DTC237480103005', 'DS-HK2-01', 'ENROLLED', timestamptz '2026-02-03 08:12:00+07', null, null, null),
  ('e_ds_006', 'DTC237480103006', 'DS-HK2-01', 'ENROLLED', timestamptz '2026-02-03 08:15:00+07', null, null, null),
  ('e_ds_007', 'DTC237480103007', 'DS-HK2-01', 'ENROLLED', timestamptz '2026-02-03 08:18:00+07', null, null, null),
  ('e_ds_011', 'DTC237480104001', 'DS-HK2-01', 'ENROLLED', timestamptz '2026-02-03 08:21:00+07', null, null, null),
  ('e_ds_012', 'DTC237480104002', 'DS-HK2-01', 'ENROLLED', timestamptz '2026-02-03 08:24:00+07', null, null, null),
  ('e_dbc_013', 'DTC237480104003', 'DB-HK2-02', 'ENROLLED', timestamptz '2026-02-03 09:00:00+07', null, null, null),
  ('e_dbc_015', 'DTC237480104005', 'DB-HK2-02', 'ENROLLED', timestamptz '2026-02-03 09:03:00+07', null, null, null),
  ('e_dbc_017', 'DTC237340405002', 'DB-HK2-02', 'ENROLLED', timestamptz '2026-02-03 09:06:00+07', null, null, null),
  ('e_dbc_012_drop', 'DTC237480104002', 'DB-HK2-02', 'DROPPED', timestamptz '2026-02-03 09:09:00+07', timestamptz '2026-02-18 10:15:00+07', 'Điều chỉnh kế hoạch học tập sau tuần sinh hoạt công dân.', null),
  ('e_web_001', 'DTC237480103001', 'WEB-HK2-01', 'ENROLLED', timestamptz '2026-02-03 10:00:00+07', null, null, null),
  ('e_web_002', 'DTC237480103002', 'WEB-HK2-01', 'ENROLLED', timestamptz '2026-02-03 10:03:00+07', null, null, null),
  ('e_web_003', 'DTC237480103003', 'WEB-HK2-01', 'ENROLLED', timestamptz '2026-02-03 10:06:00+07', null, null, null),
  ('e_web_004', 'DTC237480103004', 'WEB-HK2-01', 'ENROLLED', timestamptz '2026-02-03 10:09:00+07', null, null, null),
  ('e_test_001', 'DTC237480103001', 'TEST-HK2-01', 'ENROLLED', timestamptz '2026-02-03 10:30:00+07', null, null, null),
  ('e_test_003', 'DTC237480103003', 'TEST-HK2-01', 'ENROLLED', timestamptz '2026-02-03 10:33:00+07', null, null, null),
  ('e_test_005', 'DTC237480103005', 'TEST-HK2-01', 'ENROLLED', timestamptz '2026-02-03 10:36:00+07', null, null, null),
  ('e_sad_016', 'DTC237340405001', 'SAD-HK2-01', 'ENROLLED', timestamptz '2026-02-04 08:00:00+07', null, null, null),
  ('e_sad_017', 'DTC237340405002', 'SAD-HK2-01', 'ENROLLED', timestamptz '2026-02-04 08:03:00+07', null, null, null),
  ('e_sad_018', 'DTC237340405003', 'SAD-HK2-01', 'ENROLLED', timestamptz '2026-02-04 08:06:00+07', null, null, null),
  ('e_sad_019', 'DTC237340405004', 'SAD-HK2-01', 'ENROLLED', timestamptz '2026-02-04 08:09:00+07', null, null, null),
  ('e_dbms_016', 'DTC237340405001', 'DBMS-HK2-01', 'ENROLLED', timestamptz '2026-02-04 09:00:00+07', null, null, null),
  ('e_dbms_018', 'DTC237340405003', 'DBMS-HK2-01', 'ENROLLED', timestamptz '2026-02-04 09:03:00+07', null, null, null),
  ('e_dbms_019', 'DTC237340405004', 'DBMS-HK2-01', 'ENROLLED', timestamptz '2026-02-04 09:06:00+07', null, null, null),
  ('e_ec_016', 'DTC237340405001', 'ECOM-HK2-01', 'ENROLLED', timestamptz '2026-02-04 10:00:00+07', null, null, null),
  ('e_ec_017', 'DTC237340405002', 'ECOM-HK2-01', 'ENROLLED', timestamptz '2026-02-04 10:03:00+07', null, null, null),
  ('e_ec_021', 'DTC247340122001', 'ECOM-HK2-01', 'ENROLLED', timestamptz '2026-02-04 10:06:00+07', null, null, null),
  ('e_ec_022', 'DTC247340122002', 'ECOM-HK2-01', 'ENROLLED', timestamptz '2026-02-04 10:09:00+07', null, null, null),
  ('e_ec_023', 'DTC247340122003', 'ECOM-HK2-01', 'ENROLLED', timestamptz '2026-02-04 10:12:00+07', null, null, null);

insert into tmp_grades (
  grade_key,
  enrollment_key,
  attendance_score,
  midterm_score,
  final_score,
  status,
  remark,
  submitted_at,
  submitted_by_email,
  approved_at,
  approved_by_email,
  locked_at,
  locked_by_email
)
values
  ('g_oop_001', 'e_oop_001', 9.00, 8.50, 8.80, 'LOCKED', 'Kết quả ổn định, dùng làm mẫu sinh viên học tốt.', timestamptz '2026-01-06 10:00:00+07', 'pham.hung@ictu.edu.vn', timestamptz '2026-01-09 09:00:00+07', 'daotao.admin@ictu.edu.vn', timestamptz '2026-01-12 08:30:00+07', 'daotao.admin@ictu.edu.vn'),
  ('g_oop_002', 'e_oop_002', 8.80, 8.00, 8.20, 'LOCKED', 'Điểm nền tảng tốt, đủ điều kiện học tiếp các học phần chuyên sâu.', timestamptz '2026-01-06 10:03:00+07', 'pham.hung@ictu.edu.vn', timestamptz '2026-01-09 09:03:00+07', 'daotao.admin@ictu.edu.vn', timestamptz '2026-01-12 08:33:00+07', 'daotao.admin@ictu.edu.vn'),
  ('g_oop_003', 'e_oop_003', 8.00, 7.50, 7.60, 'APPROVED', 'Mức điểm khá, minh họa nhóm sinh viên học lực ổn định.', timestamptz '2026-01-06 10:06:00+07', 'pham.hung@ictu.edu.vn', timestamptz '2026-01-09 09:06:00+07', 'daotao.admin@ictu.edu.vn', null, null),
  ('g_oop_004', 'e_oop_004', 8.20, 7.20, 7.00, 'APPROVED', 'Sinh viên đạt chuẩn đầu ra học phần.', timestamptz '2026-01-06 10:09:00+07', 'pham.hung@ictu.edu.vn', timestamptz '2026-01-09 09:09:00+07', 'daotao.admin@ictu.edu.vn', null, null),
  ('g_oop_005', 'e_oop_005', 6.00, 4.50, 4.00, 'LOCKED', 'Điểm thấp, dùng cho dashboard cảnh báo học vụ và luồng phúc khảo.', timestamptz '2026-01-06 10:12:00+07', 'pham.hung@ictu.edu.vn', timestamptz '2026-01-09 09:12:00+07', 'daotao.admin@ictu.edu.vn', timestamptz '2026-01-12 08:36:00+07', 'daotao.admin@ictu.edu.vn'),
  ('g_oop_006', 'e_oop_006', 7.50, 6.80, 6.50, 'APPROVED', 'Nhóm điểm trung bình khá.', timestamptz '2026-01-06 10:15:00+07', 'pham.hung@ictu.edu.vn', timestamptz '2026-01-09 09:15:00+07', 'daotao.admin@ictu.edu.vn', null, null),
  ('g_oop_007', 'e_oop_007', 7.20, 6.50, 6.00, 'APPROVED', 'Minh họa sinh viên đạt vừa phải nhưng ổn định.', timestamptz '2026-01-06 10:18:00+07', 'pham.hung@ictu.edu.vn', timestamptz '2026-01-09 09:18:00+07', 'daotao.admin@ictu.edu.vn', null, null),
  ('g_oop_008', 'e_oop_008', 8.40, 7.80, 7.50, 'LOCKED', 'Điểm đã khóa phục vụ test báo cáo theo lớp.', timestamptz '2026-01-06 10:21:00+07', 'pham.hung@ictu.edu.vn', timestamptz '2026-01-09 09:21:00+07', 'daotao.admin@ictu.edu.vn', timestamptz '2026-01-12 08:39:00+07', 'daotao.admin@ictu.edu.vn'),
  ('g_oop_009', 'e_oop_009', 7.00, 6.00, 5.80, 'APPROVED', 'Điểm đủ qua môn, phù hợp nhóm sinh viên trung bình.', timestamptz '2026-01-06 10:24:00+07', 'pham.hung@ictu.edu.vn', timestamptz '2026-01-09 09:24:00+07', 'daotao.admin@ictu.edu.vn', null, null),
  ('g_oop_010', 'e_oop_010', 7.80, 6.90, 6.30, 'APPROVED', 'Điểm khá thấp nhưng không thuộc diện cảnh báo.', timestamptz '2026-01-06 10:27:00+07', 'pham.hung@ictu.edu.vn', timestamptz '2026-01-09 09:27:00+07', 'daotao.admin@ictu.edu.vn', null, null),
  ('g_oop_011', 'e_oop_011', 8.50, 7.80, 7.90, 'LOCKED', 'Sinh viên HTTT có nền tảng lập trình tốt.', timestamptz '2026-01-06 10:30:00+07', 'pham.hung@ictu.edu.vn', timestamptz '2026-01-09 09:30:00+07', 'daotao.admin@ictu.edu.vn', timestamptz '2026-01-12 08:42:00+07', 'daotao.admin@ictu.edu.vn'),
  ('g_oop_012', 'e_oop_012', 8.00, 7.20, 7.30, 'APPROVED', 'Phục vụ điều kiện tiên quyết cho Cấu trúc dữ liệu.', timestamptz '2026-01-06 10:33:00+07', 'pham.hung@ictu.edu.vn', timestamptz '2026-01-09 09:33:00+07', 'daotao.admin@ictu.edu.vn', null, null),
  ('g_oop_013', 'e_oop_013', 7.80, 7.00, 6.80, 'APPROVED', 'Điểm đủ điều kiện học Cơ sở dữ liệu học kỳ sau.', timestamptz '2026-01-06 10:36:00+07', 'pham.hung@ictu.edu.vn', timestamptz '2026-01-09 09:36:00+07', 'daotao.admin@ictu.edu.vn', null, null),
  ('g_oop_014', 'e_oop_014', 5.50, 4.00, 4.00, 'LOCKED', 'Điểm thấp kéo GPA xuống vùng cảnh báo học vụ.', timestamptz '2026-01-06 10:39:00+07', 'pham.hung@ictu.edu.vn', timestamptz '2026-01-09 09:39:00+07', 'daotao.admin@ictu.edu.vn', timestamptz '2026-01-12 08:45:00+07', 'daotao.admin@ictu.edu.vn'),
  ('g_oop_015', 'e_oop_015', 7.20, 6.00, 5.80, 'APPROVED', 'Mức điểm đủ qua môn cho sinh viên HTTT.', timestamptz '2026-01-06 10:42:00+07', 'pham.hung@ictu.edu.vn', timestamptz '2026-01-09 09:42:00+07', 'daotao.admin@ictu.edu.vn', null, null),
  ('g_mis_016', 'e_mis_016', 8.80, 8.00, 8.20, 'LOCKED', 'Điểm tốt, đủ điều kiện học Phân tích và thiết kế HTTT.', timestamptz '2026-01-06 14:00:00+07', 'hai.yen@ictu.edu.vn', timestamptz '2026-01-09 13:00:00+07', 'daotao.admin@ictu.edu.vn', timestamptz '2026-01-12 09:00:00+07', 'daotao.admin@ictu.edu.vn'),
  ('g_mis_017', 'e_mis_017', 8.00, 7.50, 7.00, 'APPROVED', 'Điểm đã duyệt, đang có yêu cầu phúc khảo phần giữa kỳ.', timestamptz '2026-01-06 14:03:00+07', 'hai.yen@ictu.edu.vn', timestamptz '2026-01-09 13:03:00+07', 'daotao.admin@ictu.edu.vn', null, null),
  ('g_mis_018', 'e_mis_018', 8.40, 7.60, 7.80, 'LOCKED', 'Điểm đã khóa cho sinh viên HTTTQL.', timestamptz '2026-01-06 14:06:00+07', 'hai.yen@ictu.edu.vn', timestamptz '2026-01-09 13:06:00+07', 'daotao.admin@ictu.edu.vn', timestamptz '2026-01-12 09:03:00+07', 'daotao.admin@ictu.edu.vn'),
  ('g_mis_019', 'e_mis_019', 7.60, 7.00, 6.80, 'APPROVED', 'Mức điểm ổn, dùng để tính trung bình lớp.', timestamptz '2026-01-06 14:09:00+07', 'hai.yen@ictu.edu.vn', timestamptz '2026-01-09 13:09:00+07', 'daotao.admin@ictu.edu.vn', null, null),
  ('g_mis_020', 'e_mis_020', 5.80, 4.00, 3.50, 'LOCKED', 'Điểm rất thấp, dùng cho hồ sơ cảnh báo và sinh viên bị tạm dừng học.', timestamptz '2026-01-06 14:12:00+07', 'hai.yen@ictu.edu.vn', timestamptz '2026-01-09 13:12:00+07', 'daotao.admin@ictu.edu.vn', timestamptz '2026-01-12 09:06:00+07', 'daotao.admin@ictu.edu.vn'),
  ('g_mis_021', 'e_mis_021', 8.00, 7.00, 6.50, 'LOCKED', 'Đã khóa, có yêu cầu phúc khảo sau công bố điểm.', timestamptz '2026-01-06 14:15:00+07', 'hai.yen@ictu.edu.vn', timestamptz '2026-01-09 13:15:00+07', 'daotao.admin@ictu.edu.vn', timestamptz '2026-01-12 09:09:00+07', 'daotao.admin@ictu.edu.vn'),
  ('g_mis_022', 'e_mis_022', 8.50, 7.80, 7.50, 'APPROVED', 'Sinh viên TMĐT có kết quả khá tốt.', timestamptz '2026-01-06 14:18:00+07', 'hai.yen@ictu.edu.vn', timestamptz '2026-01-09 13:18:00+07', 'daotao.admin@ictu.edu.vn', null, null),
  ('g_mis_023', 'e_mis_023', 7.80, 7.00, 7.20, 'APPROVED', 'Điểm phục vụ điều kiện tiên quyết môn Thương mại điện tử.', timestamptz '2026-01-06 14:21:00+07', 'hai.yen@ictu.edu.vn', timestamptz '2026-01-09 13:21:00+07', 'daotao.admin@ictu.edu.vn', null, null),
  ('g_mis_024', 'e_mis_024', 6.00, 4.50, 4.00, 'LOCKED', 'Điểm thấp nhưng vẫn còn hồ sơ sinh viên đang học.', timestamptz '2026-01-06 14:24:00+07', 'hai.yen@ictu.edu.vn', timestamptz '2026-01-09 13:24:00+07', 'daotao.admin@ictu.edu.vn', timestamptz '2026-01-12 09:12:00+07', 'daotao.admin@ictu.edu.vn'),
  ('g_dbh_001', 'e_dbh_001', 9.00, 8.50, 8.70, 'LOCKED', 'Điểm rất tốt, đủ điều kiện học Phát triển ứng dụng web.', timestamptz '2026-01-07 09:00:00+07', 'minh.ha@ictu.edu.vn', timestamptz '2026-01-10 08:00:00+07', 'daotao.admin@ictu.edu.vn', timestamptz '2026-01-13 08:00:00+07', 'daotao.admin@ictu.edu.vn'),
  ('g_dbh_002', 'e_dbh_002', 8.50, 7.00, 7.50, 'LOCKED', 'Đã cập nhật sau phúc khảo phần bài tập lớn.', timestamptz '2026-01-07 09:03:00+07', 'minh.ha@ictu.edu.vn', timestamptz '2026-01-10 08:03:00+07', 'daotao.admin@ictu.edu.vn', timestamptz '2026-01-13 08:03:00+07', 'daotao.admin@ictu.edu.vn'),
  ('g_dbh_003', 'e_dbh_003', 8.20, 7.50, 7.80, 'APPROVED', 'Kết quả khá tốt, làm nền cho học phần web.', timestamptz '2026-01-07 09:06:00+07', 'minh.ha@ictu.edu.vn', timestamptz '2026-01-10 08:06:00+07', 'daotao.admin@ictu.edu.vn', null, null),
  ('g_dbh_004', 'e_dbh_004', 7.80, 6.80, 6.50, 'APPROVED', 'Đủ điều kiện tiếp tục chuỗi học phần chuyên ngành.', timestamptz '2026-01-07 09:09:00+07', 'minh.ha@ictu.edu.vn', timestamptz '2026-01-10 08:09:00+07', 'daotao.admin@ictu.edu.vn', null, null),
  ('g_dbh_016', 'e_dbh_016', 8.20, 7.40, 7.50, 'LOCKED', 'Điểm nền cho sinh viên HTTTQL học Hệ quản trị CSDL.', timestamptz '2026-01-07 09:12:00+07', 'minh.ha@ictu.edu.vn', timestamptz '2026-01-10 08:12:00+07', 'daotao.admin@ictu.edu.vn', timestamptz '2026-01-13 08:06:00+07', 'daotao.admin@ictu.edu.vn'),
  ('g_dbh_018', 'e_dbh_018', 7.80, 7.00, 6.80, 'APPROVED', 'Mức điểm đủ tốt để tiếp tục chuỗi môn dữ liệu.', timestamptz '2026-01-07 09:15:00+07', 'minh.ha@ictu.edu.vn', timestamptz '2026-01-10 08:15:00+07', 'daotao.admin@ictu.edu.vn', null, null),
  ('g_dbh_019', 'e_dbh_019', 7.00, 6.20, 6.00, 'APPROVED', 'Điểm trung bình khá của sinh viên HTTTQL.', timestamptz '2026-01-07 09:18:00+07', 'minh.ha@ictu.edu.vn', timestamptz '2026-01-10 08:18:00+07', 'daotao.admin@ictu.edu.vn', null, null);

insert into tmp_grades (
  grade_key,
  enrollment_key,
  attendance_score,
  midterm_score,
  final_score,
  status,
  remark,
  submitted_at,
  submitted_by_email,
  approved_at,
  approved_by_email,
  locked_at,
  locked_by_email
)
values
  ('g_ds_001', 'e_ds_001', 9.00, 8.00, 7.80, 'SUBMITTED', 'Giảng viên đã gửi duyệt đợt 1.', timestamptz '2026-04-02 14:00:00+07', 'pham.hung@ictu.edu.vn', null, null, null, null),
  ('g_ds_002', 'e_ds_002', 8.80, 7.80, 7.50, 'SUBMITTED', 'Bảng điểm chờ admin duyệt.', timestamptz '2026-04-02 14:05:00+07', 'pham.hung@ictu.edu.vn', null, null, null, null),
  ('g_ds_003', 'e_ds_003', 8.20, 7.00, null, 'DRAFT', 'Đang chờ cập nhật điểm cuối kỳ.', null, null, null, null, null, null),
  ('g_ds_011', 'e_ds_011', 7.80, 6.80, null, 'DRAFT', 'Đã có chuyên cần và giữa kỳ.', null, null, null, null, null, null),
  ('g_web_001', 'e_web_001', 9.00, 8.30, 8.10, 'APPROVED', 'Đã duyệt sớm để demo luồng phê duyệt điểm.', timestamptz '2026-03-31 18:00:00+07', 'minh.ha@ictu.edu.vn', timestamptz '2026-04-01 09:15:00+07', 'daotao.admin@ictu.edu.vn', null, null),
  ('g_web_002', 'e_web_002', 8.50, 7.80, 7.60, 'SUBMITTED', 'Hồ sơ điểm đã gửi duyệt.', timestamptz '2026-03-31 18:10:00+07', 'minh.ha@ictu.edu.vn', null, null, null, null),
  ('g_web_003', 'e_web_003', 8.00, 7.20, null, 'DRAFT', 'Thiếu điểm cuối kỳ.', null, null, null, null, null, null),
  ('g_sad_016', 'e_sad_016', 8.80, 8.00, 7.50, 'SUBMITTED', 'Giảng viên đã gửi bảng điểm cho học phần SAD.', timestamptz '2026-04-03 10:00:00+07', 'hai.yen@ictu.edu.vn', null, null, null, null),
  ('g_sad_017', 'e_sad_017', 8.20, 7.40, null, 'DRAFT', 'Đang chờ hoàn tất chấm cuối kỳ.', null, null, null, null, null, null),
  ('g_ec_016', 'e_ec_016', 8.50, 7.80, 7.60, 'SUBMITTED', 'Đã gửi duyệt để kịp mốc tổng hợp khoa.', timestamptz '2026-04-03 15:15:00+07', 'thanh.tung@ictu.edu.vn', null, null, null, null),
  ('g_ec_021', 'e_ec_021', 8.80, 8.00, 8.20, 'APPROVED', 'Học phần TMĐT có sẵn một bản ghi đã duyệt để test dashboard.', timestamptz '2026-04-01 11:00:00+07', 'thanh.tung@ictu.edu.vn', timestamptz '2026-04-02 08:45:00+07', 'daotao.admin@ictu.edu.vn', null, null);

insert into tmp_grade_change_logs (
  grade_key,
  changed_by_email,
  change_type,
  old_payload,
  new_payload,
  note,
  created_at
)
values
  (
    'g_dbh_002',
    'daotao.admin@ictu.edu.vn',
    'REGRADE_RESOLUTION',
    jsonb_build_object('remark', 'Kết quả ban đầu', 'total_score', 7.15),
    jsonb_build_object('remark', 'Đã cập nhật sau phúc khảo phần bài tập lớn.', 'total_score', 7.45),
    'Điều chỉnh sau khi đối soát rubric bài tập lớn môn Cơ sở dữ liệu.',
    timestamptz '2026-01-25 15:20:00+07'
  ),
  (
    'g_ds_001',
    'pham.hung@ictu.edu.vn',
    'STATUS_CHANGED',
    jsonb_build_object('status', 'DRAFT'),
    jsonb_build_object('status', 'SUBMITTED'),
    'Giảng viên gửi bảng điểm đợt 1 cho admin phê duyệt.',
    timestamptz '2026-04-02 14:00:30+07'
  );

insert into tmp_regrade_requests (
  request_key,
  grade_key,
  enrollment_key,
  student_code,
  reason,
  status,
  previous_total_score,
  resolved_total_score,
  reviewed_at,
  reviewed_by_email,
  resolution_note,
  submitted_at
)
values
  ('req_oop_005', 'g_oop_005', 'e_oop_005', 'DTC237480103005', 'Sinh viên đề nghị kiểm tra lại phần điểm thực hành do cho rằng còn thiếu 1 bài nộp trên LMS.', 'PENDING', 4.35, null, null, null, null, timestamptz '2026-01-23 09:10:00+07'),
  ('req_mis_017', 'g_mis_017', 'e_mis_017', 'DTC237340405002', 'Đề nghị rà soát lại thang điểm giữa kỳ vì bài thuyết trình nhóm đã được bổ sung minh chứng.', 'UNDER_REVIEW', 7.25, null, timestamptz '2026-01-24 14:00:00+07', 'hai.yen@ictu.edu.vn', null, timestamptz '2026-01-22 16:20:00+07'),
  ('req_dbh_002', 'g_dbh_002', 'e_dbh_002', 'DTC237480103002', 'Sinh viên đề nghị đối soát lại rubric bài tập lớn phần truy vấn nâng cao.', 'RESOLVED', 7.15, 7.45, timestamptz '2026-01-25 15:20:00+07', 'daotao.admin@ictu.edu.vn', 'Đã xem lại biên bản chấm và điều chỉnh điểm theo xác nhận của giảng viên phụ trách.', timestamptz '2026-01-22 10:05:00+07'),
  ('req_mis_021', 'g_mis_021', 'e_mis_021', 'DTC247340122001', 'Sinh viên đề nghị xem xét lại điểm chuyên cần do vắng 1 buổi có giấy xác nhận.', 'REJECTED', 6.80, null, timestamptz '2026-01-26 11:30:00+07', 'ngoc.lan@ictu.edu.vn', 'Đối soát sổ điểm danh cho thấy điểm chuyên cần đã phản ánh đúng số buổi tham gia.', timestamptz '2026-01-23 13:45:00+07');

insert into tmp_audit_logs (
  actor_email,
  actor_role,
  action,
  entity_type,
  entity_id,
  target_email,
  metadata,
  ip_address,
  user_agent,
  created_at
)
values
  ('daotao.admin@ictu.edu.vn', 'ADMIN', 'AUTH_LOGIN', 'auth', 'daotao.admin@ictu.edu.vn', 'daotao.admin@ictu.edu.vn', jsonb_build_object('via', 'seed.sql'), inet '10.16.25.11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', timestamptz '2026-04-03 07:35:00+07'),
  ('daotao.admin@ictu.edu.vn', 'ADMIN', 'USER_PROVISIONED', 'profiles', 'ICTU-CNTT-01', 'pham.hung@ictu.edu.vn', jsonb_build_object('email', 'pham.hung@ictu.edu.vn', 'role', 'LECTURER'), inet '10.16.25.11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', timestamptz '2025-08-10 09:00:00+07'),
  ('daotao.admin@ictu.edu.vn', 'ADMIN', 'USER_PROVISIONED', 'profiles', 'DTC237480103001', 'dtc237480103001@st.ictu.edu.vn', jsonb_build_object('email', 'dtc237480103001@st.ictu.edu.vn', 'role', 'STUDENT'), inet '10.16.25.11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', timestamptz '2025-08-18 10:00:00+07'),
  ('dtc237480103001@st.ictu.edu.vn', 'STUDENT', 'ENROLLMENT_REGISTERED', 'course_offerings', 'DS-HK2-01', 'dtc237480103001@st.ictu.edu.vn', jsonb_build_object('student_code', 'DTC237480103001', 'section_code', '01'), inet '10.16.25.21', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', timestamptz '2026-02-03 08:00:05+07'),
  ('dtc237340405001@st.ictu.edu.vn', 'STUDENT', 'ENROLLMENT_REGISTERED', 'course_offerings', 'SAD-HK2-01', 'dtc237340405001@st.ictu.edu.vn', jsonb_build_object('student_code', 'DTC237340405001', 'section_code', '01'), inet '10.16.25.31', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', timestamptz '2026-02-04 08:00:08+07'),
  ('pham.hung@ictu.edu.vn', 'LECTURER', 'GRADE_SHEET_SUBMITTED', 'course_offerings', 'DS-HK2-01', null, jsonb_build_object('submitted_count', 2), inet '10.16.26.41', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', timestamptz '2026-04-02 14:05:00+07'),
  ('daotao.admin@ictu.edu.vn', 'ADMIN', 'GRADE_STATUS_CHANGED', 'grades', 'g_web_001', 'dtc237480103001@st.ictu.edu.vn', jsonb_build_object('next_status', 'APPROVED'), inet '10.16.25.11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', timestamptz '2026-04-01 09:15:10+07'),
  ('dtc237480103005@st.ictu.edu.vn', 'STUDENT', 'REGRADE_REQUEST_CREATED', 'regrade_requests', 'req_oop_005', 'dtc237480103005@st.ictu.edu.vn', jsonb_build_object('status', 'PENDING'), inet '10.16.25.25', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', timestamptz '2026-01-23 09:10:05+07'),
  ('daotao.admin@ictu.edu.vn', 'ADMIN', 'REGRADE_REQUEST_RESOLVED', 'regrade_requests', 'req_dbh_002', 'dtc237480103002@st.ictu.edu.vn', jsonb_build_object('status', 'RESOLVED', 'resolved_total_score', 7.45), inet '10.16.25.11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', timestamptz '2026-01-25 15:20:10+07'),
  ('daotao.admin@ictu.edu.vn', 'ADMIN', 'PROFILE_STATUS_UPDATED', 'profiles', 'DTC247340122005', 'dtc247340122005@st.ictu.edu.vn', jsonb_build_object('profile_status', 'LOCKED', 'student_status', 'DROPPED'), inet '10.16.25.11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', timestamptz '2026-03-05 16:40:00+07');

delete from public.course_prerequisites cp
using public.courses c
join tmp_seed_config cfg on true
where (cp.course_id = c.id or cp.prerequisite_course_id = c.id)
  and c.is_demo = true
  and c.demo_batch = cfg.seed_batch;

delete from public.audit_logs
using tmp_seed_config cfg
where public.audit_logs.is_demo = true
  and public.audit_logs.demo_batch = cfg.seed_batch;

delete from public.regrade_requests
using tmp_seed_config cfg
where public.regrade_requests.is_demo = true
  and public.regrade_requests.demo_batch = cfg.seed_batch;

delete from public.grade_change_logs
using tmp_seed_config cfg
where public.grade_change_logs.is_demo = true
  and public.grade_change_logs.demo_batch = cfg.seed_batch;

delete from public.grades
using tmp_seed_config cfg
where public.grades.is_demo = true
  and public.grades.demo_batch = cfg.seed_batch;

delete from public.enrollments
using tmp_seed_config cfg
where public.enrollments.is_demo = true
  and public.enrollments.demo_batch = cfg.seed_batch;

delete from public.schedules
using tmp_seed_config cfg
where public.schedules.is_demo = true
  and public.schedules.demo_batch = cfg.seed_batch;

delete from public.teaching_assignments
using tmp_seed_config cfg
where public.teaching_assignments.is_demo = true
  and public.teaching_assignments.demo_batch = cfg.seed_batch;

delete from public.course_offerings
using tmp_seed_config cfg
where public.course_offerings.is_demo = true
  and public.course_offerings.demo_batch = cfg.seed_batch;

delete from public.students
using tmp_seed_config cfg
where public.students.is_demo = true
  and public.students.demo_batch = cfg.seed_batch;

delete from public.lecturers
using tmp_seed_config cfg
where public.lecturers.is_demo = true
  and public.lecturers.demo_batch = cfg.seed_batch;

delete from public.academic_classes
using tmp_seed_config cfg
where public.academic_classes.is_demo = true
  and public.academic_classes.demo_batch = cfg.seed_batch;

delete from public.majors
using tmp_seed_config cfg
where public.majors.is_demo = true
  and public.majors.demo_batch = cfg.seed_batch;

delete from public.courses
using tmp_seed_config cfg
where public.courses.is_demo = true
  and public.courses.demo_batch = cfg.seed_batch;

delete from public.rooms
using tmp_seed_config cfg
where public.rooms.is_demo = true
  and public.rooms.demo_batch = cfg.seed_batch;

delete from public.semesters
using tmp_seed_config cfg
where public.semesters.is_demo = true
  and public.semesters.demo_batch = cfg.seed_batch;

delete from public.departments
using tmp_seed_config cfg
where public.departments.is_demo = true
  and public.departments.demo_batch = cfg.seed_batch;

delete from public.profiles
using tmp_seed_config cfg
where public.profiles.is_demo = true
  and public.profiles.demo_batch = cfg.seed_batch;

delete from auth.identities
using tmp_seed_config cfg
where coalesce(auth.identities.identity_data ->> 'batch', '') = cfg.seed_batch
   or exists (
     select 1
     from auth.users u
     where u.id = auth.identities.user_id
       and coalesce(u.raw_user_meta_data ->> 'batch', '') = cfg.seed_batch
   );

delete from auth.users
using tmp_seed_config cfg
where coalesce(auth.users.raw_user_meta_data ->> 'batch', '') = cfg.seed_batch;

insert into public.roles (code, name, description)
values
  ('ADMIN', 'Administrator', 'Full access to manage the system'),
  ('LECTURER', 'Lecturer', 'Can manage grades and teaching workload'),
  ('STUDENT', 'Student', 'Can manage personal study activities')
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  phone
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  u.id,
  'authenticated',
  'authenticated',
  u.email,
  crypt(cfg.default_password, gen_salt('bf')),
  timezone('utc', now()),
  timezone('utc', now()),
  jsonb_build_object(
    'provider', 'email',
    'providers', jsonb_build_array('email'),
    'role', u.role_code,
    'is_demo', true,
    'batch', cfg.seed_batch
  ),
  jsonb_strip_nulls(
    jsonb_build_object(
      'batch', cfg.seed_batch,
      'display_code', coalesce(u.student_code, u.employee_code, u.role_code),
      'full_name', u.full_name,
      'is_demo', true
    )
  ),
  timezone('utc', now()),
  timezone('utc', now()),
  u.phone
from tmp_seed_users u
cross join tmp_seed_config cfg;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'identities'
      and column_name = 'provider_id'
  ) then
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    select
      gen_random_uuid(),
      u.id,
      jsonb_build_object(
        'sub', u.id::text,
        'email', u.email,
        'email_verified', true,
        'batch', cfg.seed_batch
      ),
      'email',
      u.email,
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    from tmp_seed_users u
    cross join tmp_seed_config cfg;
  else
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    select
      gen_random_uuid(),
      u.id,
      jsonb_build_object(
        'sub', u.id::text,
        'email', u.email,
        'email_verified', true,
        'batch', cfg.seed_batch
      ),
      'email',
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    from tmp_seed_users u
    cross join tmp_seed_config cfg;
  end if;
end $$;

insert into public.profiles (
  id,
  email,
  full_name,
  role_code,
  status,
  phone,
  must_change_password,
  metadata,
  is_demo,
  demo_batch
)
select
  u.id,
  u.email,
  u.full_name,
  u.role_code,
  u.profile_status::public.profile_status,
  u.phone,
  u.must_change_password,
  jsonb_strip_nulls(
    jsonb_build_object(
      'batch', cfg.seed_batch,
      'class_code', u.class_code,
      'department_code', u.department_code,
      'display_code', coalesce(u.student_code, u.employee_code, u.role_code),
      'is_demo', true
    )
  ),
  true,
  cfg.seed_batch
from tmp_seed_users u
cross join tmp_seed_config cfg;

insert into public.departments (
  id,
  code,
  name,
  description,
  is_active,
  created_by,
  is_demo,
  demo_batch
)
select
  d.id,
  d.code,
  d.name,
  d.description,
  true,
  admin.id,
  true,
  cfg.seed_batch
from tmp_departments d
cross join tmp_seed_config cfg
cross join lateral (
  select id
  from tmp_seed_users
  where role_code = 'ADMIN'
  limit 1
) admin;

insert into public.majors (
  id,
  department_id,
  code,
  name,
  degree_level,
  is_active,
  created_by,
  is_demo,
  demo_batch
)
select
  m.id,
  d.id,
  m.code,
  m.name,
  m.degree_level,
  true,
  admin.id,
  true,
  cfg.seed_batch
from tmp_majors m
join tmp_departments d on d.code = m.department_code
cross join tmp_seed_config cfg
cross join lateral (
  select id
  from tmp_seed_users
  where role_code = 'ADMIN'
  limit 1
) admin;

insert into public.academic_classes (
  id,
  major_id,
  code,
  name,
  cohort_year,
  is_active,
  created_by,
  is_demo,
  demo_batch
)
select
  c.id,
  m.id,
  c.code,
  c.name,
  c.cohort_year,
  true,
  admin.id,
  true,
  cfg.seed_batch
from tmp_classes c
join tmp_majors m on m.code = c.major_code
cross join tmp_seed_config cfg
cross join lateral (
  select id
  from tmp_seed_users
  where role_code = 'ADMIN'
  limit 1
) admin;

insert into public.semesters (
  id,
  code,
  name,
  academic_year,
  start_date,
  end_date,
  enrollment_start,
  enrollment_end,
  regrade_open_at,
  regrade_close_at,
  max_credits,
  is_current,
  created_by,
  is_demo,
  demo_batch
)
select
  s.id,
  s.code,
  s.name,
  s.academic_year,
  s.start_date,
  s.end_date,
  s.enrollment_start,
  s.enrollment_end,
  s.regrade_open_at,
  s.regrade_close_at,
  s.max_credits,
  s.is_current,
  admin.id,
  true,
  cfg.seed_batch
from tmp_semesters s
cross join tmp_seed_config cfg
cross join lateral (
  select id
  from tmp_seed_users
  where role_code = 'ADMIN'
  limit 1
) admin;

insert into public.rooms (
  id,
  code,
  name,
  building,
  capacity,
  is_active,
  created_by,
  is_demo,
  demo_batch
)
select
  r.id,
  r.code,
  r.name,
  r.building,
  r.capacity,
  true,
  admin.id,
  true,
  cfg.seed_batch
from tmp_rooms r
cross join tmp_seed_config cfg
cross join lateral (
  select id
  from tmp_seed_users
  where role_code = 'ADMIN'
  limit 1
) admin;

insert into public.courses (
  id,
  department_id,
  code,
  name,
  credit_hours,
  total_sessions,
  description,
  is_active,
  created_by,
  is_demo,
  demo_batch
)
select
  c.id,
  d.id,
  c.code,
  c.name,
  c.credit_hours,
  c.total_sessions,
  c.description,
  true,
  admin.id,
  true,
  cfg.seed_batch
from tmp_courses c
join tmp_departments d on d.code = c.department_code
cross join tmp_seed_config cfg
cross join lateral (
  select id
  from tmp_seed_users
  where role_code = 'ADMIN'
  limit 1
) admin;

insert into public.course_prerequisites (
  course_id,
  prerequisite_course_id,
  minimum_score
)
select
  course_row.id,
  prerequisite_row.id,
  cp.minimum_score
from tmp_course_prerequisites cp
join tmp_courses course_row on course_row.code = cp.course_code
join tmp_courses prerequisite_row on prerequisite_row.code = cp.prerequisite_code;

insert into public.lecturers (
  id,
  employee_code,
  department_id,
  academic_title,
  hire_date,
  office_location,
  bio,
  is_demo,
  demo_batch
)
select
  u.id,
  u.employee_code,
  d.id,
  u.academic_title,
  u.hire_date,
  u.office_location,
  u.bio,
  true,
  cfg.seed_batch
from tmp_seed_users u
join tmp_departments d on d.code = u.department_code
cross join tmp_seed_config cfg
where u.role_code = 'LECTURER';

insert into public.students (
  id,
  student_code,
  academic_class_id,
  enrollment_year,
  current_status,
  gender,
  date_of_birth,
  address,
  emergency_contact,
  is_demo,
  demo_batch
)
select
  u.id,
  u.student_code,
  c.id,
  u.enrollment_year,
  u.current_status::public.student_status,
  u.gender,
  u.date_of_birth,
  u.address,
  u.emergency_contact,
  true,
  cfg.seed_batch
from tmp_seed_users u
join tmp_classes c on c.code = u.class_code
cross join tmp_seed_config cfg
where u.role_code = 'STUDENT';

insert into public.course_offerings (
  id,
  course_id,
  semester_id,
  section_code,
  title,
  max_capacity,
  enrolled_count,
  registration_open_at,
  registration_close_at,
  attendance_weight,
  midterm_weight,
  final_weight,
  passing_score,
  status,
  notes,
  created_by,
  is_demo,
  demo_batch
)
select
  o.id,
  c.id,
  s.id,
  o.section_code,
  o.title,
  o.max_capacity,
  0,
  o.registration_open_at,
  o.registration_close_at,
  o.attendance_weight,
  o.midterm_weight,
  o.final_weight,
  o.passing_score,
  o.status::public.offering_status,
  o.notes,
  admin.id,
  true,
  cfg.seed_batch
from tmp_offerings o
join tmp_courses c on c.code = o.course_code
join tmp_semesters s on s.code = o.semester_code
cross join tmp_seed_config cfg
cross join lateral (
  select id
  from tmp_seed_users
  where role_code = 'ADMIN'
  limit 1
) admin;

insert into public.teaching_assignments (
  id,
  course_offering_id,
  lecturer_id,
  assignment_role,
  is_primary,
  is_demo,
  demo_batch
)
select
  ta.id,
  o.id,
  l.id,
  ta.assignment_role,
  ta.is_primary,
  true,
  cfg.seed_batch
from tmp_teaching_assignments ta
join tmp_offerings o on o.offering_key = ta.offering_key
join tmp_seed_users l on l.email = ta.lecturer_email
cross join tmp_seed_config cfg;

insert into public.schedules (
  id,
  course_offering_id,
  room_id,
  day_of_week,
  start_time,
  end_time,
  week_pattern,
  start_date,
  end_date,
  note,
  is_demo,
  demo_batch
)
select
  sch.id,
  o.id,
  r.id,
  sch.day_of_week,
  sch.start_time,
  sch.end_time,
  sch.week_pattern,
  sch.start_date,
  sch.end_date,
  sch.note,
  true,
  cfg.seed_batch
from tmp_schedules sch
join tmp_offerings o on o.offering_key = sch.offering_key
left join tmp_rooms r on r.code = sch.room_code
cross join tmp_seed_config cfg;

insert into public.enrollments (
  id,
  student_id,
  course_offering_id,
  status,
  enrolled_at,
  dropped_at,
  drop_reason,
  approved_by,
  is_demo,
  demo_batch
)
select
  e.id,
  stu.id,
  off.id,
  e.status::public.enrollment_status,
  e.enrolled_at,
  e.dropped_at,
  e.drop_reason,
  approver.id,
  true,
  cfg.seed_batch
from tmp_enrollments e
join tmp_seed_users stu on stu.student_code = e.student_code
join tmp_offerings off on off.offering_key = e.offering_key
left join tmp_seed_users approver on approver.email = e.approved_by_email
cross join tmp_seed_config cfg;

insert into public.grades (
  id,
  enrollment_id,
  attendance_score,
  midterm_score,
  final_score,
  status,
  submitted_at,
  submitted_by,
  approved_at,
  approved_by,
  locked_at,
  locked_by,
  remark,
  is_demo,
  demo_batch
)
select
  g.id,
  e.id,
  g.attendance_score,
  g.midterm_score,
  g.final_score,
  g.status::public.grade_status,
  g.submitted_at,
  submitted_actor.id,
  g.approved_at,
  approved_actor.id,
  g.locked_at,
  locked_actor.id,
  g.remark,
  true,
  cfg.seed_batch
from tmp_grades g
join tmp_enrollments e on e.enrollment_key = g.enrollment_key
left join tmp_seed_users submitted_actor on submitted_actor.email = g.submitted_by_email
left join tmp_seed_users approved_actor on approved_actor.email = g.approved_by_email
left join tmp_seed_users locked_actor on locked_actor.email = g.locked_by_email
cross join tmp_seed_config cfg;

insert into public.grade_change_logs (
  id,
  grade_id,
  changed_by,
  change_type,
  old_payload,
  new_payload,
  note,
  is_demo,
  demo_batch,
  created_at
)
select
  gcl.id,
  g.id,
  actor.id,
  gcl.change_type,
  gcl.old_payload,
  gcl.new_payload,
  gcl.note,
  true,
  cfg.seed_batch,
  gcl.created_at
from tmp_grade_change_logs gcl
join tmp_grades g on g.grade_key = gcl.grade_key
left join tmp_seed_users actor on actor.email = gcl.changed_by_email
cross join tmp_seed_config cfg;

insert into public.regrade_requests (
  id,
  grade_id,
  enrollment_id,
  student_id,
  reason,
  status,
  previous_total_score,
  resolved_total_score,
  reviewed_at,
  reviewed_by,
  resolution_note,
  submitted_at,
  is_demo,
  demo_batch
)
select
  rr.id,
  g.id,
  e.id,
  stu.id,
  rr.reason,
  rr.status::public.regrade_status,
  rr.previous_total_score,
  rr.resolved_total_score,
  rr.reviewed_at,
  reviewer.id,
  rr.resolution_note,
  rr.submitted_at,
  true,
  cfg.seed_batch
from tmp_regrade_requests rr
join tmp_grades g on g.grade_key = rr.grade_key
join tmp_enrollments e on e.enrollment_key = rr.enrollment_key
join tmp_seed_users stu on stu.student_code = rr.student_code
left join tmp_seed_users reviewer on reviewer.email = rr.reviewed_by_email
cross join tmp_seed_config cfg;

insert into public.audit_logs (
  actor_id,
  actor_role,
  action,
  entity_type,
  entity_id,
  target_user_id,
  metadata,
  ip_address,
  user_agent,
  is_demo,
  demo_batch,
  created_at
)
select
  actor.id,
  log.actor_role,
  log.action,
  log.entity_type,
  log.entity_id,
  target.id,
  log.metadata,
  log.ip_address,
  log.user_agent,
  true,
  cfg.seed_batch,
  log.created_at
from tmp_audit_logs log
left join tmp_seed_users actor on actor.email = log.actor_email
left join tmp_seed_users target on target.email = log.target_email
cross join tmp_seed_config cfg;

update public.course_offerings co
set enrolled_count = coalesce(enrollment_stats.total_active, 0)
from (
  select
    e.course_offering_id,
    count(*) filter (where e.status <> 'DROPPED')::int as total_active
  from public.enrollments e
  join public.course_offerings seeded_offering on seeded_offering.id = e.course_offering_id
  join tmp_seed_config cfg on true
  where seeded_offering.is_demo = true
    and seeded_offering.demo_batch = cfg.seed_batch
  group by e.course_offering_id
) enrollment_stats
where co.id = enrollment_stats.course_offering_id;

update public.course_offerings co
set enrolled_count = 0
from tmp_seed_config cfg
where co.is_demo = true
  and co.demo_batch = cfg.seed_batch
  and not exists (
    select 1
    from public.enrollments e
    where e.course_offering_id = co.id
      and e.status <> 'DROPPED'
  );

commit;
