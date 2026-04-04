"use client";

import { RefreshCwIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

type PageErrorStateProps = {
  description: string;
  title: string;
  reset?: () => void;
};

export function PageErrorState({
  description,
  reset,
  title,
}: PageErrorStateProps) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="w-full max-w-2xl">
        <EmptyState
          action={
            reset ? (
              <Button onClick={() => reset()} type="button" variant="outline">
                <RefreshCwIcon data-icon="inline-start" />
                Thử lại
              </Button>
            ) : undefined
          }
          description={description}
          title={title}
        />
      </div>
    </div>
  );
}
