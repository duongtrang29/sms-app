export type ServerFieldRule = {
  field: string;
  message: string;
  test: RegExp | string | Array<RegExp | string>;
};

export function matchServerFieldErrors(
  sourceMessage: string | undefined,
  rules: ServerFieldRule[],
): Record<string, string[]> | undefined {
  if (!sourceMessage) {
    return undefined;
  }

  const normalizedMessage = sourceMessage.toLowerCase();
  const matches = rules.flatMap((rule) => {
    const tests = Array.isArray(rule.test) ? rule.test : [rule.test];
    const matched = tests.some((test) => {
      if (typeof test === "string") {
        return normalizedMessage.includes(test.toLowerCase());
      }

      return test.test(sourceMessage);
    });

    if (!matched) {
      return [];
    }

    return [[rule.field, [rule.message] as string[]]];
  });

  if (!matches.length) {
    return undefined;
  }

  return Object.fromEntries(matches) as Record<string, string[]>;
}
