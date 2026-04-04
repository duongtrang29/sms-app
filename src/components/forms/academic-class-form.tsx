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
import { upsertAcademicClassAction } from "@/features/academic-classes/actions";
import {
  academicClassSchema,
  type AcademicClassInput,
} from "@/features/academic-classes/schemas";
import { initialActionState } from "@/lib/actions";
import { useApplyServerFormErrors } from "@/lib/form-errors-client";
import { mapOptions } from "@/lib/options";
import type { AcademicClass, Major } from "@/types/app";
import type { FormMode } from "@/types/forms";

type AcademicClassFormProps = {
  academicClass?: AcademicClass | null;
  majors: Major[];
  returnTo?: string;
};

const EMPTY_ACADEMIC_CLASS_VALUES: AcademicClassInput = {
  code: "",
  cohort_year: new Date().getFullYear(),
  id: undefined,
  major_id: "",
  name: "",
  status: "ACTIVE",
};

function mapAcademicClassToFormValues(
  academicClass: AcademicClass | null | undefined,
  fallbackMajorId: string,
): AcademicClassInput {
  if (!academicClass) {
    return {
      ...EMPTY_ACADEMIC_CLASS_VALUES,
      major_id: fallbackMajorId,
    };
  }

  return {
    code: academicClass.code ?? "",
    cohort_year: academicClass.cohort_year ?? new Date().getFullYear(),
    id: academicClass.id,
    major_id: academicClass.major_id ?? fallbackMajorId,
    name: academicClass.name ?? "",
    status: academicClass.is_active ? "ACTIVE" : "INACTIVE",
  };
}

export function AcademicClassForm({
  academicClass,
  majors,
  returnTo = "/admin/classes",
}: AcademicClassFormProps) {
  const [state, submitAction] = useActionState(
    upsertAcademicClassAction,
    initialActionState,
  );
  const [isPending, startTransition] = useTransition();
  const mode: FormMode = academicClass ? "edit" : "create";
  const majorOptions = useMemo(
    () =>
      mapOptions(
        majors,
        (major) => `${major.code} - ${major.name}`,
        (major) => major.id,
      ),
    [majors],
  );
  const formValues = useMemo(
    () =>
      mapAcademicClassToFormValues(academicClass, majorOptions[0]?.value ?? ""),
    [academicClass, majorOptions],
  );
  const form = useForm<AcademicClassInput>({
    resolver: zodResolver(academicClassSchema),
    defaultValues: EMPTY_ACADEMIC_CLASS_VALUES,
    reValidateMode: "onChange",
  });
  useApplyServerFormErrors(form, state.errors);
  const majorId = useWatch({
    control: form.control,
    name: "major_id",
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
        payload.set("major_id", values.major_id);
        payload.set("cohort_year", String(values.cohort_year));
        payload.set("status", values.status);

        startTransition(() => submitAction(payload));
      })}
    >
      <FormContainer>
        <FormSection
          description="Lớp sinh hoạt gắn với ngành, khóa và dùng để gom sinh viên cho báo cáo học vụ."
          title="Thông Tin Cơ Bản"
        >
          <FormGrid>
            <Field data-invalid={!!form.formState.errors.major_id}>
              <FieldLabel>Ngành</FieldLabel>
              <FieldContent>
                <RelationSelect
                  onValueChange={(value) => {
                    if (!value) {
                      return;
                    }

                    form.setValue("major_id", value, { shouldValidate: true });
                  }}
                  options={majorOptions}
                  placeholder="Chọn ngành"
                  value={majorId}
                />
                <FieldError errors={[form.formState.errors.major_id]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.cohort_year}>
              <FieldLabel htmlFor="class-cohort-year">Khóa</FieldLabel>
              <FieldContent>
                <Input
                  id="class-cohort-year"
                  type="number"
                  {...form.register("cohort_year", { valueAsNumber: true })}
                />
                <FieldError errors={[form.formState.errors.cohort_year]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.code}>
              <FieldLabel htmlFor="class-code">Mã lớp</FieldLabel>
              <FieldContent>
                <Input
                  autoComplete="off"
                  id="class-code"
                  spellCheck={false}
                  {...form.register("code")}
                />
                <FieldError errors={[form.formState.errors.code]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="class-name">Tên lớp</FieldLabel>
              <FieldContent>
                <Input id="class-name" {...form.register("name")} />
                <FieldError errors={[form.formState.errors.name]} />
              </FieldContent>
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection
          description="Lớp có thể được tạm ngưng để tránh tạo mới sinh viên vào dữ liệu không còn sử dụng."
          title="Thông Tin Hệ Thống"
        >
          <FormGrid>
            <Field data-invalid={!!form.formState.errors.status}>
              <FieldLabel>Trạng thái</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={(value) => {
                    if (!value) {
                      return;
                    }

                    form.setValue("status", value as AcademicClassInput["status"], {
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
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.status]} />
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
          {mode === "edit" ? "Cập nhật lớp" : "Tạo lớp"}
        </SubmitButton>
      </FormStickyFooter>
    </form>
  );
}
