import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../src/types/database";
import {
  createDemoUser,
  createServiceRoleClient,
  DEMO_BATCH,
  DEMO_MARKER,
  resetDemoData,
  type ScriptProfileStatus,
  type ScriptRole,
} from "./demo-utils";

type Client = SupabaseClient<Database>;
type TableName = keyof Database["public"]["Tables"];
type SeedRow = Record<string, unknown>;
type Uuid = `${string}-${string}-${string}-${string}-${string}`;

type AccountSpec = {
  code: string;
  email: string;
  fullName: string;
  password: string;
  role: ScriptRole;
  status?: ScriptProfileStatus;
};

const ADMIN_ACCOUNT: AccountSpec = {
  code: "ADMIN",
  email: "admin@sms.edu.vn",
  fullName: "Quan tri he thong",
  password: "Admin@123456",
  role: "ADMIN",
};

const LECTURER_ACCOUNTS: AccountSpec[] = [
  {
    code: "GV001",
    email: "gv.nguyen@sms.edu.vn",
    fullName: "Nguyen Van Giang",
    password: "Gv@123456",
    role: "LECTURER",
  },
  {
    code: "GV002",
    email: "gv.tran@sms.edu.vn",
    fullName: "Tran Thi Huong",
    password: "Gv@123456",
    role: "LECTURER",
  },
  {
    code: "GV003",
    email: "gv.le@sms.edu.vn",
    fullName: "Le Quang Minh",
    password: "Gv@123456",
    role: "LECTURER",
  },
];

const STUDENT_ACCOUNTS: AccountSpec[] = [
  {
    code: "SV001",
    email: "sv.001@sms.edu.vn",
    fullName: "Sinh vien 001",
    password: "Sv@123456",
    role: "STUDENT",
  },
  {
    code: "SV002",
    email: "sv.002@sms.edu.vn",
    fullName: "Sinh vien 002",
    password: "Sv@123456",
    role: "STUDENT",
  },
  {
    code: "SV003",
    email: "sv.003@sms.edu.vn",
    fullName: "Sinh vien 003",
    password: "Sv@123456",
    role: "STUDENT",
  },
  {
    code: "SV004",
    email: "sv.004@sms.edu.vn",
    fullName: "Sinh vien 004",
    password: "Sv@123456",
    role: "STUDENT",
  },
  {
    code: "SV005",
    email: "sv.005@sms.edu.vn",
    fullName: "Sinh vien 005",
    password: "Sv@123456",
    role: "STUDENT",
  },
  {
    code: "SV006",
    email: "sv.006@sms.edu.vn",
    fullName: "Sinh vien 006",
    password: "Sv@123456",
    role: "STUDENT",
    status: "INACTIVE",
  },
  {
    code: "SV007",
    email: "sv.007@sms.edu.vn",
    fullName: "Sinh vien 007",
    password: "Sv@123456",
    role: "STUDENT",
  },
  {
    code: "SV008",
    email: "sv.008@sms.edu.vn",
    fullName: "Sinh vien 008",
    password: "Sv@123456",
    role: "STUDENT",
  },
  {
    code: "SV009",
    email: "sv.009@sms.edu.vn",
    fullName: "Sinh vien 009",
    password: "Sv@123456",
    role: "STUDENT",
  },
  {
    code: "SV010",
    email: "sv.010@sms.edu.vn",
    fullName: "Sinh vien 010",
    password: "Sv@123456",
    role: "STUDENT",
  },
];

const ALL_ACCOUNTS = [ADMIN_ACCOUNT, ...LECTURER_ACCOUNTS, ...STUDENT_ACCOUNTS];
const ACCOUNT_EMAILS = ALL_ACCOUNTS.map((account) => account.email);
const DEPARTMENT_CODES = ["CNTT", "QTKD", "KT"] as const;
const MAJOR_CODES = ["KTPM", "HTTT", "QTKD"] as const;
const CLASS_CODES = ["KTPM21A", "KTPM21B", "HTTT22A"] as const;
const ROOM_CODES = ["A101", "A102", "B201", "B202", "C301"] as const;
const SEMESTER_CODES = ["HK1-2324", "HK2-2526"] as const;
const COURSE_CODES = ["CNPM", "LTCB", "LTOOP", "CSDL", "CTDL", "MMT", "ATTT", "TTCS"] as const;
const OFFERING_SECTION_CODES = ["LT01", "TT01", "HP1", "HP2", "HP3", "HP4", "HP5", "HP6"] as const;
const LECTURER_CODES = ["GV001", "GV002", "GV003"] as const;
const STUDENT_CODES = [
  "SV001",
  "SV002",
  "SV003",
  "SV004",
  "SV005",
  "SV006",
  "SV007",
  "SV008",
  "SV009",
  "SV010",
] as const;

function toIso(value: string) {
  return new Date(value).toISOString();
}

function logDone(message: string) {
  console.info(`✓ ${message}`);
}

function withDemoMarker<T extends SeedRow>(row: T): T & typeof DEMO_MARKER {
  return {
    ...row,
    ...DEMO_MARKER,
  };
}

async function insertRows(
  client: Client,
  table: TableName,
  rows: SeedRow[],
  successMessage: string,
) {
  if (!rows.length) {
    return;
  }

  const { error } = await (client.from(table as any) as any).insert(rows);
  if (error) {
    throw new Error(`${String(table)}: ${error.message}`);
  }

  logDone(successMessage);
}

async function updateRows(
  client: Client,
  table: TableName,
  matchField: string,
  matchValue: string | undefined,
  payload: SeedRow,
) {
  if (!matchValue) {
    throw new Error(`Missing match value for ${String(table)}.${matchField}`);
  }

  const { error } = await (client.from(table as any) as any)
    .update(payload)
    .eq(matchField, matchValue);

  if (error) {
    throw new Error(`${String(table)} update: ${error.message}`);
  }
}

function uniqueIds(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

async function selectIdsByIn(
  client: Client,
  table: TableName,
  field: string,
  values: readonly string[],
) {
  if (!values.length) {
    return [] as string[];
  }

  const { data, error } = await (client.from(table as any) as any)
    .select("id")
    .in(field, [...values]);
  if (error) {
    throw new Error(`select ${String(table)} by ${field}: ${error.message}`);
  }

  return uniqueIds(((data ?? []) as Array<{ id?: string | null }>).map((item) => item.id));
}

async function selectCodeIdMap(
  client: Client,
  table: TableName,
  codeField: string,
  codes: readonly string[],
) {
  if (!codes.length) {
    return {} as Record<string, Uuid>;
  }

  const { data, error } = await (client.from(table as any) as any)
    .select(`${codeField}, id`)
    .in(codeField, [...codes]);
  if (error) {
    throw new Error(`select ${String(table)} code map: ${error.message}`);
  }

  const pairs = ((data ?? []) as Array<{ id?: string | null; [key: string]: unknown }>)
    .map((row) => {
      const code = row[codeField];
      const id = row.id;
      return typeof code === "string" && typeof id === "string"
        ? [code, id as Uuid]
        : null;
    })
    .filter((entry): entry is [string, Uuid] => Boolean(entry));
  return Object.fromEntries(pairs);
}

async function deleteByIn(
  client: Client,
  table: TableName,
  field: string,
  values: readonly string[],
) {
  if (!values.length) {
    return;
  }

  const { error } = await (client.from(table as any) as any).delete().in(field, [...values]);
  if (error) {
    throw new Error(`delete ${String(table)} by ${field}: ${error.message}`);
  }
}

async function clearAuthUsers(client: Client, userIds: readonly string[]) {
  for (const userId of userIds) {
    const { error } = await client.auth.admin.deleteUser(userId);
    if (error && !error.message.includes("User not found")) {
      throw new Error(`delete auth user ${userId}: ${error.message}`);
    }
  }
}

async function clearConflictingSeedData(client: Client) {
  const profileIds = await selectIdsByIn(client, "profiles", "email", ACCOUNT_EMAILS);
  const courseIds = await selectIdsByIn(client, "courses", "code", COURSE_CODES);
  const semesterIds = await selectIdsByIn(client, "semesters", "code", SEMESTER_CODES);
  const offeringIds = uniqueIds([
    ...(await selectIdsByIn(
      client,
      "course_offerings",
      "section_code",
      OFFERING_SECTION_CODES,
    )),
    ...(courseIds.length
      ? await selectIdsByIn(client, "course_offerings", "course_id", courseIds)
      : []),
    ...(semesterIds.length
      ? await selectIdsByIn(client, "course_offerings", "semester_id", semesterIds)
      : []),
  ]);
  const studentIds = uniqueIds([
    ...(await selectIdsByIn(client, "students", "student_code", STUDENT_CODES)),
    ...(profileIds.length
      ? await selectIdsByIn(client, "students", "id", profileIds)
      : []),
  ]);
  const lecturerIds = uniqueIds([
    ...(await selectIdsByIn(client, "lecturers", "employee_code", LECTURER_CODES)),
    ...(profileIds.length
      ? await selectIdsByIn(client, "lecturers", "id", profileIds)
      : []),
  ]);
  const enrollmentIds = uniqueIds([
    ...(offeringIds.length
      ? await selectIdsByIn(client, "enrollments", "course_offering_id", offeringIds)
      : []),
    ...(studentIds.length
      ? await selectIdsByIn(client, "enrollments", "student_id", studentIds)
      : []),
  ]);
  const gradeIds = uniqueIds(
    enrollmentIds.length
      ? await selectIdsByIn(client, "grades", "enrollment_id", enrollmentIds)
      : [],
  );

  await deleteByIn(client, "regrade_requests", "grade_id", gradeIds);
  await deleteByIn(client, "regrade_requests", "enrollment_id", enrollmentIds);
  await deleteByIn(client, "regrade_requests", "student_id", studentIds);

  await deleteByIn(client, "grade_change_logs", "grade_id", gradeIds);
  await deleteByIn(client, "grades", "id", gradeIds);
  await deleteByIn(client, "grades", "enrollment_id", enrollmentIds);

  await deleteByIn(client, "enrollments", "id", enrollmentIds);
  await deleteByIn(client, "enrollments", "course_offering_id", offeringIds);
  await deleteByIn(client, "enrollments", "student_id", studentIds);

  await deleteByIn(client, "schedules", "course_offering_id", offeringIds);
  await deleteByIn(client, "teaching_assignments", "course_offering_id", offeringIds);
  await deleteByIn(client, "teaching_assignments", "lecturer_id", lecturerIds);
  await deleteByIn(client, "course_offerings", "id", offeringIds);
  await deleteByIn(
    client,
    "course_offerings",
    "section_code",
    OFFERING_SECTION_CODES,
  );

  await deleteByIn(client, "students", "id", studentIds);
  await deleteByIn(client, "students", "student_code", STUDENT_CODES);

  await deleteByIn(client, "lecturers", "id", lecturerIds);
  await deleteByIn(client, "lecturers", "employee_code", LECTURER_CODES);

  await clearAuthUsers(client, profileIds);
  await deleteByIn(client, "profiles", "id", profileIds);
  await deleteByIn(client, "profiles", "email", ACCOUNT_EMAILS);

  logDone("Da clear du lieu trung theo code/email cho bo demo");
}

async function createSeedUsers(client: Client) {
  const ids: Record<string, string> = {};

  const createOne = async (account: AccountSpec) => {
    const id = await createDemoUser(client, {
      email: account.email,
      fullName: account.fullName,
      metadata: { display_code: account.code },
      password: account.password,
      role: account.role,
      status: account.status ?? "ACTIVE",
    });
    ids[account.code] = id;
  };

  await createOne(ADMIN_ACCOUNT);
  for (const lecturer of LECTURER_ACCOUNTS) {
    await createOne(lecturer);
  }
  for (const student of STUDENT_ACCOUNTS) {
    await createOne(student);
  }

  logDone("Tao 1 admin, 3 giang vien va 10 sinh vien demo");
  return ids;
}

async function syncOfferingEnrollmentCounts(client: Client, offeringIds: string[]) {
  for (const offeringId of offeringIds) {
    const { count, error: countError } = await client
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("course_offering_id", offeringId)
      .eq("status", "ENROLLED");

    if (countError) {
      throw new Error(`count enrollments ${offeringId}: ${countError.message}`);
    }

    const { error: updateError } = await client
      .from("course_offerings")
      .update({ enrolled_count: count ?? 0 } as never)
      .eq("id", offeringId);

    if (updateError) {
      throw new Error(`update enrolled_count ${offeringId}: ${updateError.message}`);
    }
  }

  logDone("Dong bo enrolled_count cho hoc phan mo");
}

export async function clearAll(client = createServiceRoleClient()) {
  const result = await resetDemoData(client);
  await clearConflictingSeedData(client);
  logDone(
    `Da clear demo batch "${DEMO_BATCH}" (${result.deletedProfileCount} profiles, ${result.deletedCourseCount} courses)`,
  );
  return result;
}

export async function seedAll(client = createServiceRoleClient()) {
  await clearAll(client);

  const ids = await createSeedUsers(client);
  const adminId = ids.ADMIN;
  const gv1 = ids.GV001;
  const gv2 = ids.GV002;
  const gv3 = ids.GV003;

  const entityIds = {
    classes: {
      httt22a: randomUUID(),
      ktpm21a: randomUUID(),
      ktpm21b: randomUUID(),
    },
    courses: {
      attt: randomUUID(),
      cnpm: randomUUID(),
      csdl: randomUUID(),
      ctdl: randomUUID(),
      ltcb: randomUUID(),
      ltoop: randomUUID(),
      mmt: randomUUID(),
      ttcs: randomUUID(),
    },
    departments: {
      cntt: randomUUID(),
      kt: randomUUID(),
      qtkd: randomUUID(),
    },
    majors: {
      httt: randomUUID(),
      ktpm: randomUUID(),
      qtkd: randomUUID(),
    },
    offerings: {
      hp1: randomUUID(),
      hp2: randomUUID(),
      hp3: randomUUID(),
      hp4: randomUUID(),
      hp5: randomUUID(),
      hp6: randomUUID(),
      ltcbHistory: randomUUID(),
      ttcsHistory: randomUUID(),
    },
    rooms: {
      a101: randomUUID(),
      a102: randomUUID(),
      b201: randomUUID(),
      b202: randomUUID(),
      c301: randomUUID(),
    },
    semesters: {
      hk1: randomUUID(),
      hk2: randomUUID(),
    },
  };

  const existingDepartmentIds = await selectCodeIdMap(
    client,
    "departments",
    "code",
    DEPARTMENT_CODES,
  );
  entityIds.departments.cntt = existingDepartmentIds.CNTT ?? entityIds.departments.cntt;
  entityIds.departments.qtkd = existingDepartmentIds.QTKD ?? entityIds.departments.qtkd;
  entityIds.departments.kt = existingDepartmentIds.KT ?? entityIds.departments.kt;
  const departmentRows = [
    withDemoMarker({
      code: "CNTT",
      created_by: adminId,
      id: entityIds.departments.cntt,
      is_active: true,
      name: "Cong nghe Thong tin",
    }),
    withDemoMarker({
      code: "QTKD",
      created_by: adminId,
      id: entityIds.departments.qtkd,
      is_active: true,
      name: "Quan tri Kinh doanh",
    }),
    withDemoMarker({
      code: "KT",
      created_by: adminId,
      id: entityIds.departments.kt,
      is_active: true,
      name: "Ke toan",
    }),
  ];
  await insertRows(
    client,
    "departments",
    departmentRows.filter(
      (row) => !existingDepartmentIds[String((row as { code: string }).code)],
    ),
    "Tao 3 khoa",
  );

  const existingMajorIds = await selectCodeIdMap(client, "majors", "code", MAJOR_CODES);
  entityIds.majors.ktpm = existingMajorIds.KTPM ?? entityIds.majors.ktpm;
  entityIds.majors.httt = existingMajorIds.HTTT ?? entityIds.majors.httt;
  entityIds.majors.qtkd = existingMajorIds.QTKD ?? entityIds.majors.qtkd;
  const majorRows = [
    withDemoMarker({
      code: "KTPM",
      created_by: adminId,
      degree_level: "BACHELOR",
      department_id: entityIds.departments.cntt,
      id: entityIds.majors.ktpm,
      is_active: true,
      name: "Ky thuat Phan mem",
    }),
    withDemoMarker({
      code: "HTTT",
      created_by: adminId,
      degree_level: "BACHELOR",
      department_id: entityIds.departments.cntt,
      id: entityIds.majors.httt,
      is_active: true,
      name: "He thong Thong tin",
    }),
    withDemoMarker({
      code: "QTKD",
      created_by: adminId,
      degree_level: "BACHELOR",
      department_id: entityIds.departments.qtkd,
      id: entityIds.majors.qtkd,
      is_active: true,
      name: "Quan tri Kinh doanh",
    }),
  ];
  await insertRows(
    client,
    "majors",
    majorRows.filter((row) => !existingMajorIds[String((row as { code: string }).code)]),
    "Tao 3 nganh",
  );

  const existingClassIds = await selectCodeIdMap(
    client,
    "academic_classes",
    "code",
    CLASS_CODES,
  );
  entityIds.classes.ktpm21a = existingClassIds.KTPM21A ?? entityIds.classes.ktpm21a;
  entityIds.classes.ktpm21b = existingClassIds.KTPM21B ?? entityIds.classes.ktpm21b;
  entityIds.classes.httt22a = existingClassIds.HTTT22A ?? entityIds.classes.httt22a;
  const classRows = [
    withDemoMarker({
      code: "KTPM21A",
      cohort_year: 2021,
      created_by: adminId,
      id: entityIds.classes.ktpm21a,
      is_active: true,
      major_id: entityIds.majors.ktpm,
      name: "Ky thuat PM 2021 A",
    }),
    withDemoMarker({
      code: "KTPM21B",
      cohort_year: 2021,
      created_by: adminId,
      id: entityIds.classes.ktpm21b,
      is_active: true,
      major_id: entityIds.majors.ktpm,
      name: "Ky thuat PM 2021 B",
    }),
    withDemoMarker({
      code: "HTTT22A",
      cohort_year: 2022,
      created_by: adminId,
      id: entityIds.classes.httt22a,
      is_active: true,
      major_id: entityIds.majors.httt,
      name: "He thong TT 2022 A",
    }),
  ];
  await insertRows(
    client,
    "academic_classes",
    classRows.filter((row) => !existingClassIds[String((row as { code: string }).code)]),
    "Tao 3 lop sinh hoat",
  );

  const existingRoomIds = await selectCodeIdMap(client, "rooms", "code", ROOM_CODES);
  entityIds.rooms.a101 = existingRoomIds.A101 ?? entityIds.rooms.a101;
  entityIds.rooms.a102 = existingRoomIds.A102 ?? entityIds.rooms.a102;
  entityIds.rooms.b201 = existingRoomIds.B201 ?? entityIds.rooms.b201;
  entityIds.rooms.b202 = existingRoomIds.B202 ?? entityIds.rooms.b202;
  entityIds.rooms.c301 = existingRoomIds.C301 ?? entityIds.rooms.c301;
  const roomRows = [
    withDemoMarker({
      building: "A",
      capacity: 40,
      code: "A101",
      created_by: adminId,
      id: entityIds.rooms.a101,
      is_active: true,
      name: "Phong A101",
    }),
    withDemoMarker({
      building: "A",
      capacity: 40,
      code: "A102",
      created_by: adminId,
      id: entityIds.rooms.a102,
      is_active: true,
      name: "Phong A102",
    }),
    withDemoMarker({
      building: "B",
      capacity: 30,
      code: "B201",
      created_by: adminId,
      id: entityIds.rooms.b201,
      is_active: true,
      name: "Lab B201",
    }),
    withDemoMarker({
      building: "B",
      capacity: 30,
      code: "B202",
      created_by: adminId,
      id: entityIds.rooms.b202,
      is_active: true,
      name: "Lab B202",
    }),
    withDemoMarker({
      building: "C",
      capacity: 100,
      code: "C301",
      created_by: adminId,
      id: entityIds.rooms.c301,
      is_active: true,
      name: "Hoi truong C301",
    }),
  ];
  await insertRows(
    client,
    "rooms",
    roomRows.filter((row) => !existingRoomIds[String((row as { code: string }).code)]),
    "Tao 5 phong hoc",
  );

  const existingSemesterIds = await selectCodeIdMap(
    client,
    "semesters",
    "code",
    SEMESTER_CODES,
  );
  entityIds.semesters.hk1 = existingSemesterIds["HK1-2324"] ?? entityIds.semesters.hk1;
  entityIds.semesters.hk2 = existingSemesterIds["HK2-2526"] ?? entityIds.semesters.hk2;
  const semesterRows = [
    withDemoMarker({
      academic_year: "2023-2024",
      code: "HK1-2324",
      created_by: adminId,
      end_date: "2024-01-15",
      enrollment_end: toIso("2023-09-10T23:59:59+07:00"),
      enrollment_start: toIso("2023-08-20T00:00:00+07:00"),
      id: entityIds.semesters.hk1,
      is_current: false,
      max_credits: 21,
      name: "Hoc ky 1 2023-2024",
      start_date: "2023-09-01",
    }),
    withDemoMarker({
      academic_year: "2025-2026",
      code: "HK2-2526",
      created_by: adminId,
      end_date: "2026-06-30",
      enrollment_end: toIso("2026-12-31T23:59:59+07:00"),
      enrollment_start: toIso("2026-03-01T00:00:00+07:00"),
      id: entityIds.semesters.hk2,
      is_current: true,
      max_credits: 21,
      name: "Hoc ky 2 2025-2026",
      regrade_close_at: toIso("2026-07-15T23:59:59+07:00"),
      regrade_open_at: toIso("2026-07-01T00:00:00+07:00"),
      start_date: "2026-02-15",
    }),
  ];
  await insertRows(
    client,
    "semesters",
    semesterRows.filter(
      (row) => !existingSemesterIds[String((row as { code: string }).code)],
    ),
    "Tao 2 hoc ky (co hoc ky hien tai)",
  );

  const existingCourseIds = await selectCodeIdMap(client, "courses", "code", COURSE_CODES);
  entityIds.courses.cnpm = existingCourseIds.CNPM ?? entityIds.courses.cnpm;
  entityIds.courses.ltcb = existingCourseIds.LTCB ?? entityIds.courses.ltcb;
  entityIds.courses.ltoop = existingCourseIds.LTOOP ?? entityIds.courses.ltoop;
  entityIds.courses.csdl = existingCourseIds.CSDL ?? entityIds.courses.csdl;
  entityIds.courses.ctdl = existingCourseIds.CTDL ?? entityIds.courses.ctdl;
  entityIds.courses.mmt = existingCourseIds.MMT ?? entityIds.courses.mmt;
  entityIds.courses.attt = existingCourseIds.ATTT ?? entityIds.courses.attt;
  entityIds.courses.ttcs = existingCourseIds.TTCS ?? entityIds.courses.ttcs;
  const courseRows = [
    withDemoMarker({
      code: "CNPM",
      created_by: adminId,
      credit_hours: 3,
      department_id: entityIds.departments.cntt,
      id: entityIds.courses.cnpm,
      is_active: true,
      name: "Cong nghe Phan mem",
      total_sessions: 30,
    }),
    withDemoMarker({
      code: "LTCB",
      created_by: adminId,
      credit_hours: 3,
      department_id: entityIds.departments.cntt,
      id: entityIds.courses.ltcb,
      is_active: true,
      name: "Lap trinh Can ban",
      total_sessions: 30,
    }),
    withDemoMarker({
      code: "LTOOP",
      created_by: adminId,
      credit_hours: 3,
      department_id: entityIds.departments.cntt,
      id: entityIds.courses.ltoop,
      is_active: true,
      name: "Lap trinh Huong doi tuong",
      total_sessions: 30,
    }),
    withDemoMarker({
      code: "CSDL",
      created_by: adminId,
      credit_hours: 3,
      department_id: entityIds.departments.cntt,
      id: entityIds.courses.csdl,
      is_active: true,
      name: "Co so Du lieu",
      total_sessions: 30,
    }),
    withDemoMarker({
      code: "CTDL",
      created_by: adminId,
      credit_hours: 3,
      department_id: entityIds.departments.cntt,
      id: entityIds.courses.ctdl,
      is_active: true,
      name: "Cau truc Du lieu",
      total_sessions: 30,
    }),
    withDemoMarker({
      code: "MMT",
      created_by: adminId,
      credit_hours: 3,
      department_id: entityIds.departments.cntt,
      id: entityIds.courses.mmt,
      is_active: true,
      name: "Mang May tinh",
      total_sessions: 30,
    }),
    withDemoMarker({
      code: "ATTT",
      created_by: adminId,
      credit_hours: 3,
      department_id: entityIds.departments.cntt,
      id: entityIds.courses.attt,
      is_active: true,
      name: "An toan Thong tin",
      total_sessions: 30,
    }),
    withDemoMarker({
      code: "TTCS",
      created_by: adminId,
      credit_hours: 2,
      department_id: entityIds.departments.cntt,
      id: entityIds.courses.ttcs,
      is_active: true,
      name: "Toan to hop",
      total_sessions: 24,
    }),
  ];
  await insertRows(
    client,
    "courses",
    courseRows.filter((row) => !existingCourseIds[String((row as { code: string }).code)]),
    "Tao 8 mon hoc",
  );

  const prerequisiteRows = [
    {
      course_id: entityIds.courses.ltoop,
      minimum_score: 5,
      prerequisite_course_id: entityIds.courses.ltcb,
    },
    {
      course_id: entityIds.courses.ctdl,
      minimum_score: 5,
      prerequisite_course_id: entityIds.courses.ltcb,
    },
    {
      course_id: entityIds.courses.attt,
      minimum_score: 5,
      prerequisite_course_id: entityIds.courses.mmt,
    },
  ];
  const { error: prerequisiteError } = await (client.from(
    "course_prerequisites" as any,
  ) as any).upsert(prerequisiteRows, {
    onConflict: "course_id,prerequisite_course_id",
  });
  if (prerequisiteError) {
    throw new Error(`course_prerequisites: ${prerequisiteError.message}`);
  }
  logDone("Tao 3 rang buoc tien quyet");

  await insertRows(
    client,
    "lecturers",
    [
      withDemoMarker({
        department_id: entityIds.departments.cntt,
        employee_code: "GV001",
        id: gv1,
      }),
      withDemoMarker({
        department_id: entityIds.departments.cntt,
        employee_code: "GV002",
        id: gv2,
      }),
      withDemoMarker({
        department_id: entityIds.departments.cntt,
        employee_code: "GV003",
        id: gv3,
      }),
    ],
    "Tao 3 ho so giang vien",
  );

  const studentClassMap: Record<string, string> = {
    SV001: entityIds.classes.ktpm21a,
    SV002: entityIds.classes.ktpm21a,
    SV003: entityIds.classes.ktpm21a,
    SV004: entityIds.classes.ktpm21b,
    SV005: entityIds.classes.ktpm21b,
    SV006: entityIds.classes.httt22a,
    SV007: entityIds.classes.httt22a,
    SV008: entityIds.classes.httt22a,
    SV009: entityIds.classes.ktpm21b,
    SV010: entityIds.classes.ktpm21a,
  };

  await insertRows(
    client,
    "students",
    STUDENT_ACCOUNTS.map((student) =>
      withDemoMarker({
        academic_class_id: studentClassMap[student.code],
        current_status: student.code === "SV006" ? "SUSPENDED" : "ACTIVE",
        enrollment_year: student.code.startsWith("SV00") ? 2021 : 2022,
        id: ids[student.code],
        student_code: student.code,
      }),
    ),
    "Tao 10 ho so sinh vien",
  );

  await insertRows(
    client,
    "course_offerings",
    [
      withDemoMarker({
        course_id: entityIds.courses.ltcb,
        created_by: adminId,
        id: entityIds.offerings.ltcbHistory,
        max_capacity: 50,
        registration_close_at: toIso("2023-09-10T23:59:59+07:00"),
        registration_open_at: toIso("2023-08-20T00:00:00+07:00"),
        section_code: "LT01",
        semester_id: entityIds.semesters.hk1,
        status: "FINISHED",
      }),
      withDemoMarker({
        course_id: entityIds.courses.ttcs,
        created_by: adminId,
        id: entityIds.offerings.ttcsHistory,
        max_capacity: 50,
        registration_close_at: toIso("2023-09-10T23:59:59+07:00"),
        registration_open_at: toIso("2023-08-20T00:00:00+07:00"),
        section_code: "TT01",
        semester_id: entityIds.semesters.hk1,
        status: "FINISHED",
      }),
      withDemoMarker({
        course_id: entityIds.courses.cnpm,
        created_by: adminId,
        id: entityIds.offerings.hp1,
        max_capacity: 40,
        registration_close_at: toIso("2026-12-31T23:59:59+07:00"),
        registration_open_at: toIso("2026-03-01T00:00:00+07:00"),
        section_code: "HP1",
        semester_id: entityIds.semesters.hk2,
        status: "OPEN",
      }),
      withDemoMarker({
        course_id: entityIds.courses.csdl,
        created_by: adminId,
        id: entityIds.offerings.hp2,
        max_capacity: 40,
        registration_close_at: toIso("2026-12-31T23:59:59+07:00"),
        registration_open_at: toIso("2026-03-01T00:00:00+07:00"),
        section_code: "HP2",
        semester_id: entityIds.semesters.hk2,
        status: "OPEN",
      }),
      withDemoMarker({
        course_id: entityIds.courses.ctdl,
        created_by: adminId,
        id: entityIds.offerings.hp3,
        max_capacity: 2,
        registration_close_at: toIso("2026-12-31T23:59:59+07:00"),
        registration_open_at: toIso("2026-03-01T00:00:00+07:00"),
        section_code: "HP3",
        semester_id: entityIds.semesters.hk2,
        status: "OPEN",
      }),
      withDemoMarker({
        course_id: entityIds.courses.mmt,
        created_by: adminId,
        id: entityIds.offerings.hp4,
        max_capacity: 35,
        registration_close_at: toIso("2026-03-20T23:59:59+07:00"),
        registration_open_at: toIso("2026-03-01T00:00:00+07:00"),
        section_code: "HP4",
        semester_id: entityIds.semesters.hk2,
        status: "CLOSED",
      }),
      withDemoMarker({
        course_id: entityIds.courses.ltoop,
        created_by: adminId,
        id: entityIds.offerings.hp5,
        max_capacity: 40,
        registration_close_at: toIso("2026-12-31T23:59:59+07:00"),
        registration_open_at: toIso("2026-03-01T00:00:00+07:00"),
        section_code: "HP5",
        semester_id: entityIds.semesters.hk2,
        status: "OPEN",
      }),
      withDemoMarker({
        course_id: entityIds.courses.attt,
        created_by: adminId,
        id: entityIds.offerings.hp6,
        max_capacity: 40,
        registration_close_at: toIso("2026-06-01T23:59:59+07:00"),
        registration_open_at: toIso("2026-03-01T00:00:00+07:00"),
        section_code: "HP6",
        semester_id: entityIds.semesters.hk2,
        status: "CLOSED",
      }),
    ],
    "Tao 8 hoc phan mo (du trang thai test)",
  );

  await insertRows(
    client,
    "teaching_assignments",
    [
      withDemoMarker({
        assignment_role: "LECTURER",
        course_offering_id: entityIds.offerings.hp1,
        is_primary: true,
        lecturer_id: gv1,
      }),
      withDemoMarker({
        assignment_role: "LECTURER",
        course_offering_id: entityIds.offerings.hp5,
        is_primary: true,
        lecturer_id: gv1,
      }),
      withDemoMarker({
        assignment_role: "LECTURER",
        course_offering_id: entityIds.offerings.hp2,
        is_primary: true,
        lecturer_id: gv2,
      }),
      withDemoMarker({
        assignment_role: "LECTURER",
        course_offering_id: entityIds.offerings.hp6,
        is_primary: true,
        lecturer_id: gv2,
      }),
      withDemoMarker({
        assignment_role: "LECTURER",
        course_offering_id: entityIds.offerings.hp3,
        is_primary: true,
        lecturer_id: gv3,
      }),
      withDemoMarker({
        assignment_role: "LECTURER",
        course_offering_id: entityIds.offerings.hp4,
        is_primary: true,
        lecturer_id: gv3,
      }),
    ],
    "Phan cong giang vien cho hoc phan",
  );

  await insertRows(
    client,
    "schedules",
    [
      withDemoMarker({
        course_offering_id: entityIds.offerings.hp1,
        day_of_week: 2,
        end_date: "2026-06-30",
        end_time: "09:30",
        room_id: entityIds.rooms.a101,
        start_date: "2026-02-15",
        start_time: "07:30",
        week_pattern: "ALL",
      }),
      withDemoMarker({
        course_offering_id: entityIds.offerings.hp2,
        day_of_week: 4,
        end_date: "2026-06-30",
        end_time: "11:30",
        room_id: entityIds.rooms.a102,
        start_date: "2026-02-15",
        start_time: "09:30",
        week_pattern: "ALL",
      }),
      withDemoMarker({
        course_offering_id: entityIds.offerings.hp3,
        day_of_week: 2,
        end_date: "2026-06-30",
        end_time: "11:30",
        room_id: entityIds.rooms.a101,
        start_date: "2026-02-15",
        start_time: "09:40",
        week_pattern: "ALL",
      }),
      withDemoMarker({
        course_offering_id: entityIds.offerings.hp4,
        day_of_week: 3,
        end_date: "2026-06-30",
        end_time: "15:00",
        room_id: entityIds.rooms.b201,
        start_date: "2026-02-15",
        start_time: "13:00",
        week_pattern: "ALL",
      }),
      withDemoMarker({
        course_offering_id: entityIds.offerings.hp5,
        day_of_week: 5,
        end_date: "2026-06-30",
        end_time: "09:30",
        room_id: entityIds.rooms.b202,
        start_date: "2026-02-15",
        start_time: "07:30",
        week_pattern: "ALL",
      }),
      withDemoMarker({
        course_offering_id: entityIds.offerings.hp6,
        day_of_week: 6,
        end_date: "2026-06-30",
        end_time: "09:30",
        room_id: entityIds.rooms.c301,
        start_date: "2026-02-15",
        start_time: "07:30",
        week_pattern: "ALL",
      }),
    ],
    "Tao lich hoc (du de test room conflict khi tao lich moi)",
  );

  const enrollmentIds = {
    sv001Hp2: randomUUID(),
    sv002LtcbHistory: randomUUID(),
    sv002TtcsHistory: randomUUID(),
    sv003Hp1: randomUUID(),
    sv003Hp5: randomUUID(),
    sv003Hp6: randomUUID(),
    sv003LtcbHistory: randomUUID(),
    sv004Hp5: randomUUID(),
    sv004Hp6: randomUUID(),
    sv004LtcbHistory: randomUUID(),
    sv005Hp6: randomUUID(),
    sv005LtcbHistory: randomUUID(),
    sv007Hp3: randomUUID(),
    sv008Hp3: randomUUID(),
    sv009Hp1: randomUUID(),
  };

  await insertRows(
    client,
    "enrollments",
    [
      withDemoMarker({
        approved_by: adminId,
        course_offering_id: entityIds.offerings.ltcbHistory,
        enrolled_at: toIso("2023-09-01T08:00:00+07:00"),
        id: enrollmentIds.sv003LtcbHistory,
        status: "COMPLETED",
        student_id: ids.SV003,
      }),
      withDemoMarker({
        approved_by: adminId,
        course_offering_id: entityIds.offerings.ltcbHistory,
        enrolled_at: toIso("2023-09-01T08:05:00+07:00"),
        id: enrollmentIds.sv004LtcbHistory,
        status: "COMPLETED",
        student_id: ids.SV004,
      }),
      withDemoMarker({
        approved_by: adminId,
        course_offering_id: entityIds.offerings.ltcbHistory,
        enrolled_at: toIso("2023-09-01T08:10:00+07:00"),
        id: enrollmentIds.sv005LtcbHistory,
        status: "COMPLETED",
        student_id: ids.SV005,
      }),
      withDemoMarker({
        approved_by: adminId,
        course_offering_id: entityIds.offerings.ltcbHistory,
        enrolled_at: toIso("2023-09-01T08:15:00+07:00"),
        id: enrollmentIds.sv002LtcbHistory,
        status: "COMPLETED",
        student_id: ids.SV002,
      }),
      withDemoMarker({
        approved_by: adminId,
        course_offering_id: entityIds.offerings.ttcsHistory,
        enrolled_at: toIso("2023-09-05T08:15:00+07:00"),
        id: enrollmentIds.sv002TtcsHistory,
        status: "COMPLETED",
        student_id: ids.SV002,
      }),
      withDemoMarker({
        course_offering_id: entityIds.offerings.hp1,
        enrolled_at: toIso("2026-03-20T09:00:00+07:00"),
        id: enrollmentIds.sv003Hp1,
        status: "ENROLLED",
        student_id: ids.SV003,
      }),
      withDemoMarker({
        course_offering_id: entityIds.offerings.hp5,
        enrolled_at: toIso("2026-03-20T09:10:00+07:00"),
        id: enrollmentIds.sv003Hp5,
        status: "ENROLLED",
        student_id: ids.SV003,
      }),
      withDemoMarker({
        course_offering_id: entityIds.offerings.hp6,
        enrolled_at: toIso("2026-03-20T09:20:00+07:00"),
        id: enrollmentIds.sv003Hp6,
        status: "ENROLLED",
        student_id: ids.SV003,
      }),
      withDemoMarker({
        course_offering_id: entityIds.offerings.hp5,
        enrolled_at: toIso("2026-03-20T09:30:00+07:00"),
        id: enrollmentIds.sv004Hp5,
        status: "ENROLLED",
        student_id: ids.SV004,
      }),
      withDemoMarker({
        course_offering_id: entityIds.offerings.hp6,
        enrolled_at: toIso("2026-03-20T09:40:00+07:00"),
        id: enrollmentIds.sv004Hp6,
        status: "ENROLLED",
        student_id: ids.SV004,
      }),
      withDemoMarker({
        course_offering_id: entityIds.offerings.hp6,
        enrolled_at: toIso("2026-03-20T09:50:00+07:00"),
        id: enrollmentIds.sv005Hp6,
        status: "ENROLLED",
        student_id: ids.SV005,
      }),
      withDemoMarker({
        course_offering_id: entityIds.offerings.hp3,
        enrolled_at: toIso("2026-03-20T10:00:00+07:00"),
        id: enrollmentIds.sv007Hp3,
        status: "ENROLLED",
        student_id: ids.SV007,
      }),
      withDemoMarker({
        course_offering_id: entityIds.offerings.hp3,
        enrolled_at: toIso("2026-03-20T10:10:00+07:00"),
        id: enrollmentIds.sv008Hp3,
        status: "ENROLLED",
        student_id: ids.SV008,
      }),
      withDemoMarker({
        course_offering_id: entityIds.offerings.hp1,
        enrolled_at: toIso("2026-03-20T10:20:00+07:00"),
        id: enrollmentIds.sv009Hp1,
        status: "ENROLLED",
        student_id: ids.SV009,
      }),
      withDemoMarker({
        course_offering_id: entityIds.offerings.hp2,
        enrolled_at: toIso("2026-03-20T10:30:00+07:00"),
        id: enrollmentIds.sv001Hp2,
        status: "ENROLLED",
        student_id: ids.SV001,
      }),
    ],
    "Tao enrollments demo (du case dang ky/huy/full)",
  );

  const gradeIds = {
    sv002LtcbHistory: randomUUID(),
    sv002TtcsHistory: randomUUID(),
    sv003Hp5: randomUUID(),
    sv003LtcbHistory: randomUUID(),
    sv004Hp5: randomUUID(),
    sv004Hp6: randomUUID(),
    sv004LtcbHistory: randomUUID(),
    sv005Hp6: randomUUID(),
    sv005LtcbHistory: randomUUID(),
  };

  await insertRows(
    client,
    "grades",
    [
      withDemoMarker({
        attendance_score: 8,
        enrollment_id: enrollmentIds.sv003LtcbHistory,
        final_score: 8,
        id: gradeIds.sv003LtcbHistory,
        midterm_score: 7.5,
        status: "LOCKED",
      }),
      withDemoMarker({
        attendance_score: 7,
        enrollment_id: enrollmentIds.sv004LtcbHistory,
        final_score: 7,
        id: gradeIds.sv004LtcbHistory,
        midterm_score: 7,
        status: "APPROVED",
      }),
      withDemoMarker({
        attendance_score: 7.5,
        enrollment_id: enrollmentIds.sv005LtcbHistory,
        final_score: 7.5,
        id: gradeIds.sv005LtcbHistory,
        midterm_score: 7,
        status: "APPROVED",
      }),
      withDemoMarker({
        attendance_score: 3,
        enrollment_id: enrollmentIds.sv002LtcbHistory,
        final_score: 3.5,
        id: gradeIds.sv002LtcbHistory,
        midterm_score: 3,
        status: "APPROVED",
      }),
      withDemoMarker({
        attendance_score: 2,
        enrollment_id: enrollmentIds.sv002TtcsHistory,
        final_score: 2.5,
        id: gradeIds.sv002TtcsHistory,
        midterm_score: 2,
        status: "APPROVED",
      }),
      withDemoMarker({
        attendance_score: 8.5,
        enrollment_id: enrollmentIds.sv003Hp5,
        final_score: 8,
        id: gradeIds.sv003Hp5,
        midterm_score: 8,
        status: "SUBMITTED",
        submitted_by: gv1,
      }),
      withDemoMarker({
        attendance_score: 9,
        enrollment_id: enrollmentIds.sv004Hp5,
        final_score: 8.5,
        id: gradeIds.sv004Hp5,
        midterm_score: 8.5,
        status: "SUBMITTED",
        submitted_by: gv1,
      }),
      withDemoMarker({
        approved_by: adminId,
        attendance_score: 8.5,
        enrollment_id: enrollmentIds.sv004Hp6,
        final_score: 8.5,
        id: gradeIds.sv004Hp6,
        midterm_score: 8,
        status: "APPROVED",
      }),
      withDemoMarker({
        approved_by: adminId,
        attendance_score: 7.5,
        enrollment_id: enrollmentIds.sv005Hp6,
        final_score: 7.5,
        id: gradeIds.sv005Hp6,
        midterm_score: 7,
        status: "APPROVED",
      }),
    ],
    "Tao grades (SUBMITTED/APPROVED/LOCKED)",
  );

  await insertRows(
    client,
    "regrade_requests",
    [
      withDemoMarker({
        enrollment_id: enrollmentIds.sv005Hp6,
        grade_id: gradeIds.sv005Hp6,
        previous_total_score: null,
        reason: "De nghi kiem tra lai diem cuoi ky.",
        status: "PENDING",
        student_id: ids.SV005,
      }),
    ],
    "Tao 1 yeu cau phuc khao PENDING",
  );

  await syncOfferingEnrollmentCounts(client, [
    entityIds.offerings.hp1,
    entityIds.offerings.hp2,
    entityIds.offerings.hp3,
    entityIds.offerings.hp4,
    entityIds.offerings.hp5,
    entityIds.offerings.hp6,
    entityIds.offerings.ltcbHistory,
    entityIds.offerings.ttcsHistory,
  ]);

  logDone("SV006 duoc tao san voi status INACTIVE de test middleware/auth");

  console.info("");
  console.info("Bang tai khoan demo:");
  console.table(
    ALL_ACCOUNTS.map((account) => ({
      email: account.email,
      password: account.password,
      role: account.role,
      status: account.status ?? "ACTIVE",
      user_code: account.code,
    })),
  );

  console.info("");
  logDone(`Seed demo batch "${DEMO_BATCH}" hoan tat`);
  console.info(
    "Ban co the test nhanh: /admin/offerings, /student/enrollment, /lecturer/grades/[offeringId], /admin/grades, /student/grades, /admin/reports",
  );
}

async function main() {
  const client = createServiceRoleClient();
  const shouldClearOnly = process.argv.includes("--clear");

  if (shouldClearOnly) {
    await clearAll(client);
    return;
  }

  await seedAll(client);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
