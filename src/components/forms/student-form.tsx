"use client";

import { useActionState, useEffect, useMemo, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { FormAlert } from "@/components/forms/form-alert";
import {
  FormContainer,
  FormGrid,
  FormSection,
  FormStickyFooter,
} from "@/components/forms/form-container";
import { SubmitButton } from "@/components/forms/submit-button";
import { RelationSelect } from "@/components/forms/relation-select";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertStudentAction } from "@/features/students/actions";
import { studentSchema, type StudentInput } from "@/features/students/schemas";
import { initialActionState } from "@/lib/actions";
import { useApplyServerFormErrors } from "@/lib/form-errors-client";
import { mapOptions } from "@/lib/options";
import type { AcademicClass } from "@/types/app";
import type { StudentRecord } from "@/features/students/queries";
import type { FormMode } from "@/types/forms";

type StudentFormProps = {
  academicClasses: AcademicClass[];
  student?: StudentRecord | null;
  returnTo?: string;
};

const EMPTY_STUDENT_VALUES: StudentInput = {
  academic_class_id: "",
  access_status: "ACTIVE",
  address: "",
  current_status: "ACTIVE",
  date_of_birth: "",
  email: "",
  emergency_contact: "",
  enrollment_year: new Date().getFullYear(),
  full_name: "",
  gender: undefined,
  id: undefined,
  password: "",
  phone: "",
  student_code: "",
};

function mapStudentToFormValues(
  student: StudentRecord | null | undefined,
  fallbackAcademicClassId: string,
): StudentInput {
  if (!student) {
    return {
      ...EMPTY_STUDENT_VALUES,
      academic_class_id: fallbackAcademicClassId,
    };
  }

  return {
    academic_class_id: student.academic_class_id ?? fallbackAcademicClassId,
    access_status: student.access_status,
    address: student.address ?? "",
    current_status: student.current_status,
    date_of_birth: student.date_of_birth ?? "",
    email: student.email ?? "",
    emergency_contact: student.emergency_contact ?? "",
    enrollment_year: student.enrollment_year ?? new Date().getFullYear(),
    full_name: student.full_name ?? "",
    gender:
      student.gender === "MALE" ||
      student.gender === "FEMALE" ||
      student.gender === "OTHER"
        ? student.gender
        : undefined,
    id: student.id,
    password: "",
    phone: student.phone ?? "",
    student_code: student.student_code ?? "",
  };
}

export function StudentForm({
  academicClasses,
  student,
  returnTo = "/admin/students",
}: StudentFormProps) {
  const [state, submitAction] = useActionState(
    upsertStudentAction,
    initialActionState,
  );
  const [isPending, startTransition] = useTransition();
  const mode: FormMode = student ? "edit" : "create";
  const academicClassOptions = useMemo(
    () =>
      mapOptions(
        academicClasses,
        (academicClass) => `${academicClass.code} - ${academicClass.name}`,
        (academicClass) => academicClass.id,
      ),
    [academicClasses],
  );
  const formValues = useMemo(
    () => mapStudentToFormValues(student, academicClassOptions[0]?.value ?? ""),
    [academicClassOptions, student],
  );
  const form = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: EMPTY_STUDENT_VALUES,
    reValidateMode: "onChange",
  });
  useApplyServerFormErrors(form, state.errors);
  const academicClassId = useWatch({
    control: form.control,
    name: "academic_class_id",
  });
  const gender = useWatch({
    control: form.control,
    name: "gender",
  });
  const accessStatus = useWatch({
    control: form.control,
    name: "access_status",
  });
  const currentStatus = useWatch({
    control: form.control,
    name: "current_status",
  });

  useEffect(() => {
    form.reset(formValues);
  }, [form, formValues, mode]);

  useEffect(() => {
    if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state.message, state.success]);

  return (
    <form
      className="flex flex-col"
      onSubmit={form.handleSubmit((values) => {
        const payload = new FormData();
        payload.set("return_to", returnTo);
        if (values.id) {
          payload.set("id", values.id);
        }
        payload.set("academic_class_id", values.academic_class_id);
        payload.set("access_status", values.access_status);
        payload.set("current_status", values.current_status);
        payload.set("email", values.email);
        payload.set("full_name", values.full_name);
        payload.set("student_code", values.student_code);
        payload.set("enrollment_year", String(values.enrollment_year));
        payload.set("address", values.address ?? "");
        payload.set("date_of_birth", values.date_of_birth ?? "");
        payload.set("emergency_contact", values.emergency_contact ?? "");
        payload.set("phone", values.phone ?? "");
        if (values.gender) {
          payload.set("gender", values.gender);
        }
        if (values.password) {
          payload.set("password", values.password);
        }

        startTransition(() => submitAction(payload));
      })}
    >
      <FormContainer>
        <FormSection
          description="Thông tin định danh, lớp sinh hoạt và dữ liệu học tập cốt lõi của sinh viên."
          title="Thông Tin Cơ Bản"
        >
          <FormGrid>
            <Field data-invalid={!!form.formState.errors.academic_class_id}>
              <FieldLabel>Lớp sinh hoạt</FieldLabel>
              <FieldContent>
                <RelationSelect
                  onValueChange={(value) => {
                    if (!value) {
                      return;
                    }

                    form.setValue("academic_class_id", value, {
                      shouldValidate: true,
                    });
                  }}
                  options={academicClassOptions}
                  placeholder="Chọn lớp sinh hoạt"
                  value={academicClassId}
                />
                <FieldError errors={[form.formState.errors.academic_class_id]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.enrollment_year}>
              <FieldLabel htmlFor="student-enrollment-year">Năm nhập học</FieldLabel>
              <FieldContent>
                <Input
                  id="student-enrollment-year"
                  type="number"
                  {...form.register("enrollment_year", { valueAsNumber: true })}
                />
                <FieldError errors={[form.formState.errors.enrollment_year]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.student_code}>
              <FieldLabel htmlFor="student-code">MSSV</FieldLabel>
              <FieldContent>
                <Input
                  autoComplete="off"
                  id="student-code"
                  spellCheck={false}
                  {...form.register("student_code")}
                />
                <FieldError errors={[form.formState.errors.student_code]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.full_name}>
              <FieldLabel htmlFor="student-full-name">Họ tên</FieldLabel>
              <FieldContent>
                <Input id="student-full-name" {...form.register("full_name")} />
                <FieldError errors={[form.formState.errors.full_name]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.email}>
              <FieldLabel htmlFor="student-email">Email</FieldLabel>
              <FieldContent>
                <Input
                  autoComplete="email"
                  id="student-email"
                  spellCheck={false}
                  type="email"
                  {...form.register("email")}
                />
                <FieldError errors={[form.formState.errors.email]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.gender}>
              <FieldLabel>Giới tính</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={(value) =>
                    form.setValue("gender", (value as StudentInput["gender"]) || undefined)
                  }
                  value={gender}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="MALE">Nam</SelectItem>
                      <SelectItem value="FEMALE">Nữ</SelectItem>
                      <SelectItem value="OTHER">Khác</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.gender]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.date_of_birth}>
              <FieldLabel htmlFor="student-date-of-birth">Ngày sinh</FieldLabel>
              <FieldContent>
                <Input
                  id="student-date-of-birth"
                  type="date"
                  {...form.register("date_of_birth")}
                />
                <FieldError errors={[form.formState.errors.date_of_birth]} />
              </FieldContent>
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection
          description="Phân biệt trạng thái truy cập hệ thống và trạng thái học tập thực tế."
          title="Thông Tin Học Tập"
        >
          <FormGrid>
            <Field data-invalid={!!form.formState.errors.access_status}>
              <FieldLabel>Trạng thái truy cập</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={(value) =>
                    form.setValue("access_status", value as StudentInput["access_status"], {
                      shouldValidate: true,
                    })
                  }
                  value={accessStatus}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                      <SelectItem value="INACTIVE">Tạm ngưng</SelectItem>
                      <SelectItem value="LOCKED">Đã khóa</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.access_status]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.current_status}>
              <FieldLabel>Trạng thái học tập</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={(value) =>
                    form.setValue("current_status", value as StudentInput["current_status"], {
                      shouldValidate: true,
                    })
                  }
                  value={currentStatus}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="ACTIVE">Đang học</SelectItem>
                      <SelectItem value="SUSPENDED">Tạm dừng</SelectItem>
                      <SelectItem value="GRADUATED">Đã tốt nghiệp</SelectItem>
                      <SelectItem value="DROPPED">Đã thôi học</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.current_status]} />
              </FieldContent>
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection
          description="Dùng cho liên hệ, phối hợp phụ huynh hoặc xử lý tình huống khẩn cấp."
          title="Thông Tin Liên Hệ"
        >
          <FormGrid>
            <Field data-invalid={!!form.formState.errors.phone}>
              <FieldLabel htmlFor="student-phone">Điện thoại</FieldLabel>
              <FieldContent>
                <Input
                  autoComplete="tel"
                  id="student-phone"
                  type="tel"
                  {...form.register("phone")}
                />
                <FieldError errors={[form.formState.errors.phone]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.emergency_contact}>
              <FieldLabel htmlFor="student-emergency-contact">Liên hệ khẩn cấp</FieldLabel>
              <FieldContent>
                <Input
                  id="student-emergency-contact"
                  {...form.register("emergency_contact")}
                />
                <FieldError errors={[form.formState.errors.emergency_contact]} />
              </FieldContent>
            </Field>
            <Field className="md:col-span-2" data-invalid={!!form.formState.errors.address}>
              <FieldLabel htmlFor="student-address">Địa chỉ</FieldLabel>
              <FieldContent>
                <Input id="student-address" {...form.register("address")} />
                <FieldError errors={[form.formState.errors.address]} />
              </FieldContent>
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection
          description="Mật khẩu chỉ dùng khi tạo mới hoặc khi quản trị viên muốn đặt lại cho người dùng."
          title="Thông Tin Hệ Thống"
        >
          <FormGrid>
            <Field data-invalid={!!form.formState.errors.password}>
              <FieldLabel htmlFor="student-password">
                {mode === "edit" ? "Đặt lại mật khẩu" : "Mật khẩu khởi tạo"}
              </FieldLabel>
              <FieldContent>
                <Input
                  autoComplete="new-password"
                  id="student-password"
                  type="password"
                  {...form.register("password")}
                />
                <FieldError errors={[form.formState.errors.password]} />
              </FieldContent>
            </Field>
          </FormGrid>
        </FormSection>
      </FormContainer>
      <FormStickyFooter>
        <div className="min-w-0 flex-1">
          <FormAlert message={state.message} success={state.success} />
        </div>
        <SubmitButton className="w-full md:w-auto" pending={isPending}>
          {mode === "edit" ? "Cập nhật sinh viên" : "Tạo sinh viên"}
        </SubmitButton>
      </FormStickyFooter>
    </form>
  );
}
