"use client";

import { useActionState, useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormAlert } from "@/components/forms/form-alert";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateProfileAction } from "@/features/profile/actions";
import {
  type UpdateProfileInput,
  updateProfileSchema,
} from "@/features/profile/schemas";
import { initialActionState } from "@/lib/actions";
import { useApplyServerFormErrors } from "@/lib/form-errors-client";

type ProfileUpdateFormProps = {
  defaultFullName: string;
  defaultPhone: string | null;
};

export function ProfileUpdateForm({
  defaultFullName,
  defaultPhone,
}: ProfileUpdateFormProps) {
  const [state, submitAction] = useActionState(
    updateProfileAction,
    initialActionState,
  );
  const [isPending, startTransition] = useTransition();
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      full_name: defaultFullName,
      phone: defaultPhone ?? "",
    },
    reValidateMode: "onChange",
  });

  useApplyServerFormErrors(form, state.errors);

  useEffect(() => {
    if (!state.message) {
      return;
    }

    const notifier = state.success ? toast.success : toast.error;
    notifier(state.message);
  }, [state.message, state.success]);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit((values) => {
        const payload = new FormData();
        payload.set("full_name", values.full_name);
        payload.set("phone", values.phone ?? "");

        startTransition(() => {
          submitAction(payload);
        });
      })}
    >
      <FieldGroup>
        <Field data-invalid={!!form.formState.errors.full_name}>
          <FieldLabel htmlFor="full_name">Họ tên</FieldLabel>
          <FieldContent>
            <Input
              id="full_name"
              aria-invalid={!!form.formState.errors.full_name}
              placeholder="Nhập họ tên đầy đủ"
              {...form.register("full_name")}
            />
            <FieldError errors={[form.formState.errors.full_name]} />
          </FieldContent>
        </Field>
        <Field data-invalid={!!form.formState.errors.phone}>
          <FieldLabel htmlFor="phone">Số điện thoại</FieldLabel>
          <FieldContent>
            <Input
              id="phone"
              aria-invalid={!!form.formState.errors.phone}
              placeholder="Ví dụ: 0909123456"
              {...form.register("phone")}
            />
            <FieldError errors={[form.formState.errors.phone]} />
          </FieldContent>
        </Field>
      </FieldGroup>
      <FormAlert message={state.message} success={state.success} />
      <SubmitButton className="w-full sm:w-auto" pending={isPending}>
        Lưu hồ sơ
      </SubmitButton>
    </form>
  );
}
