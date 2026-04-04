import type { SelectOption } from "@/types/forms";

export function composeOptionLabel(
  ...parts: Array<string | null | undefined>
) {
  const labels = parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return labels.length ? labels.join(" - ") : "Chưa có thông tin";
}

export function mapOptions<T>(
  data: T[],
  labelGetter: (item: T) => string,
  valueGetter?: (item: T) => string,
): SelectOption[] {
  return data.map((item) => {
    const fallbackValue =
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      typeof item.id === "string"
        ? item.id
        : "";

    return {
      label: composeOptionLabel(labelGetter(item)),
      value: valueGetter ? valueGetter(item) : fallbackValue,
    } satisfies SelectOption;
  });
}

export function resolveOptionLabel(
  options: SelectOption[],
  value: string | null | undefined,
) {
  if (!value) {
    return undefined;
  }

  return options.find((option) => option.value === value)?.label;
}
