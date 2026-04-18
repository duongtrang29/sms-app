import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { listCourses } from "@/features/courses/queries";
import { listAssignedOfferingsForLecturer } from "@/features/grades/queries";
import { listSemesters } from "@/features/semesters/queries";

export default async function LecturerOfferingsPage() {
  const [courses, offerings, semesters] = await Promise.all([
    listCourses(),
    listAssignedOfferingsForLecturer(),
    listSemesters(),
  ]);

  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const semesterMap = new Map(semesters.map((semester) => [semester.id, semester]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Các học phần được phân công, dùng để nhập điểm và theo dõi bảng điểm."
        title="Lớp học phần được phân công"
      />
      <div className="grid gap-4">
        {offerings.map((offering) => {
          const course = courseMap.get(offering.course_id);
          const semester = semesterMap.get(offering.semester_id);

          return (
            <Card key={offering.id} className="shadow-none">
              <CardHeader>
                <CardTitle>
                  {course?.code} - {course?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    {semester?.code} | Nhóm {offering.section_code}
                    <StatusBadge value={offering.status} />
                  </span>
                </div>
                <Link
                  className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  href={`/lecturer/grades/${offering.id}`}
                >
                  Mở bảng điểm
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
