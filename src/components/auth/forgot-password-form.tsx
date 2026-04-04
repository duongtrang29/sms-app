"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormAlert } from "@/components/forms/form-alert";
import { SubmitButton } from "@/components/forms/submit-button";
import { forgotPasswordAction } from "@/features/auth/actions";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/features/auth/schemas";
import { initialActionState } from "@/lib/actions";
import { useApplyServerFormErrors } from "@/lib/form-errors";

export function ForgotPasswordForm() {
  const [state, submitAction] = useActionState(
    forgotPasswordAction,
    initialActionState,
  );
  const [isPending, startTransition] = useTransition();
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
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
        payload.set("email", values.email);

        startTransition(() => {
          submitAction(payload);
        });
      })}
    >
      <FieldGroup>
        <Field data-invalid={!!form.formState.errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <FieldContent>
            <Input
              id="email"
              autoComplete="email"
              aria-invalid={!!form.formState.errors.email}
              placeholder="nguoidung@truong.edu.vn"
              {...form.register("email")}
            />
            <FieldError errors={[form.formState.errors.email]} />
          </FieldContent>
        </Field>
      </FieldGroup>
      <FormAlert message={state.message} success={state.success} />
      <SubmitButton className="w-full" pending={isPending}>
        Gửi email đặt lại mật khẩu
      </SubmitButton>
    </form>
  );
}
