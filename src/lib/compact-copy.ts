export type CompactCopyResult = {
  details?: string;
  summary?: string;
};

function normalizeCopy(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function trimTrailingPunctuation(text: string) {
  return text.replace(/[,:;.\-–—\s]+$/, "").trim();
}

export function getCompactCopy(
  text: string | undefined,
  options?: {
    maxLength?: number;
  },
): CompactCopyResult {
  if (!text) {
    return {};
  }

  const normalized = normalizeCopy(text);

  if (!normalized) {
    return {};
  }

  const maxLength = options?.maxLength ?? 68;

  if (normalized.length <= maxLength) {
    return { summary: normalized };
  }

  const sentenceMatch = normalized.match(/^(.+?[.!?])(\s|$)/);
  const firstSentence = sentenceMatch?.[1]?.trim();

  if (firstSentence && firstSentence.length <= maxLength) {
    return {
      details: normalized,
      summary: firstSentence,
    };
  }

  const clauses = normalized
    .split(/[,:;]-?\s|\s[-–—]\s/)
    .map((part) => trimTrailingPunctuation(part))
    .filter(Boolean);

  const firstClause = clauses.find((part) => part.length <= maxLength);

  if (firstClause) {
    return {
      details: normalized,
      summary: firstClause,
    };
  }

  return {
    details: normalized,
    summary: `${trimTrailingPunctuation(normalized.slice(0, maxLength))}…`,
  };
}
