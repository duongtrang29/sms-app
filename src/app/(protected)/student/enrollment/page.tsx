import StudentEnrollmentsPage from "@/app/(protected)/student/enrollments/page";

type StudentEnrollmentAliasPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StudentEnrollmentAliasPage({
  searchParams,
}: StudentEnrollmentAliasPageProps) {
  const resolvedSearchParams = await searchParams;
  const mergedSearchParams = {
    ...resolvedSearchParams,
    return_to:
      typeof resolvedSearchParams.return_to === "string"
        ? resolvedSearchParams.return_to
        : "/student/enrollment",
  };

  return StudentEnrollmentsPage({
    searchParams: Promise.resolve(mergedSearchParams),
  });
}
