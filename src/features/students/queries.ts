import { createClient } from "@/lib/supabase/server";

export type StudentRecord = {
  academic_class_id: string;
  access_status: "ACTIVE" | "INACTIVE" | "LOCKED";
  address: string | null;
  current_status: "ACTIVE" | "SUSPENDED" | "GRADUATED" | "DROPPED";
  date_of_birth: string | null;
  email: string;
  emergency_contact: string | null;
  enrollment_year: number;
  full_name: string;
  gender: string | null;
  id: string;
  phone: string | null;
  student_code: string;
};

export async function listStudents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      `
        id,
        student_code,
        academic_class_id,
        enrollment_year,
        current_status,
        gender,
        date_of_birth,
        address,
        emergency_contact,
        profile:profiles!inner(
          email,
          full_name,
          phone,
          status
        )
      `,
    )
    .order("student_code", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{
    academic_class_id: string;
    address: string | null;
    current_status: "ACTIVE" | "SUSPENDED" | "GRADUATED" | "DROPPED";
    date_of_birth: string | null;
    emergency_contact: string | null;
    enrollment_year: number;
    gender: string | null;
    id: string;
    profile: {
      email: string;
      full_name: string;
      phone: string | null;
      status: "ACTIVE" | "INACTIVE" | "LOCKED";
    };
    student_code: string;
  }>;

  return rows.map((item) => ({
    academic_class_id: item.academic_class_id,
    access_status: item.profile.status,
    address: item.address,
    current_status: item.current_status,
    date_of_birth: item.date_of_birth,
    email: item.profile.email,
    emergency_contact: item.emergency_contact,
    enrollment_year: item.enrollment_year,
    full_name: item.profile.full_name,
    gender: item.gender,
    id: item.id,
    phone: item.profile.phone,
    student_code: item.student_code,
  })) satisfies StudentRecord[];
}

export async function getStudentById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      `
        id,
        student_code,
        academic_class_id,
        enrollment_year,
        current_status,
        gender,
        date_of_birth,
        address,
        emergency_contact,
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
    academic_class_id: string;
    address: string | null;
    current_status: "ACTIVE" | "SUSPENDED" | "GRADUATED" | "DROPPED";
    date_of_birth: string | null;
    emergency_contact: string | null;
    enrollment_year: number;
    gender: string | null;
    id: string;
    profile: {
      email: string;
      full_name: string;
      phone: string | null;
      status: "ACTIVE" | "INACTIVE" | "LOCKED";
    };
    student_code: string;
  };

  return {
    academic_class_id: item.academic_class_id,
    access_status: item.profile.status,
    address: item.address,
    current_status: item.current_status,
    date_of_birth: item.date_of_birth,
    email: item.profile.email,
    emergency_contact: item.emergency_contact,
    enrollment_year: item.enrollment_year,
    full_name: item.profile.full_name,
    gender: item.gender,
    id: item.id,
    phone: item.profile.phone,
    student_code: item.student_code,
  } satisfies StudentRecord;
}
