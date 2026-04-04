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
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/actions";
import { useApplyServerFormErrors } from "@/lib/form-errors";
import { mapOptions } from "@/lib/options";
import { upsertCourseAction } from "@/features/courses/actions";
import { courseSchema, type CourseInput } from "@/features/courses/schemas";
import type { CourseRecord } from "@/features/courses/queries";
import type { Department } from "@/types/app";
import type { FormMode } from "@/types/forms";

type CourseFormProps = {
  course?: CourseRecord | null;
  departments: Department[];
  returnTo?: string;
};

const EMPTY_COURSE_VALUES: CourseInput = {
  code: "",
  credit_hours: 3,
  department_id: "",
  description: "",
  id: undefined,
  name: "",
  prerequisite_codes: "",
  status: "ACTIVE",
  total_sessions: 15,
};

function mapCourseToFormValues(
  course: CourseRecord | null | undefined,
  fallbackDepartmentId: string,
): CourseInput {
  if (!course) {
    return {
      ...EMPTY_COURSE_VALUES,
      department_id: fallbackDepartmentId,
    };
  }

  return {
    code: course.code ?? "",
    credit_hours: course.credit_hours ?? 3,
    department_id: course.department_id ?? fallbackDepartmentId,
    description: course.description ?? "",
    id: course.id,
    name: course.name ?? "",
    prerequisite_codes: course.prerequisite_codes ?? "",
    status: course.is_active ? "ACTIVE" : "INACTIVE",
    total_sessions: course.total_sessions ?? 15,
  };
}

export function CourseForm({
  course,
  departments,
  returnTo = "/admin/courses",
}: CourseFormProps) {
  const [state, submitAction] = useActionState(upsertCourseAction, initialActionState);
  const [isPending, startTransition] = useTransition();
  const mode: FormMode = course ? "edit" : "create";
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
    () => mapCourseToFormValues(course, departmentOptions[0]?.value ?? ""),
    [course, departmentOptions],
  );
  const form = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
    defaultValues: EMPTY_COURSE_VALUES,
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
        payload.set("code", values.code);
        payload.set("name", values.name);
        payload.set("department_id", values.department_id);
        payload.set("credit_hours", String(values.credit_hours));
        payload.set("total_sessions", String(values.total_sessions));
        payload.set("description", values.description ?? "");
        payload.set("prerequisite_codes", values.prerequisite_codes ?? "");
        payload.set("status", values.status);

        startTransition(() => submitAction(payload));
      })}
    >
      <FormContainer>
        <FormSection
          description="Thông tin nhận diện môn học và khoa phụ trách quản lý."
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

                    form.setValue("department_id", value, {
                      shouldValidate: true,
                    });
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

                    form.setValue("status", value as CourseInput["status"], {
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
                      <SelectItem value="ACTIVE">Đang sử dụng</SelectItem>
                      <SelectItem value="INACTIVE">Tạm ngưng</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.status]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.code}>
              <FieldLabel htmlFor="course-code">Mã môn</FieldLabel>
              <FieldContent>
                <Input
                  autoComplete="off"
                  id="course-code"
                  spellCheck={false}
                  {...form.register("code")}
                />
                <FieldError errors={[form.formState.errors.code]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="course-name">Tên môn</FieldLabel>
              <FieldContent>
                <Input id="course-name" {...form.register("name")} />
                <FieldError errors={[form.formState.errors.name]} />
              </FieldContent>
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection
          description="Chỉ số học vụ và môn tiên quyết dùng để kiểm tra khi mở học phần hoặc đăng ký học."
          title="Thông Tin Học Tập"
        >
          <FormGrid>
            <Field data-invalid={!!form.formState.errors.credit_hours}>
              <FieldLabel htmlFor="course-credit-hours">Số tín chỉ</FieldLabel>
              <FieldContent>
                <Input
                  id="course-credit-hours"
                  type="number"
                  {...form.register("credit_hours", { valueAsNumber: true })}
                />
                <FieldError errors={[form.formState.errors.credit_hours]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.total_sessions}>
              <FieldLabel htmlFor="course-total-sessions">Số buổi</FieldLabel>
              <FieldContent>
                <Input
                  id="course-total-sessions"
                  type="number"
                  {...form.register("total_sessions", { valueAsNumber: true })}
                />
                <FieldError errors={[form.formState.errors.total_sessions]} />
              </FieldContent>
            </Field>
            <Field className="md:col-span-2" data-invalid={!!form.formState.errors.prerequisite_codes}>
              <FieldLabel htmlFor="course-prerequisites">Môn tiên quyết</FieldLabel>
              <FieldContent>
                <Input
                  autoComplete="off"
                  id="course-prerequisites"
                  placeholder="IT101, IT102"
                  spellCheck={false}
                  {...form.register("prerequisite_codes")}
                />
                <FieldError errors={[form.formState.errors.prerequisite_codes]} />
              </FieldContent>
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection
          description="Mô tả giúp người dùng hiểu nhanh nội dung môn học khi mở học phần."
          title="Thông Tin Hệ Thống"
        >
          <FormGrid>
            <Field className="md:col-span-2" data-invalid={!!form.formState.errors.description}>
              <FieldLabel htmlFor="course-description">Mô tả</FieldLabel>
              <FieldContent>
                <Textarea
                  id="course-description"
                  rows={5}
                  {...form.register("description")}
                />
                <FieldError errors={[form.formState.errors.description]} />
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
          {mode === "edit" ? "Cập nhật môn học" : "Tạo môn học"}
        </SubmitButton>
      </FormStickyFooter>
    </form>
  );
}
