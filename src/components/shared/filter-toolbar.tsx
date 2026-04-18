"use client";

import { ListFilterIcon, RotateCcwIcon, SearchIcon, XIcon } from "lucide-react";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SelectOption } from "@/types/forms";

type FilterSelectConfig = {
  key: string;
  label: string;
  options: SelectOption[];
  placeholder: string;
};

type FilterChip = {
  key: string;
  label: string;
  value: string;
};

type FilterToolbarProps = {
  className?: string;
  resultCount?: number;
  resultLabel?: string;
  searchKey?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  selects?: FilterSelectConfig[];
};

export function FilterToolbar({
  className,
  resultCount,
  resultLabel = "bản ghi",
  searchKey = "q",
  searchPlaceholder = "Tìm kiếm",
  searchValue = "",
  selects = [],
}: FilterToolbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchValue);
  const deferredSearch = useDeferredValue(search.trim());
  const selectKeys = useMemo(() => selects.map((select) => select.key), [selects]);

  const replaceUrl = useCallback(
    (updates: Array<[string, string | null]>) => {
      const params = new URLSearchParams(searchParams.toString());

      updates.forEach(([key, value]) => {
        if (value && value.trim()) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      const query = params.toString();
      const nextUrl = query ? `${pathname}?${query}` : pathname;

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const currentSearch = searchParams.get(searchKey)?.trim() ?? "";

    if (deferredSearch === currentSearch) {
      return;
    }

    const timer = window.setTimeout(() => {
      replaceUrl([[searchKey, deferredSearch || null]]);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [deferredSearch, replaceUrl, searchKey, searchParams]);

  const activeChips = useMemo(() => {
    const chips: FilterChip[] = [];

    const keyword = searchParams.get(searchKey)?.trim();
    if (keyword) {
      chips.push({
        key: searchKey,
        label: "Từ khóa",
        value: keyword,
      });
    }

    selects.forEach((select) => {
      const selectedValue = searchParams.get(select.key);
      if (!selectedValue) {
        return;
      }

      const selectedOption = select.options.find(
        (option) => option.value === selectedValue,
      );

      if (!selectedOption) {
        return;
      }

      chips.push({
        key: select.key,
        label: select.label,
        value: selectedOption.label,
      });
    });

    return chips;
  }, [searchKey, searchParams, selects]);

  const hasActiveFilters = activeChips.length > 0;

  return (
    <div className={cn("space-y-3", className)}>
      {typeof resultCount === "number" ? (
        <p aria-live="polite" className="sr-only">
          {isPending ? "Đang cập nhật dữ liệu." : `Đang hiển thị ${resultCount} ${resultLabel}.`}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.8fr_repeat(3,minmax(0,1fr))_auto]">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            aria-label={searchPlaceholder}
            className="pl-9"
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            value={search}
          />
        </div>

        {selects.map((select) => {
          const currentValue = searchParams.get(select.key) ?? "";

          return (
            <div className="relative" key={select.key}>
              <ListFilterIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
              <select
                aria-label={select.label}
                className="app-native-select pl-9"
                onChange={(event) =>
                  replaceUrl([[select.key, event.target.value || null]])
                }
                value={currentValue}
              >
                <option value="">{select.placeholder}</option>
                {select.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          );
        })}

        <Button
          disabled={!hasActiveFilters || isPending}
          onClick={() =>
            replaceUrl([
              [searchKey, null],
              ...selectKeys.map((key) => [key, null] as [string, null]),
            ])
          }
          type="button"
          variant="outline"
        >
          <RotateCcwIcon className="size-4" data-icon="inline-start" />
          Xóa lọc
        </Button>
      </div>

      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <Button
              className="h-8"
              key={`${chip.key}:${chip.value}`}
              onClick={() => replaceUrl([[chip.key, null]])}
              size="xs"
              type="button"
              variant="ghost"
            >
              {chip.label}: {chip.value}
              <XIcon className="size-3" data-icon="inline-end" />
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
