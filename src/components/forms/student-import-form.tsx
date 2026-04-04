"use client";

import { useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";

import { FormAlert } from "@/components/forms/form-alert";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { importStudentsAction } from "@/features/students/actions";
import { initialActionState } from "@/lib/actions";

export function StudentImportForm() {
  const [state, submitAction] = useActionState(
    importStudentsAction,
    initialActionState,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.message) {
      const notifier = state.success ? toast.success : toast.error;
      notifier(state.message);
    }
  }, [state.message, state.success]);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => submitAction(formData));
      }}
    >
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4">
        <div className="mb-2 text-sm font-medium text-foreground">
          Chọn tệp CSV sinh viên
        </div>
        <div className="mb-3 text-sm text-muted-foreground">
          Hỗ trợ các cột: `student_code`, `full_name`, `email`, `academic_class_code`, `enrollment_year`.
        </div>
        <Field data-invalid={!!state.errors?.file?.length}>
          <FieldLabel htmlFor="student-import-file">Tệp CSV</FieldLabel>
          <FieldContent>
            <Input
              accept=".csv"
              id="student-import-file"
              name="file"
              type="file"
            />
            <FieldError
              errors={state.errors?.file?.map((message) => ({ message })) ?? []}
            />
          </FieldContent>
        </Field>
      </div>
      <FormAlert message={state.message} success={state.success} />
      <SubmitButton pending={isPending}>Nhập tệp CSV</SubmitButton>
    </form>
  );
}
