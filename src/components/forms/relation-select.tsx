"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { resolveOptionLabel } from "@/lib/options";
import type { SelectOption } from "@/types/forms";

const EMPTY_SELECT_VALUE = "__empty__";

type RelationSelectProps = {
  allowEmpty?: boolean;
  className?: string;
  emptyLabel?: string;
  onValueChange: (value: string | undefined) => void;
  options: SelectOption[];
  placeholder: string;
  value?: string | null | undefined;
};

export function RelationSelect({
  allowEmpty = false,
  className,
  emptyLabel = "Chưa chọn",
  onValueChange,
  options,
  placeholder,
  value,
}: RelationSelectProps) {
  const selectedValue =
    typeof value === "string" && value.trim() ? value : undefined;
  const selectedLabel = resolveOptionLabel(options, selectedValue);
  const controlValue =
    selectedValue ?? (allowEmpty ? EMPTY_SELECT_VALUE : undefined);

  return (
    <Select
      onValueChange={(nextValue) => {
        if (allowEmpty && nextValue === EMPTY_SELECT_VALUE) {
          onValueChange(undefined);
          return;
        }

        onValueChange(nextValue ?? undefined);
      }}
      value={controlValue}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder}>
          {selectedLabel ?? (selectedValue ? "Mục hiện tại không còn khả dụng" : undefined)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {allowEmpty ? (
            <SelectItem value={EMPTY_SELECT_VALUE}>{emptyLabel}</SelectItem>
          ) : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
          {selectedValue && !selectedLabel ? (
            <SelectItem value={selectedValue}>
              Mục hiện tại không còn khả dụng
            </SelectItem>
          ) : null}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
