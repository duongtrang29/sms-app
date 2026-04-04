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
import { upsertSemesterAction } from "@/features/semesters/actions";
import { semesterSchema, type SemesterInput } from "@/features/semesters/schemas";
import { initialActionState } from "@/lib/actions";
import { useApplyServerFormErrors } from "@/lib/form-errors";
import type { Semester } from "@/types/app";
import type { FormMode } from "@/types/forms";

type SemesterFormProps = {
  semester?: Semester | null;
  returnTo?: string;
};

const EMPTY_SEMESTER_VALUES: SemesterInput = {
  academic_year: "",
  code: "",
  end_date: "",
  enrollment_end: "",
  enrollment_start: "",
  id: undefined,
  is_current: "NO",
  max_credits: 21,
  name: "",
  regrade_close_at: "",
  regrade_open_at: "",
  start_date: "",
};

function mapSemesterToFormValues(
  semester: Semester | null | undefined,
): SemesterInput {
  if (!semester) {
    return EMPTY_SEMESTER_VALUES;
  }

  return {
    academic_year: semester.academic_year ?? "",
    code: semester.code ?? "",
    end_date: semester.end_date ?? "",
    enrollment_end: semester.enrollment_end?.slice(0, 16) ?? "",
    enrollment_start: semester.enrollment_start?.slice(0, 16) ?? "",
    id: semester.id,
    is_current: semester.is_current ? "YES" : "NO",
    max_credits: semester.max_credits ?? 21,
    name: semester.name ?? "",
    regrade_close_at: semester.regrade_close_at?.slice(0, 16) ?? "",
    regrade_open_at: semester.regrade_open_at?.slice(0, 16) ?? "",
    start_date: semester.start_date ?? "",
  };
}

export function SemesterForm({
  semester,
  returnTo = "/admin/semesters",
}: SemesterFormProps) {
  const [state, submitAction] = useActionState(
    upsertSemesterAction,
    initialActionState,
  );
  const [isPending, startTransition] = useTransition();
  const mode: FormMode = semester ? "edit" : "create";
  const formValues = useMemo(() => mapSemesterToFormValues(semester), [semester]);
  const form = useForm<SemesterInput>({
    resolver: zodResolver(semesterSchema),
    defaultValues: EMPTY_SEMESTER_VALUES,
    reValidateMode: "onChange",
  });
  useApplyServerFormErrors(form, state.errors);
  const isCurrent = useWatch({
    control: form.control,
    name: "is_current",
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
        payload.set("academic_year", values.academic_year);
        payload.set("start_date", values.start_date);
        payload.set("end_date", values.end_date);
        payload.set("enrollment_start", values.enrollment_start);
        payload.set("enrollment_end", values.enrollment_end);
        payload.set("regrade_open_at", values.regrade_open_at ?? "");
        payload.set("regrade_close_at", values.regrade_close_at ?? "");
        payload.set("max_credits", String(values.max_credits));
        payload.set("is_current", values.is_current);

        startTransition(() => submitAction(payload));
      })}
    >
      <FormContainer>
        <FormSection
          description="Mã học kỳ, tên hiển thị và trạng thái học kỳ hiện hành."
          title="Thông Tin Cơ Bản"
        >
          <FormGrid>
            <Field data-invalid={!!form.formState.errors.code}>
              <FieldLabel htmlFor="semester-code">Mã học kỳ</FieldLabel>
              <FieldContent>
                <Input
                  autoComplete="off"
                  id="semester-code"
                  spellCheck={false}
                  {...form.register("code")}
                />
                <FieldError errors={[form.formState.errors.code]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="semester-name">Tên học kỳ</FieldLabel>
              <FieldContent>
                <Input id="semester-name" {...form.register("name")} />
                <FieldError errors={[form.formState.errors.name]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.academic_year}>
              <FieldLabel htmlFor="semester-academic-year">Năm học</FieldLabel>
              <FieldContent>
                <Input
                  autoComplete="off"
                  id="semester-academic-year"
                  placeholder="2025-2026"
                  spellCheck={false}
                  {...form.register("academic_year")}
                />
                <FieldError errors={[form.formState.errors.academic_year]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.is_current}>
              <FieldLabel>Học kỳ hiện hành</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={(value) =>
                    form.setValue("is_current", value as SemesterInput["is_current"], {
                      shouldValidate: true,
                    })
                  }
                  value={isCurrent}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="YES">Đang hiện hành</SelectItem>
                      <SelectItem value="NO">Không</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.is_current]} />
              </FieldContent>
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection
          description="Thời gian áp dụng của học kỳ và tổng tín chỉ tối đa cho một sinh viên."
          title="Thông Tin Học Tập"
        >
          <FormGrid>
            <Field data-invalid={!!form.formState.errors.start_date}>
              <FieldLabel htmlFor="semester-start-date">Ngày bắt đầu</FieldLabel>
              <FieldContent>
                <Input
                  id="semester-start-date"
                  type="date"
                  {...form.register("start_date")}
                />
                <FieldError errors={[form.formState.errors.start_date]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.end_date}>
              <FieldLabel htmlFor="semester-end-date">Ngày kết thúc</FieldLabel>
              <FieldContent>
                <Input
                  id="semester-end-date"
                  type="date"
                  {...form.register("end_date")}
                />
                <FieldError errors={[form.formState.errors.end_date]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.enrollment_start}>
              <FieldLabel htmlFor="semester-enrollment-start">Mở đăng ký</FieldLabel>
              <FieldContent>
                <Input
                  id="semester-enrollment-start"
                  type="datetime-local"
                  {...form.register("enrollment_start")}
                />
                <FieldError errors={[form.formState.errors.enrollment_start]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.enrollment_end}>
              <FieldLabel htmlFor="semester-enrollment-end">Đóng đăng ký</FieldLabel>
              <FieldContent>
                <Input
                  id="semester-enrollment-end"
                  type="datetime-local"
                  {...form.register("enrollment_end")}
                />
                <FieldError errors={[form.formState.errors.enrollment_end]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.max_credits}>
              <FieldLabel htmlFor="semester-max-credits">Tín chỉ tối đa</FieldLabel>
              <FieldContent>
                <Input
                  id="semester-max-credits"
                  type="number"
                  {...form.register("max_credits", { valueAsNumber: true })}
                />
                <FieldError errors={[form.formState.errors.max_credits]} />
              </FieldContent>
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection
          description="Cửa sổ phúc khảo dùng để kiểm soát thời điểm sinh viên được gửi yêu cầu."
          title="Thông Tin Hệ Thống"
        >
          <FormGrid>
            <Field data-invalid={!!form.formState.errors.regrade_open_at}>
              <FieldLabel htmlFor="semester-regrade-open">Mở phúc khảo</FieldLabel>
              <FieldContent>
                <Input
                  id="semester-regrade-open"
                  type="datetime-local"
                  {...form.register("regrade_open_at")}
                />
                <FieldError errors={[form.formState.errors.regrade_open_at]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.regrade_close_at}>
              <FieldLabel htmlFor="semester-regrade-close">Đóng phúc khảo</FieldLabel>
              <FieldContent>
                <Input
                  id="semester-regrade-close"
                  type="datetime-local"
                  {...form.register("regrade_close_at")}
                />
                <FieldError errors={[form.formState.errors.regrade_close_at]} />
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
          {mode === "edit" ? "Cập nhật học kỳ" : "Tạo học kỳ"}
        </SubmitButton>
      </FormStickyFooter>
    </form>
  );
}
