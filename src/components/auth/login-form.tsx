"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormAlert } from "@/components/forms/form-alert";
import { SubmitButton } from "@/components/forms/submit-button";
import { loginAction } from "@/features/auth/actions";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { initialActionState } from "@/lib/actions";
import { useApplyServerFormErrors } from "@/lib/form-errors-client";

type LoginFormProps = {
  initialMessage?: string | undefined;
};

export function LoginForm({ initialMessage }: LoginFormProps) {
  const [state, submitAction] = useActionState(loginAction, initialActionState);
  const [isPending, startTransition] = useTransition();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    reValidateMode: "onChange",
  });

  useApplyServerFormErrors(form, state.errors);

  useEffect(() => {
    if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state.message, state.success]);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit((values) => {
        const payload = new FormData();
        payload.set("email", values.email);
        payload.set("password", values.password);

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
              placeholder="taikhoan@truong.edu.vn"
              {...form.register("email")}
            />
            <FieldError errors={[form.formState.errors.email]} />
          </FieldContent>
        </Field>
        <Field data-invalid={!!form.formState.errors.password}>
          <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
          <FieldContent>
            <Input
              id="password"
              autoComplete="current-password"
              aria-invalid={!!form.formState.errors.password}
              type="password"
              {...form.register("password")}
            />
            <FieldError errors={[form.formState.errors.password]} />
          </FieldContent>
        </Field>
      </FieldGroup>
      <FormAlert message={state.message ?? initialMessage} success={state.success} />
      <SubmitButton className="w-full" pending={isPending}>
        Đăng nhập
      </SubmitButton>
    </form>
  );
}
