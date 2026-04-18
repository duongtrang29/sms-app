import { CheckIcon, FileTextIcon, RotateCcwIcon } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { resolveRegradeRequestFormAction } from "@/features/regrades/actions";
import type { RegradeReviewRow } from "@/features/regrades/queries";
import { getAllowedNextRegradeStatuses } from "@/features/regrades/transitions";
import { formatDateTime, formatScore } from "@/lib/format";

const regradeStatusLabel: Record<RegradeReviewRow["status"], string> = {
  CANCELLED: "Đã hủy",
  PENDING: "Chờ xử lý",
  REJECTED: "Từ chối",
  RESOLVED: "Đã xử lý",
  UNDER_REVIEW: "Đang xem xét",
};

export function RegradeReviewList({
  rows,
  returnTo,
}: {
  returnTo: string;
  rows: RegradeReviewRow[];
}) {
  return (
    <div className="grid gap-4">
      {rows.map((request) => {
        const availableTransitions = getAllowedNextRegradeStatuses(request.status);
        const canTransition = availableTransitions.length > 0;
        const defaultStatus = availableTransitions[0] ?? request.status;
        const statusInputId = `regrade-status-${request.id}`;
        const resolvedTotalScoreInputId = `regrade-resolved-score-${request.id}`;
        const resolutionNoteInputId = `regrade-resolution-note-${request.id}`;

        return (
          <Card key={request.id} className="overflow-hidden border-border/70 shadow-none">
            <CardHeader>
              <CardTitle className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <span>
                  {request.course_code} - {request.course_name}
                </span>
                <StatusBadge value={request.status} />
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
              <div className="grid gap-3 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                  Sinh viên:{" "}
                  <span className="font-medium text-foreground">
                    {request.student_code} - {request.student_name}
                  </span>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                  Học phần: {request.semester_code} | Nhóm {request.section_code}
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                  Trạng thái điểm hiện tại:{" "}
                  <span className="font-medium text-foreground">
                    <StatusBadge value={request.grade_status} />
                  </span>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                  Điểm trước phúc khảo: {formatScore(request.previous_total_score)} | Điểm hiện tại:{" "}
                  {formatScore(request.current_total_score)}
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                  Gửi lúc: {formatDateTime(request.submitted_at)} | Người xử lý:{" "}
                  {request.reviewer_name ?? "Chưa có"}
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-foreground">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <FileTextIcon className="size-3.5" />
                    Lý do phúc khảo
                  </div>
                  {request.reason}
                </div>
              </div>
              <div className="app-subtle-surface p-4">
                <form action={resolveRegradeRequestFormAction} className="grid gap-3">
                  <input name="request_id" type="hidden" value={request.id} />
                  <input name="return_to" type="hidden" value={returnTo} />
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <RotateCcwIcon className="size-4 text-[color:var(--color-info)]" />
                    Cập nhật xử lý
                  </div>
                  <label className="text-label text-muted-foreground" htmlFor={statusInputId}>
                    Trạng thái mới
                  </label>
                  <select
                    className="app-native-select"
                    defaultValue={defaultStatus}
                    disabled={!canTransition}
                    id={statusInputId}
                    name="status"
                  >
                    {availableTransitions.map((status) => (
                      <option key={`${request.id}-${status}`} value={status}>
                        {regradeStatusLabel[status]}
                      </option>
                    ))}
                  </select>
                  <label
                    className="text-label text-muted-foreground"
                    htmlFor={resolvedTotalScoreInputId}
                  >
                    Điểm sau phúc khảo
                  </label>
                  <Input
                    defaultValue={request.resolved_total_score ?? ""}
                    id={resolvedTotalScoreInputId}
                    max={10}
                    min={0}
                    name="resolved_total_score"
                    placeholder="Điểm sau phúc khảo…"
                    step="0.01"
                    type="number"
                  />
                  <label className="text-label text-muted-foreground" htmlFor={resolutionNoteInputId}>
                    Kết quả xử lý
                  </label>
                  <Textarea
                    defaultValue={request.resolution_note ?? ""}
                    id={resolutionNoteInputId}
                    name="resolution_note"
                    placeholder="Kết quả xử lý, căn cứ phúc khảo, thay đổi nếu có…"
                    rows={5}
                  />
                  <Button disabled={!canTransition} type="submit">
                    <CheckIcon data-icon="inline-start" />
                    Cập nhật xử lý
                  </Button>
                  {!canTransition ? (
                    <p className="text-xs text-muted-foreground">
                      Yêu cầu đã ở trạng thái kết thúc và không thể chuyển tiếp.
                    </p>
                  ) : null}
                </form>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
