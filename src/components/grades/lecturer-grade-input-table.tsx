"use client";

import { Loader2Icon, SendIcon } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { FormAlert } from "@/components/forms/form-alert";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveDraftGrades, submitGrades } from "@/lib/actions/lecturer/grades";
import { formatScore } from "@/lib/format";
import type { Enrollment, Grade } from "@/types/app";

type LecturerGradeInputTableProps = {
  enrollments: Enrollment[];
  grades: Grade[];
  initialError?: string | undefined;
  initialSuccess?: string | undefined;
  offeringId: string;
  studentNames: Record<string, string>;
  studentCodes: Record<string, string>;
  weights: {
    attendance: number;
    final: number;
    midterm: number;
  };
};

type GradeRowState = {
  attendance: string;
  enrollmentId: string;
  final: string;
  midterm: string;
  remark: string;
  serverTotal: number | null;
  status: "APPROVED" | "DRAFT" | "LOCKED" | "SUBMITTED";
  studentCode: string;
  studentName: string;
};

function toInputValue(value: number | null) {
  return value === null ? "" : String(value);
}

function parseScore(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }

  return parsed;
}

function isScoreInvalid(value: string) {
  if (!value.trim()) {
    return false;
  }

  const parsed = Number(value);
  return !Number.isFinite(parsed) || parsed < 0 || parsed > 10;
}

function computeTotalScore(
  attendance: string,
  midterm: string,
  final: string,
  weights: { attendance: number; final: number; midterm: number },
) {
  const attendanceScore = parseScore(attendance);
  const midtermScore = parseScore(midterm);
  const finalScore = parseScore(final);

  if (
    attendanceScore === null ||
    midtermScore === null ||
    finalScore === null ||
    Number.isNaN(attendanceScore) ||
    Number.isNaN(midtermScore) ||
    Number.isNaN(finalScore)
  ) {
    return null;
  }

  const total =
    attendanceScore * weights.attendance +
    midtermScore * weights.midterm +
    finalScore * weights.final;

  return Math.round(total * 100) / 100;
}

function toSavedScoreValue(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

export function LecturerGradeInputTable({
  enrollments,
  grades,
  initialError,
  initialSuccess,
  offeringId,
  studentCodes,
  studentNames,
  weights,
}: LecturerGradeInputTableProps) {
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});
  const [dirtyRows, setDirtyRows] = useState<Record<string, boolean>>({});
  const [submitPending, startSubmitTransition] = useTransition();

  const [rows, setRows] = useState<GradeRowState[]>(() => {
    const gradeByEnrollment = new Map(grades.map((grade) => [grade.enrollment_id, grade]));

    return enrollments.map((enrollment) => {
      const grade = gradeByEnrollment.get(enrollment.id);

      return {
        attendance: toInputValue(grade?.attendance_score ?? null),
        enrollmentId: enrollment.id,
        final: toInputValue(grade?.final_score ?? null),
        midterm: toInputValue(grade?.midterm_score ?? null),
        remark: grade?.remark ?? "",
        serverTotal: grade?.total_score ?? null,
        status: grade?.status ?? "DRAFT",
        studentCode: studentCodes[enrollment.student_id] ?? "N/A",
        studentName: studentNames[enrollment.student_id] ?? "Không rõ tên",
      };
    });
  });

  const submittedCount = useMemo(
    () => rows.filter((row) => row.status === "SUBMITTED").length,
    [rows],
  );

  const isSheetLocked = useMemo(
    () => rows.length > 0 && rows.every((row) => row.status === "LOCKED"),
    [rows],
  );

  const canSubmit = useMemo(() => {
    if (isSheetLocked) {
      return false;
    }

    const draftRows = rows.filter((row) => row.status === "DRAFT");
    if (!draftRows.length) {
      return false;
    }

    return draftRows.every((row) => {
      if (isScoreInvalid(row.attendance) || isScoreInvalid(row.midterm) || isScoreInvalid(row.final)) {
        return false;
      }

      return (
        parseScore(row.attendance) !== null &&
        parseScore(row.midterm) !== null &&
        parseScore(row.final) !== null
      );
    });
  }, [isSheetLocked, rows]);

  const updateRow = (
    enrollmentId: string,
    patch: Partial<
      Omit<GradeRowState, "enrollmentId" | "studentCode" | "studentName">
    >,
  ) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.enrollmentId === enrollmentId
          ? {
              ...row,
              ...patch,
            }
          : row,
      ),
    );

    setDirtyRows((currentDirtyRows) => ({
      ...currentDirtyRows,
      [enrollmentId]: true,
    }));
  };

  const persistRow = async (row: GradeRowState) => {
    if (!dirtyRows[row.enrollmentId]) {
      return;
    }

    if (
      isScoreInvalid(row.attendance) ||
      isScoreInvalid(row.midterm) ||
      isScoreInvalid(row.final)
    ) {
      toast.error("Điểm phải nằm trong khoảng 0 đến 10.");
      return;
    }

    if (
      row.status === "APPROVED" ||
      row.status === "LOCKED" ||
      row.status === "SUBMITTED"
    ) {
      return;
    }

    setSavingRows((currentSavingRows) => ({
      ...currentSavingRows,
      [row.enrollmentId]: true,
    }));

    const result = await saveDraftGrades({
      offeringId,
      rows: [
        {
          attendanceScore: parseScore(row.attendance),
          enrollmentId: row.enrollmentId,
          finalScore: parseScore(row.final),
          midtermScore: parseScore(row.midterm),
          remark: row.remark || null,
        },
      ],
    });

    setSavingRows((currentSavingRows) => ({
      ...currentSavingRows,
      [row.enrollmentId]: false,
    }));

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    const savedRow = result.data?.rows.find(
      (saved) => saved.enrollment_id === row.enrollmentId,
    );
    if (savedRow) {
      setRows((currentRows) =>
        currentRows.map((currentRow) =>
          currentRow.enrollmentId === row.enrollmentId
            ? {
                ...currentRow,
                attendance: toSavedScoreValue(savedRow.attendance_score),
                final: toSavedScoreValue(savedRow.final_score),
                midterm: toSavedScoreValue(savedRow.midterm_score),
                serverTotal: savedRow.total_score,
                status: savedRow.status,
              }
            : currentRow,
        ),
      );
    }

    setDirtyRows((currentDirtyRows) => ({
      ...currentDirtyRows,
      [row.enrollmentId]: false,
    }));
  };

  const submitForApproval = () => {
    const confirmed = window.confirm(
      "Gửi toàn bộ bản ghi DRAFT sang SUBMITTED để duyệt?",
    );
    if (!confirmed) {
      return;
    }

    startSubmitTransition(async () => {
      const result = await submitGrades({ offeringId });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setRows((currentRows) =>
        currentRows.map((row) =>
          row.status === "DRAFT" ? { ...row, status: "SUBMITTED" } : row,
        ),
      );
      toast.success(result.message ?? "Đã gửi duyệt bảng điểm.");
    });
  };

  return (
    <div className="space-y-4">
      {initialError ? <FormAlert message={initialError} /> : null}
      {initialSuccess ? <FormAlert message={initialSuccess} success /> : null}

      {isSheetLocked ? (
        <div className="rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-sm text-purple-800">
          Bảng điểm đã LOCKED. Toàn bộ ô nhập đã bị khóa.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {submittedCount > 0
            ? `${submittedCount} bản ghi đang chờ duyệt.`
            : "Chưa có bản ghi nào ở trạng thái SUBMITTED."}
        </div>
        {!isSheetLocked ? (
          <Button
            className="min-h-[44px]"
            disabled={submitPending || !canSubmit}
            onClick={submitForApproval}
            type="button"
            variant="outline"
          >
            {submitPending ? (
              <Loader2Icon className="size-4 animate-spin" data-icon="inline-start" />
            ) : (
              <SendIcon className="size-4" data-icon="inline-start" />
            )}
            {submitPending ? "Đang gửi duyệt..." : "Gửi duyệt"}
          </Button>
        ) : null}
      </div>

      <div className="table-scroll touch-scroll max-h-[70vh] overflow-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[980px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky top-0 z-10 bg-white px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Sinh viên
              </th>
              <th className="sticky top-0 z-10 bg-white px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Chuyên cần
              </th>
              <th className="sticky top-0 z-10 bg-white px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Giữa kỳ
              </th>
              <th className="sticky top-0 z-10 bg-white px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cuối kỳ
              </th>
              <th className="sticky top-0 z-10 bg-white px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tổng điểm
              </th>
              <th className="sticky top-0 z-10 bg-white px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ghi chú
              </th>
              <th className="sticky top-0 z-10 bg-white px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Trạng thái
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const attendanceInvalid = isScoreInvalid(row.attendance);
              const midtermInvalid = isScoreInvalid(row.midterm);
              const finalInvalid = isScoreInvalid(row.final);
              const computedTotal = computeTotalScore(
                row.attendance,
                row.midterm,
                row.final,
                weights,
              );
              const shownTotal = row.serverTotal ?? computedTotal;
              const isReadonly =
                row.status === "LOCKED" ||
                row.status === "APPROVED" ||
                row.status === "SUBMITTED";

              return (
                <tr className="h-[52px] border-b border-border align-top" key={row.enrollmentId}>
                  <td className="px-3 py-3">
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground">
                        {row.studentCode} - {row.studentName}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <StatusBadge value={row.status} />
                        {savingRows[row.enrollmentId] ? (
                          <span className="inline-flex items-center gap-1 text-blue-700">
                            <Loader2Icon className="size-3 animate-spin" />
                            Đang lưu...
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Input
                      className={
                        attendanceInvalid
                          ? "h-10 min-w-[70px] border-red-500 text-center text-red-600"
                          : "h-10 min-w-[70px] text-center"
                      }
                      disabled={isReadonly}
                      inputMode="decimal"
                      max={10}
                      min={0}
                      onBlur={() => {
                        void persistRow(row);
                      }}
                      onChange={(event) =>
                        updateRow(row.enrollmentId, { attendance: event.target.value, serverTotal: null })
                      }
                      step="0.1"
                      type="number"
                      value={row.attendance}
                    />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Input
                      className={
                        midtermInvalid
                          ? "h-10 min-w-[70px] border-red-500 text-center text-red-600"
                          : "h-10 min-w-[70px] text-center"
                      }
                      disabled={isReadonly}
                      inputMode="decimal"
                      max={10}
                      min={0}
                      onBlur={() => {
                        void persistRow(row);
                      }}
                      onChange={(event) =>
                        updateRow(row.enrollmentId, { midterm: event.target.value, serverTotal: null })
                      }
                      step="0.1"
                      type="number"
                      value={row.midterm}
                    />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Input
                      className={
                        finalInvalid
                          ? "h-10 min-w-[70px] border-red-500 text-center text-red-600"
                          : "h-10 min-w-[70px] text-center"
                      }
                      disabled={isReadonly}
                      inputMode="decimal"
                      max={10}
                      min={0}
                      onBlur={() => {
                        void persistRow(row);
                      }}
                      onChange={(event) =>
                        updateRow(row.enrollmentId, { final: event.target.value, serverTotal: null })
                      }
                      step="0.1"
                      type="number"
                      value={row.final}
                    />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={
                        shownTotal === null
                          ? "text-sm text-muted-foreground"
                          : "text-sm font-semibold text-foreground"
                      }
                    >
                      {formatScore(shownTotal)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      className="h-10"
                      disabled={isReadonly}
                      onBlur={() => {
                        void persistRow(row);
                      }}
                      onChange={(event) => updateRow(row.enrollmentId, { remark: event.target.value })}
                      placeholder="Ghi chú"
                      value={row.remark}
                    />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <StatusBadge value={row.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

