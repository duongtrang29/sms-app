"use client";

import Papa from "papaparse";
import { DownloadIcon, FileSpreadsheetIcon, UploadIcon } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { FormAlert } from "@/components/forms/form-alert";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { importStudentsAction } from "@/features/students/actions";
import { initialActionState } from "@/lib/actions";

const requiredColumns = [
  "student_code",
  "full_name",
  "email",
  "academic_class_code",
  "enrollment_year",
] as const;

export function StudentImportForm() {
  const [state, submitAction] = useActionState(
    importStudentsAction,
    initialActionState,
  );
  const [isPending, startTransition] = useTransition();
  const [previewRows, setPreviewRows] = useState<Array<Record<string, string>>>([]);
  const [selectedFileName, setSelectedFileName] = useState("");

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
      <div className="rounded-[24px] border border-dashed border-border/80 bg-muted/18 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileSpreadsheetIcon className="size-4 text-[color:var(--color-info)]" />
              CSV sinh viên
            </div>
            <div className="text-sm text-muted-foreground">
              Tải mẫu chuẩn, giữ đúng tên cột và kiểm tra nhanh bản xem trước trước khi nhập.
            </div>
          </div>
          <a download href="/templates/student-import-template.csv">
            <Button type="button" variant="outline">
              <DownloadIcon data-icon="inline-start" />
              Tải file mẫu
            </Button>
          </a>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {requiredColumns.map((column) => (
            <Badge key={column} variant="outline">
              {column}
            </Badge>
          ))}
        </div>
        <Field className="mt-4" data-invalid={!!state.errors?.file?.length}>
          <FieldLabel htmlFor="student-import-file">Tệp CSV</FieldLabel>
          <FieldContent>
            <Input
              accept=".csv"
              id="student-import-file"
              name="file"
              onChange={async (event) => {
                const file = event.target.files?.[0];

                setSelectedFileName(file?.name ?? "");
                if (!file) {
                  setPreviewRows([]);
                  return;
                }

                const text = await file.text();
                const parsed = Papa.parse<Record<string, string>>(text, {
                  header: true,
                  skipEmptyLines: true,
                });

                setPreviewRows(parsed.data.slice(0, 3));
              }}
              type="file"
            />
            <FieldError
              errors={state.errors?.file?.map((message) => ({ message })) ?? []}
            />
          </FieldContent>
        </Field>
        {selectedFileName ? (
          <div className="mt-3 text-sm text-muted-foreground">
            Tệp đã chọn: <span className="font-medium text-foreground">{selectedFileName}</span>
          </div>
        ) : null}
      </div>
      {previewRows.length ? (
        <div className="overflow-hidden rounded-[22px] border border-border/70 bg-background/92">
          <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3 text-sm font-medium text-foreground">
            <UploadIcon className="size-4 text-[color:var(--color-info)]" />
            Xem trước 3 dòng đầu
          </div>
          <div className="app-scrollbar overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/28 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  {requiredColumns.map((column) => (
                    <th className="px-4 py-3 font-semibold" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, index) => (
                  <tr className="border-t border-border/70" key={`${row.student_code}-${index + 1}`}>
                    {requiredColumns.map((column) => (
                      <td className="px-4 py-3 text-foreground/90" key={`${column}-${index + 1}`}>
                        {row[column] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
        Hệ thống đọc đúng 5 cột trên. Các cột khác sẽ bị bỏ qua.
      </div>
      <FormAlert message={state.message} success={state.success} />
      <SubmitButton pending={isPending}>
        <UploadIcon data-icon="inline-start" />
        Nhập tệp CSV
      </SubmitButton>
    </form>
  );
}
