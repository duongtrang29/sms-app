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
  const url = new URL(`http://local${path}`);

  updates.forEach(([key, value]) => {
    if (value && value.trim()) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
  });

  const query = url.searchParams.toString();
  return query ? `${url.pathname}?${query}` : url.pathname;
}

export function buildReturnPath(
  basePath: string,
  filters: Array<[string, string | null | undefined]>,
) {
  return buildPathWithUpdates(basePath, filters);
}

export function buildEditPath(returnTo: string, editId: string) {
  return buildPathWithUpdates(returnTo, [["edit", editId]]);
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
