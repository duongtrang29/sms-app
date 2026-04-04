"use client";

import { SearchIcon, XIcon } from "lucide-react";
import {
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
  searchKey?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  selects?: FilterSelectConfig[];
};

export function FilterToolbar({
  className,
  searchKey = "q",
  searchPlaceholder = "Tìm kiếm…",
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

  function buildUrl(updates: Array<[string, string | null]>) {
    const params = new URLSearchParams(searchParams.toString());

    updates.forEach(([key, value]) => {
      if (value && value.trim()) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function replaceUrl(updates: Array<[string, string | null]>) {
    const nextUrl = buildUrl(updates);
    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  }

  useEffect(() => {
    const currentSearch = searchParams.get(searchKey)?.trim() ?? "";

    if (deferredSearch === currentSearch) {
      return;
    }

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (deferredSearch) {
        params.set(searchKey, deferredSearch);
      } else {
        params.delete(searchKey);
      }

      const query = params.toString();
      const nextUrl = query ? `${pathname}?${query}` : pathname;

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [deferredSearch, pathname, router, searchKey, searchParams, startTransition]);

  const activeChips = useMemo(() => {
    const chips: FilterChip[] = [];

    if (searchParams.get(searchKey)?.trim()) {
      chips.push({
        key: searchKey,
        label: "Từ khóa",
        value: searchParams.get(searchKey) ?? "",
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
  const toolbarColumnsClassName = useMemo(() => {
    if (selects.length >= 3) {
      return "xl:grid-cols-[1.6fr_repeat(3,minmax(0,1fr))_auto]";
    }

    if (selects.length === 2) {
      return "xl:grid-cols-[1.8fr_repeat(2,minmax(0,1fr))_auto]";
    }

    if (selects.length === 1) {
      return "xl:grid-cols-[2fr_minmax(0,1fr)_auto]";
    }

    return "xl:grid-cols-[1fr_auto]";
  }, [selects.length]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn("grid gap-3 md:grid-cols-2", toolbarColumnsClassName)}>
        <div className="relative">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label={searchPlaceholder}
            autoComplete="off"
            className="pl-9"
            name={searchKey}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            spellCheck={false}
            value={search}
          />
        </div>
        {selects.map((select) => {
          const currentValue = searchParams.get(select.key) ?? "";

          return (
            <select
              aria-label={select.label}
              key={select.key}
              className="app-native-select"
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
          );
        })}
        <Button
          aria-label="Xóa toàn bộ bộ lọc"
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
          Xóa lọc
        </Button>
      </div>
      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <Button
              aria-label={`Xóa bộ lọc ${chip.label}`}
              key={`${chip.key}:${chip.value}`}
              className="h-8 rounded-full px-3"
              onClick={() => replaceUrl([[chip.key, null]])}
              size="xs"
              type="button"
              variant="outline"
            >
              {chip.label}: {chip.value}
              <XIcon aria-hidden="true" className="size-3" data-icon="inline-end" />
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
