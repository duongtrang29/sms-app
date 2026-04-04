"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormAlert } from "@/components/forms/form-alert";
import { SubmitButton } from "@/components/forms/submit-button";
import { resetPasswordAction } from "@/features/auth/actions";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/features/auth/schemas";
import { initialActionState } from "@/lib/actions";
import { useApplyServerFormErrors } from "@/lib/form-errors";

export function ResetPasswordForm() {
  const [state, submitAction] = useActionState(
    resetPasswordAction,
    initialActionState,
  );
  const [isPending, startTransition] = useTransition();
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      confirmPassword: "",
      password: "",
    },
    reValidateMode: "onChange",
  });

  useApplyServerFormErrors(form, state.errors);

  useEffect(() => {
    if (state.message) {
      const notifier = state.success ? toast.success : toast.error;
      notifier(state.message);
    }
  }, [state.message, state.success]);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit((values) => {
        const payload = new FormData();
        payload.set("password", values.password);
        payload.set("confirmPassword", values.confirmPassword);

        startTransition(() => {
          submitAction(payload);
        });
      })}
    >
      <FieldGroup>
        <Field data-invalid={!!form.formState.errors.password}>
          <FieldLabel htmlFor="password">Mật khẩu mới</FieldLabel>
          <FieldContent>
            <Input
              id="password"
              aria-invalid={!!form.formState.errors.password}
              type="password"
              {...form.register("password")}
            />
            <FieldError errors={[form.formState.errors.password]} />
          </FieldContent>
        </Field>
        <Field data-invalid={!!form.formState.errors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Xác nhận mật khẩu</FieldLabel>
          <FieldContent>
            <Input
              id="confirmPassword"
              aria-invalid={!!form.formState.errors.confirmPassword}
              type="password"
              {...form.register("confirmPassword")}
            />
            <FieldError errors={[form.formState.errors.confirmPassword]} />
          </FieldContent>
        </Field>
      </FieldGroup>
      <FormAlert message={state.message} success={state.success} />
      <SubmitButton className="w-full" pending={isPending}>
        Cập nhật mật khẩu
      </SubmitButton>
    </form>
  );
}
