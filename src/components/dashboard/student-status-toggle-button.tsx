"use client";

import { CircleOffIcon, Loader2Icon, RotateCcwIcon } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleStudentStatusOptimisticAction } from "@/features/students/actions";

type StudentAccessStatus = "ACTIVE" | "INACTIVE" | "LOCKED";

type StudentStatusToggleButtonProps = {
  studentCode: string;
  studentId: string;
  status: StudentAccessStatus;
};

function resolveNextStatus(status: StudentAccessStatus): Exclude<StudentAccessStatus, "LOCKED"> {
  return status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
}

export function StudentStatusToggleButton({
  studentCode,
  studentId,
  status,
}: StudentStatusToggleButtonProps) {
  const router = useRouter();
  const [committedStatus, setCommittedStatus] = useState<StudentAccessStatus>(status);
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    committedStatus,
    (_current, next: StudentAccessStatus) => next,
  );
  const [isPending, startTransition] = useTransition();

  const nextStatus = resolveNextStatus(optimisticStatus);
  const isActive = optimisticStatus === "ACTIVE";

  function handleToggle() {
    const message = isActive
      ? `Tạm ngưng tài khoản sinh viên ${studentCode}?`
      : `Kích hoạt lại tài khoản sinh viên ${studentCode}?`;

    if (!window.confirm(message)) {
      return;
    }

    startTransition(async () => {
      const previousStatus = committedStatus;
      setOptimisticStatus(nextStatus);

      const result = await toggleStudentStatusOptimisticAction({
        nextStatus,
        studentId,
      });

      if (!result.success) {
        setOptimisticStatus(previousStatus);
        toast.error(result.error);
        return;
      }

      const resolvedStatus = result.nextStatus;
      setCommittedStatus(resolvedStatus);
      setOptimisticStatus(resolvedStatus);
      toast.success(result.message);

      if (result.warning) {
        toast.warning(result.warning);
      }

      router.refresh();
    });
  }

  return (
    <Button
      aria-label={isActive ? "Tạm ngưng tài khoản" : "Kích hoạt tài khoản"}
      disabled={isPending}
      onClick={handleToggle}
      size="icon-sm"
      title={isActive ? "Tạm ngưng tài khoản" : "Kích hoạt tài khoản"}
      type="button"
      variant={isActive ? "outline" : "success"}
    >
      {isPending ? (
        <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
      ) : isActive ? (
        <CircleOffIcon aria-hidden="true" className="size-4" />
      ) : (
        <RotateCcwIcon aria-hidden="true" className="size-4" />
      )}
    </Button>
  );
}
