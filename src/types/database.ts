export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      academic_classes: {
        Row: {
          code: string;
          cohort_year: number;
          created_at: string;
          created_by: string | null;
          demo_batch: string | null;
          id: string;
          is_active: boolean;
          is_demo: boolean;
          major_id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          cohort_year: number;
          created_at?: string;
          created_by?: string | null;
          demo_batch?: string | null;
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          major_id: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          cohort_year?: number;
          created_at?: string;
          created_by?: string | null;
          demo_batch?: string | null;
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          major_id?: string;
          name?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_role: string | null;
          created_at: string;
          demo_batch: string | null;
          entity_id: string | null;
          entity_type: string;
          id: number;
          ip_address: string | null;
          is_demo: boolean;
          metadata: Json;
          target_user_id: string | null;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_role?: string | null;
          created_at?: string;
          demo_batch?: string | null;
          entity_id?: string | null;
          entity_type: string;
          id?: number;
          ip_address?: string | null;
          is_demo?: boolean;
          metadata?: Json;
          target_user_id?: string | null;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_role?: string | null;
          created_at?: string;
          demo_batch?: string | null;
          entity_id?: string | null;
          entity_type?: string;
          id?: number;
          ip_address?: string | null;
          is_demo?: boolean;
          metadata?: Json;
          target_user_id?: string | null;
          user_agent?: string | null;
        };
      };
      course_offerings: {
        Row: {
          attendance_weight: number;
          course_id: string;
          created_at: string;
          created_by: string | null;
          demo_batch: string | null;
          enrolled_count: number;
          final_weight: number;
          id: string;
          is_demo: boolean;
          max_capacity: number;
          midterm_weight: number;
          notes: string | null;
          passing_score: number;
          registration_close_at: string;
          registration_open_at: string;
          section_code: string;
          semester_id: string;
          status: Database["public"]["Enums"]["offering_status"];
          title: string | null;
          updated_at: string;
        };
        Insert: {
          attendance_weight?: number;
          course_id: string;
          created_at?: string;
          created_by?: string | null;
          demo_batch?: string | null;
          enrolled_count?: number;
          final_weight?: number;
          id?: string;
          is_demo?: boolean;
          max_capacity: number;
          midterm_weight?: number;
          notes?: string | null;
          passing_score?: number;
          registration_close_at: string;
          registration_open_at: string;
          section_code: string;
          semester_id: string;
          status?: Database["public"]["Enums"]["offering_status"];
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          attendance_weight?: number;
          course_id?: string;
          created_at?: string;
          created_by?: string | null;
          demo_batch?: string | null;
          enrolled_count?: number;
          final_weight?: number;
          id?: string;
          is_demo?: boolean;
          max_capacity?: number;
          midterm_weight?: number;
          notes?: string | null;
          passing_score?: number;
          registration_close_at?: string;
          registration_open_at?: string;
          section_code?: string;
          semester_id?: string;
          status?: Database["public"]["Enums"]["offering_status"];
          title?: string | null;
          updated_at?: string;
        };
      };
      course_prerequisites: {
        Row: {
          course_id: string;
          created_at: string;
          minimum_score: number;
          prerequisite_course_id: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          minimum_score?: number;
          prerequisite_course_id: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          minimum_score?: number;
          prerequisite_course_id?: string;
        };
      };
      courses: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          credit_hours: number;
          demo_batch: string | null;
          department_id: string;
          description: string | null;
          id: string;
          is_active: boolean;
          is_demo: boolean;
          name: string;
          total_sessions: number;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          credit_hours: number;
          demo_batch?: string | null;
          department_id: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          name: string;
          total_sessions?: number;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          credit_hours?: number;
          demo_batch?: string | null;
          department_id?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          name?: string;
          total_sessions?: number;
          updated_at?: string;
        };
      };
      departments: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          demo_batch: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          is_demo: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          demo_batch?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          name: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          demo_batch?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          name?: string;
          updated_at?: string;
        };
      };
      enrollments: {
        Row: {
          approved_by: string | null;
          course_offering_id: string;
          created_at: string;
          demo_batch: string | null;
          drop_reason: string | null;
          dropped_at: string | null;
          enrolled_at: string;
          id: string;
          is_demo: boolean;
          status: Database["public"]["Enums"]["enrollment_status"];
          student_id: string;
          updated_at: string;
        };
        Insert: {
          approved_by?: string | null;
          course_offering_id: string;
          created_at?: string;
          demo_batch?: string | null;
          drop_reason?: string | null;
          dropped_at?: string | null;
          enrolled_at?: string;
          id?: string;
          is_demo?: boolean;
          status?: Database["public"]["Enums"]["enrollment_status"];
          student_id: string;
          updated_at?: string;
        };
        Update: {
          approved_by?: string | null;
          course_offering_id?: string;
          created_at?: string;
          demo_batch?: string | null;
          drop_reason?: string | null;
          dropped_at?: string | null;
          enrolled_at?: string;
          id?: string;
          is_demo?: boolean;
          status?: Database["public"]["Enums"]["enrollment_status"];
          student_id?: string;
          updated_at?: string;
        };
      };
      grade_change_logs: {
        Row: {
          change_type: string;
          changed_by: string | null;
          created_at: string;
          demo_batch: string | null;
          grade_id: string;
          id: string;
          is_demo: boolean;
          new_payload: Json;
          note: string | null;
          old_payload: Json;
        };
        Insert: {
          change_type: string;
          changed_by?: string | null;
          created_at?: string;
          demo_batch?: string | null;
          grade_id: string;
          id?: string;
          is_demo?: boolean;
          new_payload?: Json;
          note?: string | null;
          old_payload?: Json;
        };
        Update: {
          change_type?: string;
          changed_by?: string | null;
          created_at?: string;
          demo_batch?: string | null;
          grade_id?: string;
          id?: string;
          is_demo?: boolean;
          new_payload?: Json;
          note?: string | null;
          old_payload?: Json;
        };
      };
      grades: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          attendance_score: number | null;
          created_at: string;
          demo_batch: string | null;
          enrollment_id: string;
          final_score: number | null;
          gpa_value: number | null;
          id: string;
          is_demo: boolean;
          letter_grade: string | null;
          locked_at: string | null;
          locked_by: string | null;
          midterm_score: number | null;
          remark: string | null;
          status: Database["public"]["Enums"]["grade_status"];
          submitted_at: string | null;
          submitted_by: string | null;
          total_score: number | null;
          updated_at: string;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          attendance_score?: number | null;
          created_at?: string;
          demo_batch?: string | null;
          enrollment_id: string;
          final_score?: number | null;
          gpa_value?: number | null;
          id?: string;
          is_demo?: boolean;
          letter_grade?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          midterm_score?: number | null;
          remark?: string | null;
          status?: Database["public"]["Enums"]["grade_status"];
          submitted_at?: string | null;
          submitted_by?: string | null;
          total_score?: number | null;
          updated_at?: string;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          attendance_score?: number | null;
          created_at?: string;
          demo_batch?: string | null;
          enrollment_id?: string;
          final_score?: number | null;
          gpa_value?: number | null;
          id?: string;
          is_demo?: boolean;
          letter_grade?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          midterm_score?: number | null;
          remark?: string | null;
          status?: Database["public"]["Enums"]["grade_status"];
          submitted_at?: string | null;
          submitted_by?: string | null;
          total_score?: number | null;
          updated_at?: string;
        };
      };
      lecturers: {
        Row: {
          academic_title: string | null;
          bio: string | null;
          created_at: string;
          department_id: string;
          demo_batch: string | null;
          employee_code: string;
          hire_date: string | null;
          id: string;
          is_demo: boolean;
          office_location: string | null;
          updated_at: string;
        };
        Insert: {
          academic_title?: string | null;
          bio?: string | null;
          created_at?: string;
          department_id: string;
          demo_batch?: string | null;
          employee_code: string;
          hire_date?: string | null;
          id: string;
          is_demo?: boolean;
          office_location?: string | null;
          updated_at?: string;
        };
        Update: {
          academic_title?: string | null;
          bio?: string | null;
          created_at?: string;
          department_id?: string;
          demo_batch?: string | null;
          employee_code?: string;
          hire_date?: string | null;
          id?: string;
          is_demo?: boolean;
          office_location?: string | null;
          updated_at?: string;
        };
      };
      majors: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          degree_level: string;
          demo_batch: string | null;
          department_id: string;
          id: string;
          is_active: boolean;
          is_demo: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          degree_level?: string;
          demo_batch?: string | null;
          department_id: string;
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          name: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          degree_level?: string;
          demo_batch?: string | null;
          department_id?: string;
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          name?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          demo_batch: string | null;
          email: string;
          full_name: string;
          id: string;
          is_demo: boolean;
          metadata: Json;
          must_change_password: boolean;
          phone: string | null;
          role_code: string;
          status: Database["public"]["Enums"]["profile_status"];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          demo_batch?: string | null;
          email: string;
          full_name: string;
          id: string;
          is_demo?: boolean;
          metadata?: Json;
          must_change_password?: boolean;
          phone?: string | null;
          role_code: string;
          status?: Database["public"]["Enums"]["profile_status"];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          demo_batch?: string | null;
          email?: string;
          full_name?: string;
          id?: string;
          is_demo?: boolean;
          metadata?: Json;
          must_change_password?: boolean;
          phone?: string | null;
          role_code?: string;
          status?: Database["public"]["Enums"]["profile_status"];
          updated_at?: string;
        };
      };
      regrade_requests: {
        Row: {
          created_at: string;
          demo_batch: string | null;
          enrollment_id: string;
          grade_id: string;
          id: string;
          is_demo: boolean;
          previous_total_score: number | null;
          reason: string;
          resolution_note: string | null;
          resolved_total_score: number | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["regrade_status"];
          student_id: string;
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          demo_batch?: string | null;
          enrollment_id: string;
          grade_id: string;
          id?: string;
          is_demo?: boolean;
          previous_total_score?: number | null;
          reason: string;
          resolution_note?: string | null;
          resolved_total_score?: number | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["regrade_status"];
          student_id: string;
          submitted_at?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          demo_batch?: string | null;
          enrollment_id?: string;
          grade_id?: string;
          id?: string;
          is_demo?: boolean;
          previous_total_score?: number | null;
          reason?: string;
          resolution_note?: string | null;
          resolved_total_score?: number | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["regrade_status"];
          student_id?: string;
          submitted_at?: string;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          code: string;
          description: string | null;
          name: string;
        };
        Insert: {
          code: string;
          description?: string | null;
          name: string;
        };
        Update: {
          code?: string;
          description?: string | null;
          name?: string;
        };
      };
      rooms: {
        Row: {
          building: string | null;
          capacity: number;
          code: string;
          created_at: string;
          created_by: string | null;
          demo_batch: string | null;
          id: string;
          is_active: boolean;
          is_demo: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          building?: string | null;
          capacity: number;
          code: string;
          created_at?: string;
          created_by?: string | null;
          demo_batch?: string | null;
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          name: string;
          updated_at?: string;
        };
        Update: {
          building?: string | null;
          capacity?: number;
          code?: string;
          created_at?: string;
          created_by?: string | null;
          demo_batch?: string | null;
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          name?: string;
          updated_at?: string;
        };
      };
      schedules: {
        Row: {
          active_date_range: unknown;
          course_offering_id: string;
          created_at: string;
          demo_batch: string | null;
          day_of_week: number;
          end_date: string | null;
          end_time: string;
          id: string;
          is_demo: boolean;
          note: string | null;
          room_id: string | null;
          start_date: string | null;
          start_time: string;
          time_range: unknown;
          updated_at: string;
          week_pattern: string;
        };
        Insert: {
          course_offering_id: string;
          created_at?: string;
          demo_batch?: string | null;
          day_of_week: number;
          end_date?: string | null;
          end_time: string;
          id?: string;
          is_demo?: boolean;
          note?: string | null;
          room_id?: string | null;
          start_date?: string | null;
          start_time: string;
          updated_at?: string;
          week_pattern?: string;
        };
        Update: {
          course_offering_id?: string;
          created_at?: string;
          demo_batch?: string | null;
          day_of_week?: number;
          end_date?: string | null;
          end_time?: string;
          id?: string;
          is_demo?: boolean;
          note?: string | null;
          room_id?: string | null;
          start_date?: string | null;
          start_time?: string;
          updated_at?: string;
          week_pattern?: string;
        };
      };
      semesters: {
        Row: {
          academic_year: string;
          code: string;
          created_at: string;
          created_by: string | null;
          demo_batch: string | null;
          end_date: string;
          enrollment_end: string;
          enrollment_start: string;
          id: string;
          is_current: boolean;
          is_demo: boolean;
          max_credits: number;
          name: string;
          regrade_close_at: string | null;
          regrade_open_at: string | null;
          start_date: string;
          updated_at: string;
        };
        Insert: {
          academic_year: string;
          code: string;
          created_at?: string;
          created_by?: string | null;
          demo_batch?: string | null;
          end_date: string;
          enrollment_end: string;
          enrollment_start: string;
          id?: string;
          is_current?: boolean;
          is_demo?: boolean;
          max_credits?: number;
          name: string;
          regrade_close_at?: string | null;
          regrade_open_at?: string | null;
          start_date: string;
          updated_at?: string;
        };
        Update: {
          academic_year?: string;
          code?: string;
          created_at?: string;
          created_by?: string | null;
          demo_batch?: string | null;
          end_date?: string;
          enrollment_end?: string;
          enrollment_start?: string;
          id?: string;
          is_current?: boolean;
          is_demo?: boolean;
          max_credits?: number;
          name?: string;
          regrade_close_at?: string | null;
          regrade_open_at?: string | null;
          start_date?: string;
          updated_at?: string;
        };
      };
      students: {
        Row: {
          academic_class_id: string;
          address: string | null;
          created_at: string;
          current_status: Database["public"]["Enums"]["student_status"];
          date_of_birth: string | null;
          demo_batch: string | null;
          emergency_contact: string | null;
          enrollment_year: number;
          gender: string | null;
          id: string;
          is_demo: boolean;
          student_code: string;
          updated_at: string;
        };
        Insert: {
          academic_class_id: string;
          address?: string | null;
          created_at?: string;
          current_status?: Database["public"]["Enums"]["student_status"];
          date_of_birth?: string | null;
          demo_batch?: string | null;
          emergency_contact?: string | null;
          enrollment_year: number;
          gender?: string | null;
          id: string;
          is_demo?: boolean;
          student_code: string;
          updated_at?: string;
        };
        Update: {
          academic_class_id?: string;
          address?: string | null;
          created_at?: string;
          current_status?: Database["public"]["Enums"]["student_status"];
          date_of_birth?: string | null;
          demo_batch?: string | null;
          emergency_contact?: string | null;
          enrollment_year?: number;
          gender?: string | null;
          id?: string;
          is_demo?: boolean;
          student_code?: string;
          updated_at?: string;
        };
      };
      teaching_assignments: {
        Row: {
          assignment_role: string;
          course_offering_id: string;
          created_at: string;
          demo_batch: string | null;
          id: string;
          is_demo: boolean;
          is_primary: boolean;
          lecturer_id: string;
        };
        Insert: {
          assignment_role?: string;
          course_offering_id: string;
          created_at?: string;
          demo_batch?: string | null;
          id?: string;
          is_demo?: boolean;
          is_primary?: boolean;
          lecturer_id: string;
        };
        Update: {
          assignment_role?: string;
          course_offering_id?: string;
          created_at?: string;
          demo_batch?: string | null;
          id?: string;
          is_demo?: boolean;
          is_primary?: boolean;
          lecturer_id?: string;
        };
      };
    };
    Views: {
      report_academic_warnings: {
        Row: {
          class_code: string | null;
          completed_credits: number | null;
          cumulative_gpa4: number | null;
          cumulative_score10: number | null;
          student_code: string | null;
          student_id: string | null;
          student_name: string | null;
        };
      };
      report_class_gpa_average: {
        Row: {
          academic_class_id: string | null;
          average_gpa4: number | null;
          average_score10: number | null;
          class_code: string | null;
          class_name: string | null;
          semester_id: string | null;
          semester_name: string | null;
        };
      };
      report_course_pass_rate: {
        Row: {
          course_code: string | null;
          course_id: string | null;
          course_name: string | null;
          pass_rate: number | null;
          total_completed: number | null;
          total_failed: number | null;
          total_passed: number | null;
        };
      };
      report_student_distribution: {
        Row: {
          academic_class_code: string | null;
          academic_class_id: string | null;
          academic_class_name: string | null;
          department_code: string | null;
          department_id: string | null;
          department_name: string | null;
          major_code: string | null;
          major_id: string | null;
          major_name: string | null;
          total_students: number | null;
        };
      };
    };
    Functions: {
      calculate_student_cumulative_gpa4: {
        Args: {
          p_student_id: string;
        };
        Returns: number;
      };
      calculate_student_cumulative_score10: {
        Args: {
          p_student_id: string;
        };
        Returns: number;
      };
      can_read_course_offering: {
        Args: {
          p_offering_id: string;
        };
        Returns: boolean;
      };
      can_student_view_offering: {
        Args: {
          p_offering_id: string;
        };
        Returns: boolean;
      };
      cancel_enrollment: {
        Args: {
          p_enrollment_id: string;
          p_reason?: string | null;
        };
        Returns: boolean;
      };
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_current_user_active: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_lecturer_assigned: {
        Args: {
          p_offering_id: string;
        };
        Returns: boolean;
      };
      log_audit_event: {
        Args: {
          p_action: string;
          p_entity_id?: string | null;
          p_entity_type: string;
          p_metadata?: Json;
          p_target_user_id?: string | null;
        };
        Returns: number;
      };
      register_enrollment: {
        Args: {
          p_offering_id: string;
        };
        Returns: string;
      };
      upsert_course_offering_with_assignment: {
        Args: {
          p_attendance_weight: number;
          p_course_id: string;
          p_final_weight: number;
          p_lecturer_id: string | null;
          p_max_capacity: number;
          p_midterm_weight: number;
          p_notes: string | null;
          p_offering_id: string | null;
          p_passing_score: number;
          p_registration_close_at: string;
          p_registration_open_at: string;
          p_section_code: string;
          p_semester_id: string;
          p_status: Database["public"]["Enums"]["offering_status"];
          p_title: string | null;
        };
        Returns: string;
      };
      upsert_course_with_prerequisites: {
        Args: {
          p_code: string;
          p_course_id: string | null;
          p_credit_hours: number;
          p_department_id: string;
          p_description: string | null;
          p_is_active: boolean;
          p_name: string;
          p_prerequisite_codes?: string[] | null;
          p_total_sessions: number;
        };
        Returns: string;
      };
    };
    Enums: {
      enrollment_status: "COMPLETED" | "DROPPED" | "ENROLLED";
      grade_status: "APPROVED" | "DRAFT" | "LOCKED" | "SUBMITTED";
      offering_status:
        | "CANCELLED"
        | "CLOSED"
        | "DRAFT"
        | "FINISHED"
        | "OPEN";
      profile_status: "ACTIVE" | "INACTIVE" | "LOCKED";
      regrade_status:
        | "CANCELLED"
        | "PENDING"
        | "REJECTED"
        | "RESOLVED"
        | "UNDER_REVIEW";
      student_status: "ACTIVE" | "DROPPED" | "GRADUATED" | "SUSPENDED";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never;

export type Views<
  PublicViewNameOrOptions extends
    | keyof Database["public"]["Views"]
    | { schema: keyof Database },
  ViewName extends PublicViewNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicViewNameOrOptions["schema"]]["Views"]
    : never = never,
> = PublicViewNameOrOptions extends { schema: keyof Database }
  ? Database[PublicViewNameOrOptions["schema"]]["Views"][ViewName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicViewNameOrOptions extends keyof Database["public"]["Views"]
    ? Database["public"]["Views"][PublicViewNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;
