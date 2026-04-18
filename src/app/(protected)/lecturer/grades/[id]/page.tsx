import GradebookPage from "@/app/(protected)/lecturer/offerings/[offeringId]/page";

type LecturerGradesAliasPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LecturerGradesAliasPage({
  params,
  searchParams,
}: LecturerGradesAliasPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const mergedSearchParams = {
    ...resolvedSearchParams,
    return_to:
      typeof resolvedSearchParams.return_to === "string"
        ? resolvedSearchParams.return_to
        : `/lecturer/grades/${id}`,
  };

  return GradebookPage({
    params: Promise.resolve({ offeringId: id }),
    searchParams: Promise.resolve(mergedSearchParams),
  });
}
