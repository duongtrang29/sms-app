"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { cancelEnrollment, registerEnrollment } from "@/lib/actions/student/enrollment";
import { formatDateTime, weekdayLabel } from "@/lib/format";

type ScheduleSlot = {
  day_of_week: number;
  end_time: string;
  start_time: string;
};

type EnrollmentCourseCard = {
  courseCode: string;
  courseName: string;
  creditHours: number;
  enrolledCount: number;
  enrollmentId: string;
  lecturerName: string;
  maxCapacity: number;
  offeringId: string;
  offeringStatus: string;
  registrationCloseAt: string;
  registrationOpenAt: string;
  schedules: ScheduleSlot[];
  sectionCode: string;
  semesterCode: string;
  status: string;
};

type OpenCourseCard = {
  courseCode: string;
  courseName: string;
  creditHours: number;
  enrolledCount: number;
  lecturerName: string;
  maxCapacity: number;
  offeringId: string;
  offeringStatus: string;
  registrationCloseAt: string;
  registrationOpenAt: string;
  schedules: ScheduleSlot[];
  sectionCode: string;
  semesterCode: string;
};

type StudentEnrollmentBoardProps = {
  initialEnrolled: EnrollmentCourseCard[];
  initialOpen: OpenCourseCard[];
};

function hasTimeOverlap(
  first: Pick<ScheduleSlot, "end_time" | "start_time">,
  second: Pick<ScheduleSlot, "end_time" | "start_time">,
) {
  return first.start_time < second.end_time && first.end_time > second.start_time;
}

function buildScheduleLabel(schedule: ScheduleSlot) {
  return `${weekdayLabel(schedule.day_of_week)} ${schedule.start_time}-${schedule.end_time}`;
}

function scheduleSummary(slots: ScheduleSlot[]) {
  if (!slots.length) {
    return "Chưa có lịch học";
  }

  return slots.map((slot) => buildScheduleLabel(slot)).join("; ");
}

export function StudentEnrollmentBoard({
  initialEnrolled,
  initialOpen,
}: StudentEnrollmentBoardProps) {
  const [openCards, setOpenCards] = useState(initialOpen);
  const [enrolledCards, setEnrolledCards] = useState(initialEnrolled);
  const [pendingMap, setPendingMap] = useState<Record<string, boolean>>({});
  const [hoveredOfferingId, setHoveredOfferingId] = useState<string | null>(null);

  const enrolledOfferingsMap = useMemo(
    () => new Map(enrolledCards.map((card) => [card.offeringId, card])),
    [enrolledCards],
  );

  const conflictMap = useMemo(() => {
    const nextMap = new Map<string, string[]>();

    openCards.forEach((openCard) => {
      const conflicts: string[] = [];

      enrolledCards.forEach((enrolledCard) => {
        const overlap = openCard.schedules.some(
          (openSlot) =>
            enrolledCard.schedules.some(
              (enrolledSlot) =>
                openSlot.day_of_week === enrolledSlot.day_of_week &&
                hasTimeOverlap(openSlot, enrolledSlot),
            ),
        );

        if (overlap) {
          conflicts.push(
            `${enrolledCard.courseCode} - ${enrolledCard.sectionCode}`,
          );
        }
      });

      if (conflicts.length) {
        nextMap.set(openCard.offeringId, conflicts);
      }
    });

    return nextMap;
  }, [enrolledCards, openCards]);

  const stats = useMemo(() => {
    const registeredCredits = enrolledCards.reduce(
      (sum, card) => sum + (card.status === "ENROLLED" ? card.creditHours : 0),
      0,
    );

    return {
      openCount: openCards.length,
      registeredCount: enrolledCards.filter((card) => card.status === "ENROLLED").length,
      registeredCredits,
    };
  }, [enrolledCards, openCards]);

  async function handleRegister(card: OpenCourseCard) {
    setPendingMap((current) => ({ ...current, [card.offeringId]: true }));
    const result = await registerEnrollment(card.offeringId);
    setPendingMap((current) => ({ ...current, [card.offeringId]: false }));

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setOpenCards((current) =>
      current.filter((item) => item.offeringId !== card.offeringId),
    );
    setEnrolledCards((current) => [
      {
        ...card,
        enrollmentId:
          result.data?.enrollmentId ||
          `${card.offeringId}-${Date.now().toString(36)}`,
        status: "ENROLLED",
      },
      ...current,
    ]);
    toast.success(result.message ?? "Đăng ký thành công");
  }

  async function handleCancel(card: EnrollmentCourseCard) {
    setPendingMap((current) => ({ ...current, [card.enrollmentId]: true }));
    const result = await cancelEnrollment(card.enrollmentId);
    setPendingMap((current) => ({ ...current, [card.enrollmentId]: false }));

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setEnrolledCards((current) =>
      current.filter((item) => item.enrollmentId !== card.enrollmentId),
    );
    if (card.offeringStatus === "OPEN") {
      setOpenCards((current) => [
        {
          courseCode: card.courseCode,
          courseName: card.courseName,
          creditHours: card.creditHours,
          enrolledCount: card.enrolledCount,
          lecturerName: card.lecturerName,
          maxCapacity: card.maxCapacity,
          offeringId: card.offeringId,
          offeringStatus: card.offeringStatus,
          registrationCloseAt: card.registrationCloseAt,
          registrationOpenAt: card.registrationOpenAt,
          schedules: card.schedules,
          sectionCode: card.sectionCode,
          semesterCode: card.semesterCode,
        },
        ...current.filter((item) => item.offeringId !== card.offeringId),
      ]);
    }

    toast.success(result.message ?? "Hủy đăng ký thành công");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white px-3 py-1.5 text-sm text-muted-foreground">
          <span className="app-status-dot bg-[color:var(--color-info)]" />
          Học phần đang mở: {stats.openCount}
        </div>
        <div className="touch-scroll max-h-[70vh] space-y-4 pr-1">
          {openCards.length ? (
            openCards.map((card) => {
              const conflicts = conflictMap.get(card.offeringId) ?? [];
              const isHovered = hoveredOfferingId === card.offeringId;
              const isPending = Boolean(pendingMap[card.offeringId]);
              const alreadyEnrolled = enrolledOfferingsMap.has(card.offeringId);

              return (
                <div
                  className="app-subtle-surface flex flex-col gap-3 p-4"
                  key={card.offeringId}
                  onMouseEnter={() => setHoveredOfferingId(card.offeringId)}
                  onMouseLeave={() => setHoveredOfferingId((current) => (current === card.offeringId ? null : current))}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">
                        {card.courseCode} - {card.courseName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {card.semesterCode} | Nhóm {card.sectionCode} |{" "}
                        {card.lecturerName}
                      </div>
                    </div>
                    <StatusBadge value={card.offeringStatus} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {scheduleSummary(card.schedules)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Mở đăng ký: {formatDateTime(card.registrationOpenAt)} | Đóng đăng ký:{" "}
                    {formatDateTime(card.registrationCloseAt)}
                  </div>
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-white px-3 py-1.5 text-sm text-muted-foreground">
                    <span className="app-status-dot bg-[color:var(--color-success)]" />
                    Còn {Math.max(0, card.maxCapacity - card.enrolledCount)}/{card.maxCapacity} chỗ
                  </div>
                  {isHovered && conflicts.length ? (
                    <div className="rounded-md border border-[color:var(--color-warning)]/40 bg-[color:var(--color-warning-soft)] px-3 py-2 text-sm text-[color:var(--color-warning-foreground)]">
                      Trùng lịch với: {conflicts.join(", ")}
                    </div>
                  ) : null}
                  <div className="flex justify-end">
                    {alreadyEnrolled ? (
                      <span className="text-sm font-medium text-[color:var(--color-success-foreground)]">
                        Đã đăng ký
                      </span>
                    ) : (
                      <Button
                        disabled={isPending}
                        onClick={() => {
                          void handleRegister(card);
                        }}
                        type="button"
                      >
                        {isPending ? "Đang xử lý..." : "Đăng ký"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              description="Hiện chưa có học phần nào sẵn sàng để đăng ký."
              title="Không có học phần mở"
            />
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white px-3 py-1.5 text-sm text-muted-foreground">
            <span className="app-status-dot bg-[color:var(--color-success)]" />
            Đã đăng ký: {stats.registeredCount}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white px-3 py-1.5 text-sm text-muted-foreground">
            <span className="app-status-dot bg-[color:var(--color-primary)]" />
            Tín chỉ hiện tại: {stats.registeredCredits}
          </div>
        </div>
        <div className="touch-scroll max-h-[70vh] space-y-4 pr-1">
          {enrolledCards.length ? (
            enrolledCards.map((card) => {
              const isPending = Boolean(pendingMap[card.enrollmentId]);

              return (
                <div className="app-subtle-surface flex flex-col gap-3 p-4" key={card.enrollmentId}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">
                        {card.courseCode} - {card.courseName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {card.semesterCode} | Nhóm {card.sectionCode} | {card.lecturerName}
                      </div>
                    </div>
                    <StatusBadge value={card.status} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {scheduleSummary(card.schedules)}
                  </div>
                  {card.status === "ENROLLED" ? (
                    <div className="flex justify-end">
                      <Button
                        disabled={isPending}
                        onClick={() => {
                          void handleCancel(card);
                        }}
                        type="button"
                        variant="outline"
                      >
                        {isPending ? "Đang xử lý..." : "Hủy đăng ký"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <EmptyState
              description="Bạn chưa đăng ký học phần nào."
              title="Chưa có học phần đã đăng ký"
            />
          )}
        </div>
      </div>
    </div>
  );
}

