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
import { initialActionState } from "@/lib/actions";
import { useApplyServerFormErrors } from "@/lib/form-errors";
import { mapOptions } from "@/lib/options";
import { upsertMajorAction } from "@/features/majors/actions";
import { majorSchema, type MajorInput } from "@/features/majors/schemas";
import type { Department, Major } from "@/types/app";
import type { FormMode } from "@/types/forms";

type MajorFormProps = {
  departments: Department[];
  major?: Major | null;
  returnTo?: string;
};

const EMPTY_MAJOR_VALUES: MajorInput = {
  code: "",
  degree_level: "UNDERGRADUATE",
  department_id: "",
  id: undefined,
  name: "",
  status: "ACTIVE",
};

function mapMajorToFormValues(
  major: Major | null | undefined,
  fallbackDepartmentId: string,
): MajorInput {
  if (!major) {
    return {
      ...EMPTY_MAJOR_VALUES,
      department_id: fallbackDepartmentId,
    };
  }

  return {
    code: major.code ?? "",
    degree_level: major.degree_level,
    department_id: major.department_id ?? fallbackDepartmentId,
    id: major.id,
    name: major.name ?? "",
    status: major.is_active ? "ACTIVE" : "INACTIVE",
  };
}

export function MajorForm({
  departments,
  major,
  returnTo = "/admin/majors",
}: MajorFormProps) {
  const [state, submitAction] = useActionState(upsertMajorAction, initialActionState);
  const [isPending, startTransition] = useTransition();
  const mode: FormMode = major ? "edit" : "create";
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
    () => mapMajorToFormValues(major, departmentOptions[0]?.value ?? ""),
    [departmentOptions, major],
  );
  const form = useForm<MajorInput>({
    resolver: zodResolver(majorSchema),
    defaultValues: EMPTY_MAJOR_VALUES,
    reValidateMode: "onChange",
  });
  useApplyServerFormErrors(form, state.errors);
  const departmentId = useWatch({
    control: form.control,
    name: "department_id",
  });
  const degreeLevel = useWatch({
    control: form.control,
    name: "degree_level",
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
        payload.set("degree_level", values.degree_level);
        payload.set("department_id", values.department_id);
        payload.set("status", values.status);

        startTransition(() => submitAction(payload));
      })}
    >
      <FormContainer>
        <FormSection
          description="Ngành thuộc một khoa và xác định bậc đào tạo tương ứng."
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
            <Field data-invalid={!!form.formState.errors.degree_level}>
              <FieldLabel>Bậc đào tạo</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={(value) => {
                    if (!value) {
                      return;
                    }

                    form.setValue("degree_level", value, { shouldValidate: true });
                  }}
                  value={degreeLevel}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="UNDERGRADUATE">Đại học</SelectItem>
                      <SelectItem value="MASTER">Cao học</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.degree_level]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.code}>
              <FieldLabel htmlFor="major-code">Mã ngành</FieldLabel>
              <FieldContent>
                <Input
                  autoComplete="off"
                  id="major-code"
                  spellCheck={false}
                  {...form.register("code")}
                />
                <FieldError errors={[form.formState.errors.code]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="major-name">Tên ngành</FieldLabel>
              <FieldContent>
                <Input id="major-name" {...form.register("name")} />
                <FieldError errors={[form.formState.errors.name]} />
              </FieldContent>
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection
          description="Trạng thái kiểm soát việc hiển thị ngành trong các luồng tạo lớp và quản lý sinh viên."
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

                    form.setValue("status", value as MajorInput["status"], {
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
          {mode === "edit" ? "Cập nhật ngành" : "Tạo ngành"}
        </SubmitButton>
      </FormStickyFooter>
    </form>
  );
}
