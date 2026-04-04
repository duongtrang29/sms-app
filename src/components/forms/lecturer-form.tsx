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
import { upsertLecturerAction } from "@/features/lecturers/actions";
import { lecturerSchema, type LecturerInput } from "@/features/lecturers/schemas";
import { initialActionState } from "@/lib/actions";
import { useApplyServerFormErrors } from "@/lib/form-errors";
import { mapOptions } from "@/lib/options";
import type { LecturerRecord } from "@/features/lecturers/queries";
import type { Department } from "@/types/app";
import type { FormMode } from "@/types/forms";

type LecturerFormProps = {
  departments: Department[];
  lecturer?: LecturerRecord | null;
  returnTo?: string;
};

const EMPTY_LECTURER_VALUES: LecturerInput = {
  academic_title: "",
  department_id: "",
  email: "",
  employee_code: "",
  full_name: "",
  hire_date: "",
  id: undefined,
  office_location: "",
  password: "",
  phone: "",
  status: "ACTIVE",
};

function mapLecturerToFormValues(
  lecturer: LecturerRecord | null | undefined,
  fallbackDepartmentId: string,
): LecturerInput {
  if (!lecturer) {
    return {
      ...EMPTY_LECTURER_VALUES,
      department_id: fallbackDepartmentId,
    };
  }

  return {
    academic_title: lecturer.academic_title ?? "",
    department_id: lecturer.department_id ?? fallbackDepartmentId,
    email: lecturer.email ?? "",
    employee_code: lecturer.employee_code ?? "",
    full_name: lecturer.full_name ?? "",
    hire_date: lecturer.hire_date ?? "",
    id: lecturer.id,
    office_location: lecturer.office_location ?? "",
    password: "",
    phone: lecturer.phone ?? "",
    status: lecturer.status,
  };
}

export function LecturerForm({
  departments,
  lecturer,
  returnTo = "/admin/lecturers",
}: LecturerFormProps) {
  const [state, submitAction] = useActionState(
    upsertLecturerAction,
    initialActionState,
  );
  const [isPending, startTransition] = useTransition();
  const mode: FormMode = lecturer ? "edit" : "create";
  const departmentOptions = useMemo(
    () =>
      mapOptions(
        departments,
        (department) => department.name,
        (department) => department.id,
      ),
    [departments],
  );
  const formValues = useMemo(
    () => mapLecturerToFormValues(lecturer, departmentOptions[0]?.value ?? ""),
    [departmentOptions, lecturer],
  );
  const form = useForm<LecturerInput>({
    resolver: zodResolver(lecturerSchema),
    defaultValues: EMPTY_LECTURER_VALUES,
    reValidateMode: "onChange",
  });
  useApplyServerFormErrors(form, state.errors);
  const departmentId = useWatch({
    control: form.control,
    name: "department_id",
  });
  const status = useWatch({
    control: form.control,
    name: "status",
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
        payload.set("department_id", values.department_id);
        payload.set("email", values.email);
        payload.set("employee_code", values.employee_code);
        payload.set("full_name", values.full_name);
        payload.set("status", values.status);
        payload.set("academic_title", values.academic_title ?? "");
        payload.set("hire_date", values.hire_date ?? "");
        payload.set("office_location", values.office_location ?? "");
        payload.set("phone", values.phone ?? "");
        if (values.password) {
          payload.set("password", values.password);
        }

        startTransition(() => submitAction(payload));
      })}
    >
      <FormContainer>
        <FormSection
          description="Thông tin nhận diện giảng viên và khoa chủ quản."
          title="Thông Tin Cơ Bản"
        >
          <FormGrid>
            <Field data-invalid={!!form.formState.errors.department_id}>
              <FieldLabel>Khoa</FieldLabel>
              <FieldContent>
                <RelationSelect
                  onValueChange={(value) => {
                    if (!value) {
                      return;
                    }

                    form.setValue("department_id", value, { shouldValidate: true });
                  }}
                  options={departmentOptions}
                  placeholder="Chọn khoa"
                  value={departmentId}
                />
                <FieldError errors={[form.formState.errors.department_id]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.status}>
              <FieldLabel>Trạng thái</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={(value) => {
                    if (!value) {
                      return;
                    }

                    form.setValue("status", value as LecturerInput["status"], {
                      shouldValidate: true,
                    });
                  }}
                  value={status}
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
                <FieldError errors={[form.formState.errors.status]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.employee_code}>
              <FieldLabel htmlFor="lecturer-code">Mã giảng viên</FieldLabel>
              <FieldContent>
                <Input
                  autoComplete="off"
                  id="lecturer-code"
                  spellCheck={false}
                  {...form.register("employee_code")}
                />
                <FieldError errors={[form.formState.errors.employee_code]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.full_name}>
              <FieldLabel htmlFor="lecturer-full-name">Họ tên</FieldLabel>
              <FieldContent>
                <Input id="lecturer-full-name" {...form.register("full_name")} />
                <FieldError errors={[form.formState.errors.full_name]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.email}>
              <FieldLabel htmlFor="lecturer-email">Email</FieldLabel>
              <FieldContent>
                <Input
                  autoComplete="email"
                  id="lecturer-email"
                  spellCheck={false}
                  type="email"
                  {...form.register("email")}
                />
                <FieldError errors={[form.formState.errors.email]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.academic_title}>
              <FieldLabel htmlFor="lecturer-academic-title">Học hàm / học vị</FieldLabel>
              <FieldContent>
                <Input
                  id="lecturer-academic-title"
                  {...form.register("academic_title")}
                />
                <FieldError errors={[form.formState.errors.academic_title]} />
              </FieldContent>
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection
          description="Thông tin liên hệ và nơi làm việc để hỗ trợ tra cứu nội bộ."
          title="Thông Tin Liên Hệ"
        >
          <FormGrid>
            <Field data-invalid={!!form.formState.errors.office_location}>
              <FieldLabel htmlFor="lecturer-office-location">Phòng làm việc</FieldLabel>
              <FieldContent>
                <Input
                  id="lecturer-office-location"
                  {...form.register("office_location")}
                />
                <FieldError errors={[form.formState.errors.office_location]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.phone}>
              <FieldLabel htmlFor="lecturer-phone">Số điện thoại</FieldLabel>
              <FieldContent>
                <Input
                  autoComplete="tel"
                  id="lecturer-phone"
                  type="tel"
                  {...form.register("phone")}
                />
                <FieldError errors={[form.formState.errors.phone]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.hire_date}>
              <FieldLabel htmlFor="lecturer-hire-date">Ngày tuyển dụng</FieldLabel>
              <FieldContent>
                <Input
                  id="lecturer-hire-date"
                  type="date"
                  {...form.register("hire_date")}
                />
                <FieldError errors={[form.formState.errors.hire_date]} />
              </FieldContent>
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection
          description="Mật khẩu chỉ bắt buộc khi tạo mới; khi chỉnh sửa có thể để trống nếu không đổi."
          title="Thông Tin Hệ Thống"
        >
          <FormGrid>
            <Field data-invalid={!!form.formState.errors.password}>
              <FieldLabel htmlFor="lecturer-password">
                {mode === "edit" ? "Đặt lại mật khẩu" : "Mật khẩu khởi tạo"}
              </FieldLabel>
              <FieldContent>
                <Input
                  autoComplete={mode === "edit" ? "new-password" : "current-password"}
                  id="lecturer-password"
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
          {mode === "edit" ? "Cập nhật giảng viên" : "Tạo giảng viên"}
        </SubmitButton>
      </FormStickyFooter>
    </form>
  );
}
