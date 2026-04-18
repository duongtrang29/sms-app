import { createClient } from "@/lib/supabase/server";

export type LecturerRecord = {
  academic_title: string | null;
  department_id: string;
  email: string;
  employee_code: string;
  full_name: string;
  hire_date: string | null;
  id: string;
  office_location: string | null;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE" | "LOCKED";
};

type LecturerRow = {
  academic_title: string | null;
  department_id: string;
  employee_code: string;
  hire_date: string | null;
  id: string;
  office_location: string | null;
  profile: {
    email: string;
    full_name: string;
    phone: string | null;
    status: "ACTIVE" | "INACTIVE" | "LOCKED";
  };
};

function mapLecturerRow(item: LecturerRow) {
  return {
    academic_title: item.academic_title,
    department_id: item.department_id,
    email: item.profile.email,
    employee_code: item.employee_code,
    full_name: item.profile.full_name,
    hire_date: item.hire_date,
    id: item.id,
    office_location: item.office_location,
    phone: item.profile.phone,
    status: item.profile.status,
  } satisfies LecturerRecord;
}

export async function listLecturers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lecturers")
    .select(
      `
        id,
        employee_code,
        department_id,
        academic_title,
        hire_date,
        office_location,
        profile:profiles!inner(
          email,
          full_name,
          phone,
          status
        )
      `,
    )
    .order("employee_code", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as LecturerRow[];
  return rows.map(mapLecturerRow);
}

export async function listLecturersByIds(ids: string[]) {
  if (!ids.length) {
    return [] as LecturerRecord[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lecturers")
    .select(
      `
        id,
        employee_code,
        department_id,
        academic_title,
        hire_date,
        office_location,
        profile:profiles!inner(
          email,
          full_name,
          phone,
          status
        )
      `,
    )
    .in("id", ids as never)
    .order("employee_code", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as LecturerRow[]).map(mapLecturerRow);
}

export async function getLecturerById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lecturers")
    .select(
      `
        id,
        employee_code,
        department_id,
        academic_title,
        hire_date,
        office_location,
        profile:profiles!inner(
          email,
          full_name,
          phone,
          status
        )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const item = data as {
    academic_title: string | null;
    department_id: string;
    employee_code: string;
    hire_date: string | null;
    id: string;
    office_location: string | null;
    profile: {
      email: string;
      full_name: string;
      phone: string | null;
      status: "ACTIVE" | "INACTIVE" | "LOCKED";
    };
  };

  return {
    academic_title: item.academic_title,
    department_id: item.department_id,
    email: item.profile.email,
    employee_code: item.employee_code,
    full_name: item.profile.full_name,
    hire_date: item.hire_date,
    id: item.id,
    office_location: item.office_location,
    phone: item.profile.phone,
    status: item.profile.status,
  } satisfies LecturerRecord;
}
