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
import { Textarea } from "@/components/ui/textarea";
import { upsertDepartmentAction } from "@/features/departments/actions";
import {
  departmentSchema,
  type DepartmentInput,
} from "@/features/departments/schemas";
import { initialActionState } from "@/lib/actions";
import { useApplyServerFormErrors } from "@/lib/form-errors";
import type { Department } from "@/types/app";
import type { FormMode } from "@/types/forms";

type DepartmentFormProps = {
  department?: Department | null;
  returnTo?: string;
};

const EMPTY_DEPARTMENT_VALUES: DepartmentInput = {
  code: "",
  description: "",
  id: undefined,
  name: "",
  status: "ACTIVE",
};

function mapDepartmentToFormValues(
  department: Department | null | undefined,
): DepartmentInput {
  if (!department) {
    return EMPTY_DEPARTMENT_VALUES;
  }

  return {
    code: department.code ?? "",
    description: department.description ?? "",
    id: department.id,
    name: department.name ?? "",
    status: department.is_active ? "ACTIVE" : "INACTIVE",
  };
}

export function DepartmentForm({
  department,
  returnTo = "/admin/departments",
}: DepartmentFormProps) {
  const [state, submitAction] = useActionState(
    upsertDepartmentAction,
    initialActionState,
  );
  const [isPending, startTransition] = useTransition();
  const mode: FormMode = department ? "edit" : "create";
  const formValues = useMemo(
    () => mapDepartmentToFormValues(department),
    [department],
  );
  const form = useForm<DepartmentInput>({
    resolver: zodResolver(departmentSchema),
    defaultValues: EMPTY_DEPARTMENT_VALUES,
    reValidateMode: "onChange",
  });
  useApplyServerFormErrors(form, state.errors);
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
        payload.set("description", values.description ?? "");
        payload.set("status", values.status);

        startTransition(() => submitAction(payload));
      })}
    >
      <FormContainer>
        <FormSection
          description="Mã khoa, tên khoa và trạng thái sử dụng của đơn vị đào tạo."
          title="Thông Tin Cơ Bản"
        >
          <FormGrid>
            <Field data-invalid={!!form.formState.errors.code}>
              <FieldLabel htmlFor="department-code">Mã khoa</FieldLabel>
              <FieldContent>
                <Input
                  autoComplete="off"
                  id="department-code"
                  spellCheck={false}
                  {...form.register("code")}
                />
                <FieldError errors={[form.formState.errors.code]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="department-name">Tên khoa</FieldLabel>
              <FieldContent>
                <Input id="department-name" {...form.register("name")} />
                <FieldError errors={[form.formState.errors.name]} />
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

                    form.setValue("status", value as DepartmentInput["status"], {
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
        <FormSection
          description="Thông tin mô tả dùng trong màn hình tổng quan và các khu quản trị liên quan."
          title="Thông Tin Hệ Thống"
        >
          <FormGrid>
            <Field
              className="md:col-span-2"
              data-invalid={!!form.formState.errors.description}
            >
              <FieldLabel htmlFor="department-description">Mô tả</FieldLabel>
              <FieldContent>
                <Textarea
                  id="department-description"
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
          {mode === "edit" ? "Cập nhật khoa" : "Tạo khoa"}
        </SubmitButton>
      </FormStickyFooter>
    </form>
  );
}
