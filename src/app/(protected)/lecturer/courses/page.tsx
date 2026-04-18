import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCourses } from "@/features/courses/queries";
import { listAssignedOfferingsForLecturer } from "@/features/grades/queries";
import { listSemesters } from "@/features/semesters/queries";

export default async function LecturerCoursesPage() {
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
        description="Danh sách học phần bạn phụ trách, dùng để xem danh sách sinh viên và nhập điểm."
        title="Học phần giảng dạy"
      />
      <div className="grid gap-4">
        {offerings.length ? (
          offerings.map((offering) => {
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
          })
        ) : (
          <EmptyState
            description="Bạn chưa được phân công học phần nào trong học kỳ hiện tại."
            title="Chưa có học phần phụ trách"
          />
        )}
      </div>
    </div>
  );
}
