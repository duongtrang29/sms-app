export function getSearchParamString(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export function getStringField(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : null;
}

export function buildPathWithUpdates(
  path: string,
  updates: Array<[string, string | null | undefined]>,
) {
  const [rawPath = "/", rawQuery = ""] = path.split("?", 2);
  const normalizedPath = rawPath.trim() || "/";
  const pathname = normalizedPath.startsWith("/")
    ? normalizedPath
    : `/${normalizedPath}`;
  const searchParams = new URLSearchParams(rawQuery);

  updates.forEach(([key, value]) => {
    if (value && value.trim()) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
  });

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildReturnPath(
  basePath: string,
  filters: Array<[string, string | null | undefined]>,
) {
  return buildPathWithUpdates(basePath, filters);
}

export function buildCreatePath(returnTo: string) {
  return buildPathWithUpdates(returnTo, [
    ["edit", null],
    ["mode", "create"],
  ]);
}

export function buildEditPath(returnTo: string, editId: string) {
  return buildPathWithUpdates(returnTo, [
    ["mode", null],
    ["edit", editId],
  ]);
}

export function buildImportPath(returnTo: string) {
  return buildPathWithUpdates(returnTo, [
    ["edit", null],
    ["mode", "import"],
  ]);
}

export function getSafeReturnPath(
  formData: FormData,
  fallbackPath: string,
  allowedPrefix: string,
) {
  const returnTo = getStringField(formData, "return_to");
  return returnTo && returnTo.startsWith(allowedPrefix)
    ? returnTo
    : fallbackPath;
}
