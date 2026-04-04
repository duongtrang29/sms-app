import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { resolveRegradeRequestFormAction } from "@/features/regrades/actions";
import type { RegradeReviewRow } from "@/features/regrades/queries";
import { formatDateTime, formatScore } from "@/lib/format";

export function RegradeReviewList({ rows }: { rows: RegradeReviewRow[] }) {
  return (
    <div className="grid gap-4">
      {rows.map((request) => (
        <Card key={request.id} className="shadow-none">
          <CardHeader>
            <CardTitle className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <span>
                {request.course_code} - {request.course_name}
              </span>
              <StatusBadge value={request.status} />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div>
                Sinh viên:{" "}
                <span className="font-medium text-foreground">
                  {request.student_code} - {request.student_name}
                </span>
              </div>
              <div>
                Học phần: {request.semester_code} | Nhóm {request.section_code}
              </div>
              <div>
                Trạng thái điểm hiện tại:{" "}
                <span className="font-medium text-foreground">
                  <StatusBadge value={request.grade_status} />
                </span>
              </div>
              <div>
                Điểm trước phúc khảo: {formatScore(request.previous_total_score)} | Điểm hiện tại:{" "}
                {formatScore(request.current_total_score)}
              </div>
              <div>
                Gửi lúc: {formatDateTime(request.submitted_at)} | Người xử lý:{" "}
                {request.reviewer_name ?? "Chưa có"}
              </div>
              <div className="rounded-xl border border-border p-3 text-foreground">
                {request.reason}
              </div>
            </div>
            <form action={resolveRegradeRequestFormAction} className="grid gap-3">
              <input name="request_id" type="hidden" value={request.id} />
              <select
                className="app-native-select"
                defaultValue={request.status}
                name="status"
              >
                <option value="PENDING">Chờ xử lý</option>
                <option value="UNDER_REVIEW">Đang xem xét</option>
                <option value="RESOLVED">Đã xử lý</option>
                <option value="REJECTED">Từ chối</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
              <Input
                defaultValue={request.resolved_total_score ?? ""}
                name="resolved_total_score"
                placeholder="Điểm sau phúc khảo (nếu có)"
                type="number"
              />
              <Textarea
                defaultValue={request.resolution_note ?? ""}
                name="resolution_note"
                placeholder="Kết quả xử lý, căn cứ phúc khảo, thay đổi nếu có"
                rows={5}
              />
              <Button type="submit">Cập nhật xử lý</Button>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
