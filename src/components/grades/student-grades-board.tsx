"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createRegradeRequestAction } from "@/lib/actions/student/regrade";
import { formatScore } from "@/lib/format";

type GradeBoardRow = {
  attendanceScore: number | null;
  courseCode: string;
  courseName: string;
  enrollmentId: string;
  finalScore: number | null;
  gpaValue: number | null;
  gradeId: string;
  hasPendingRegrade: boolean;
  letterGrade: string | null;
  midtermScore: number | null;
  sectionCode: string;
  semesterCode: string;
  semesterId: string | null;
  status: string;
  totalScore: number | null;
};

type StudentGradesBoardProps = {
  currentSemesterId: string | null;
  rows: GradeBoardRow[];
};

type RegradeDialogState = {
  enrollmentId: string;
  gradeId: string;
  open: boolean;
};

const EMPTY_DIALOG: RegradeDialogState = {
  enrollmentId: "",
  gradeId: "",
  open: false,
};

export function StudentGradesBoard({
  currentSemesterId,
  rows,
}: StudentGradesBoardProps) {
  const [dialog, setDialog] = useState<RegradeDialogState>(EMPTY_DIALOG);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingRegradeMap, setPendingRegradeMap] = useState<Record<string, boolean>>(
    () =>
      rows.reduce<Record<string, boolean>>((accumulator, row) => {
        accumulator[row.gradeId] = row.hasPendingRegrade;
        return accumulator;
      }, {}),
  );

  const cumulativeGpa = useMemo(() => {
    const gpas = rows
      .map((row) => row.gpaValue)
      .filter((value): value is number => value !== null);
    if (!gpas.length) {
      return "0.00";
    }

    return (gpas.reduce((sum, value) => sum + value, 0) / gpas.length).toFixed(2);
  }, [rows]);

  const semesterGpa = useMemo(() => {
    const targetSemesterId =
      currentSemesterId ??
      rows.find((row) => row.semesterId)?.semesterId ??
      null;

    if (!targetSemesterId) {
      return "0.00";
    }

    const gpas = rows
      .filter((row) => row.semesterId === targetSemesterId)
      .map((row) => row.gpaValue)
      .filter((value): value is number => value !== null);

    if (!gpas.length) {
      return "0.00";
    }

    return (gpas.reduce((sum, value) => sum + value, 0) / gpas.length).toFixed(2);
  }, [currentSemesterId, rows]);

  const approvedCount = useMemo(
    () => rows.filter((row) => row.status === "APPROVED" || row.status === "LOCKED").length,
    [rows],
  );

  async function submitRegradeRequest() {
    if (!dialog.gradeId || !dialog.enrollmentId) {
      return;
    }

    if (reason.trim().length < 5) {
      toast.error("Lý do phúc khảo phải có ít nhất 5 ký tự.");
      return;
    }

    setSubmitting(true);
    const payload = new FormData();
    payload.set("grade_id", dialog.gradeId);
    payload.set("enrollment_id", dialog.enrollmentId);
    payload.set("reason", reason.trim());
    const result = await createRegradeRequestAction(payload);
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setPendingRegradeMap((current) => ({
      ...current,
      [dialog.gradeId]: true,
    }));
    setDialog(EMPTY_DIALOG);
    setReason("");
    toast.success(result.message ?? "Đã gửi yêu cầu phúc khảo.");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="app-subtle-surface p-4">
          <div className="text-sm text-muted-foreground">GPA học kỳ</div>
          <div className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{semesterGpa}</div>
        </div>
        <div className="app-subtle-surface p-4">
          <div className="text-sm text-muted-foreground">GPA tích lũy</div>
          <div className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{cumulativeGpa}</div>
        </div>
        <div className="app-subtle-surface p-4">
          <div className="text-sm text-muted-foreground">Học phần đã duyệt/khóa</div>
          <div className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{approvedCount}</div>
        </div>
      </div>

      <div className="grid gap-4">
        {rows.map((row) => {
          const hasPending = pendingRegradeMap[row.gradeId] ?? false;

          return (
            <div className="app-subtle-surface p-4" key={row.gradeId}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {row.courseCode} - {row.courseName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {row.semesterCode} | Nhóm {row.sectionCode}
                  </div>
                </div>
                <StatusBadge value={row.status} />
              </div>

              <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                <div>
                  Chuyên cần: <span className="font-medium text-foreground">{formatScore(row.attendanceScore)}</span>
                </div>
                <div>
                  Giữa kỳ: <span className="font-medium text-foreground">{formatScore(row.midtermScore)}</span>
                </div>
                <div>
                  Cuối kỳ: <span className="font-medium text-foreground">{formatScore(row.finalScore)}</span>
                </div>
                <div>
                  Tổng: <span className="font-medium text-foreground">{formatScore(row.totalScore)}</span>
                </div>
                <div>
                  Điểm chữ: <span className="font-medium text-foreground">{row.letterGrade ?? "Chưa có"}</span>
                </div>
                <div>
                  GPA point: <span className="font-medium text-foreground">{formatScore(row.gpaValue)}</span>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  disabled={hasPending}
                  onClick={() => {
                    setDialog({
                      enrollmentId: row.enrollmentId,
                      gradeId: row.gradeId,
                      open: true,
                    });
                  }}
                  type="button"
                  variant="outline"
                >
                  {hasPending ? "Đã có yêu cầu PENDING" : "Gửi phúc khảo"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setDialog(EMPTY_DIALOG);
            setReason("");
            setSubmitting(false);
          } else {
            setDialog((current) => ({ ...current, open: true }));
          }
        }}
        open={dialog.open}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto touch-scroll">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>Gửi yêu cầu phúc khảo</DialogTitle>
            <DialogDescription>
              Nhập lý do chi tiết để giảng viên xem xét lại điểm.
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 pb-2">
            <Textarea
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ví dụ: Em đề nghị kiểm tra lại điểm giữa kỳ vì có thể chưa cập nhật câu tự luận..."
              rows={5}
              value={reason}
            />
          </div>
          <DialogFooter>
            <Button
              disabled={submitting}
              onClick={() => {
                setDialog(EMPTY_DIALOG);
                setReason("");
              }}
              type="button"
              variant="ghost"
            >
              Hủy
            </Button>
            <Button
              disabled={submitting}
              onClick={() => {
                void submitRegradeRequest();
              }}
              type="button"
            >
              {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

