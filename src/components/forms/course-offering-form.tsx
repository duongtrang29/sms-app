"use client";

import { useActionState, useEffect, useMemo, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { FormAlert } from "@/components/forms/form-alert";
import {
  FormContainer,
  FormGrid,
  FormSection,
  FormStickyFooter,
} from "@/components/forms/form-container";
import { SubmitButton } from "@/components/forms/submit-button";
import { RelationSelect } from "@/components/forms/relation-select";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { upsertCourseOfferingAction } from "@/features/course-offerings/actions";
import {
  courseOfferingSchema,
  type CourseOfferingInput,
} from "@/features/course-offerings/schemas";
import { initialActionState } from "@/lib/actions";
import { useApplyServerFormErrors } from "@/lib/form-errors-client";
import type { CourseOfferingRecord } from "@/features/course-offerings/queries";
import type { FormMode, SelectOption } from "@/types/forms";

type CourseOfferingFormProps = {
  courseOptions: SelectOption[];
  lecturerOptions: SelectOption[];
  offering?: CourseOfferingRecord | null;
  returnTo?: string;
  semesterOptions: SelectOption[];
};

const EMPTY_COURSE_OFFERING_VALUES: CourseOfferingInput = {
  attendance_weight: 10,
  course_id: "",
  final_weight: 60,
  id: undefined,
  lecturer_id: undefined,
  max_capacity: 40,
  midterm_weight: 30,
  notes: "",
  passing_score: 5,
  registration_close_at: "",
  registration_open_at: "",
  section_code: "01",
  semester_id: "",
  status: "DRAFT",
  title: "",
};

function mapCourseOfferingToFormValues(
  offering: CourseOfferingRecord | null | undefined,
  fallbackCourseId: string,
  fallbackSemesterId: string,
): CourseOfferingInput {
  if (!offering) {
    return {
      ...EMPTY_COURSE_OFFERING_VALUES,
      course_id: fallbackCourseId,
      semester_id: fallbackSemesterId,
    };
  }

  return {
    attendance_weight: offering.attendance_weight ?? 10,
    course_id: offering.course_id ?? fallbackCourseId,
    final_weight: offering.final_weight ?? 60,
    id: offering.id,
    lecturer_id: offering.lecturer_id ?? undefined,
    max_capacity: offering.max_capacity ?? 40,
    midterm_weight: offering.midterm_weight ?? 30,
    notes: offering.notes ?? "",
    passing_score: offering.passing_score ?? 5,
    registration_close_at: offering.registration_close_at?.slice(0, 16) ?? "",
    registration_open_at: offering.registration_open_at?.slice(0, 16) ?? "",
    section_code: offering.section_code ?? "01",
    semester_id: offering.semester_id ?? fallbackSemesterId,
    status: offering.status ?? "DRAFT",
    title: offering.title ?? "",
  };
}

export function CourseOfferingForm({
  courseOptions,
  lecturerOptions,
  offering,
  returnTo = "/admin/offerings",
  semesterOptions,
}: CourseOfferingFormProps) {
  const [state, submitAction] = useActionState(
    upsertCourseOfferingAction,
    initialActionState,
  );
  const [isPending, startTransition] = useTransition();
  const mode: FormMode = offering ? "edit" : "create";
  const formValues = useMemo(
    () =>
      mapCourseOfferingToFormValues(
        offering,
        courseOptions[0]?.value ?? "",
        semesterOptions[0]?.value ?? "",
      ),
    [courseOptions, offering, semesterOptions],
  );
  const form = useForm<CourseOfferingInput>({
    resolver: zodResolver(courseOfferingSchema),
    defaultValues: EMPTY_COURSE_OFFERING_VALUES,
    reValidateMode: "onChange",
  });
  useApplyServerFormErrors(form, state.errors);
  const courseId = useWatch({
    control: form.control,
    name: "course_id",
  });
  const semesterId = useWatch({
    control: form.control,
    name: "semester_id",
  });
  const lecturerId = useWatch({
    control: form.control,
    name: "lecturer_id",
  });
  const status = useWatch({
    control: form.control,
    name: "status",
  });

  useEffect(() => {
    form.reset(formValues);
  }, [form, formValues, mode]);

  useEffect(() => {
    if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state.message, state.success]);

  return (
    <form
      className="flex flex-col"
      onSubmit={form.handleSubmit((values) => {
        const payload = new FormData();
        payload.set("return_to", returnTo);
        if (values.id) {
          payload.set("id", values.id);
        }
        payload.set("course_id", values.course_id);
        payload.set("semester_id", values.semester_id);
        payload.set("section_code", values.section_code);
        payload.set("title", values.title ?? "");
        payload.set("max_capacity", String(values.max_capacity));
        payload.set("registration_open_at", values.registration_open_at);
        payload.set("registration_close_at", values.registration_close_at);
        payload.set("attendance_weight", String(values.attendance_weight));
        payload.set("midterm_weight", String(values.midterm_weight));
        payload.set("final_weight", String(values.final_weight));
        payload.set("passing_score", String(values.passing_score));
        payload.set("status", values.status);
        payload.set("notes", values.notes ?? "");
        if (values.lecturer_id) {
          payload.set("lecturer_id", values.lecturer_id);
        }

        startTransition(() => submitAction(payload));
      })}
    >
      <FormContainer>
        <FormSection
          description="Chọn môn học, học kỳ và giảng viên chính cho học phần được mở."
          title="Thông Tin Cơ Bản"
        >
          <FormGrid>
            <Field data-invalid={!!form.formState.errors.course_id}>
              <FieldLabel>Môn học</FieldLabel>
              <FieldContent>
                <RelationSelect
                  onValueChange={(value) => {
                    if (!value) {
                      return;
                    }

                    form.setValue("course_id", value, { shouldValidate: true });
                  }}
                  options={courseOptions}
                  placeholder="Chọn môn học"
                  value={courseId}
                />
                <FieldError errors={[form.formState.errors.course_id]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.semester_id}>
              <FieldLabel>Học kỳ</FieldLabel>
              <FieldContent>
                <RelationSelect
                  onValueChange={(value) => {
                    if (!value) {
                      return;
                    }

                    form.setValue("semester_id", value, {
                      shouldValidate: true,
                    });
                  }}
                  options={semesterOptions}
                  placeholder="Chọn học kỳ"
                  value={semesterId}
                />
                <FieldError errors={[form.formState.errors.semester_id]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.lecturer_id}>
              <FieldLabel>Giảng viên chính</FieldLabel>
              <FieldContent>
                <RelationSelect
                  allowEmpty
                  emptyLabel="Chưa gán giảng viên"
                  onValueChange={(value) =>
                    form.setValue("lecturer_id", value, { shouldValidate: true })
                  }
                  options={lecturerOptions}
                  placeholder="Chọn giảng viên"
                  value={lecturerId}
                />
                <FieldError errors={[form.formState.errors.lecturer_id]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.status}>
              <FieldLabel>Trạng thái</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={(value) =>
                    form.setValue("status", value as CourseOfferingInput["status"], {
                      shouldValidate: true,
                    })
                  }
                  value={status}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="DRAFT">Nháp</SelectItem>
                      <SelectItem value="OPEN">Mở đăng ký</SelectItem>
                      <SelectItem value="CLOSED">Đã đóng</SelectItem>
                      <SelectItem value="FINISHED">Kết thúc</SelectItem>
                      <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.status]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.section_code}>
              <FieldLabel htmlFor="offering-section-code">Nhóm</FieldLabel>
              <FieldContent>
                <Input id="offering-section-code" {...form.register("section_code")} />
                <FieldError errors={[form.formState.errors.section_code]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.title}>
              <FieldLabel htmlFor="offering-title">Tiêu đề</FieldLabel>
              <FieldContent>
                <Input id="offering-title" {...form.register("title")} />
                <FieldError errors={[form.formState.errors.title]} />
              </FieldContent>
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection
          description="Cấu hình sức chứa, thời gian đăng ký và cơ cấu điểm của học phần."
          title="Thông Tin Học Tập"
        >
          <FormGrid columns={3}>
            <Field data-invalid={!!form.formState.errors.max_capacity}>
              <FieldLabel htmlFor="offering-max-capacity">Sĩ số tối đa</FieldLabel>
              <FieldContent>
                <Input
                  id="offering-max-capacity"
                  type="number"
                  {...form.register("max_capacity", { valueAsNumber: true })}
                />
                <FieldError errors={[form.formState.errors.max_capacity]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.passing_score}>
              <FieldLabel htmlFor="offering-passing-score">Điểm đạt</FieldLabel>
              <FieldContent>
                <Input
                  id="offering-passing-score"
                  step="0.1"
                  type="number"
                  {...form.register("passing_score", { valueAsNumber: true })}
                />
                <FieldError errors={[form.formState.errors.passing_score]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.attendance_weight}>
              <FieldLabel htmlFor="offering-attendance-weight">CC (%)</FieldLabel>
              <FieldContent>
                <Input
                  id="offering-attendance-weight"
                  type="number"
                  {...form.register("attendance_weight", { valueAsNumber: true })}
                />
                <FieldError errors={[form.formState.errors.attendance_weight]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.midterm_weight}>
              <FieldLabel htmlFor="offering-midterm-weight">GK (%)</FieldLabel>
              <FieldContent>
                <Input
                  id="offering-midterm-weight"
                  type="number"
                  {...form.register("midterm_weight", { valueAsNumber: true })}
                />
                <FieldError errors={[form.formState.errors.midterm_weight]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.final_weight}>
              <FieldLabel htmlFor="offering-final-weight">CK (%)</FieldLabel>
              <FieldContent>
                <Input
                  id="offering-final-weight"
                  type="number"
                  {...form.register("final_weight", { valueAsNumber: true })}
                />
                <FieldError errors={[form.formState.errors.final_weight]} />
              </FieldContent>
            </Field>
            <Field className="md:col-span-2 xl:col-span-1" data-invalid={!!form.formState.errors.registration_open_at}>
              <FieldLabel htmlFor="offering-registration-open">Mở đăng ký</FieldLabel>
              <FieldContent>
                <Input
                  id="offering-registration-open"
                  type="datetime-local"
                  {...form.register("registration_open_at")}
                />
                <FieldError errors={[form.formState.errors.registration_open_at]} />
              </FieldContent>
            </Field>
            <Field className="md:col-span-2 xl:col-span-1" data-invalid={!!form.formState.errors.registration_close_at}>
              <FieldLabel htmlFor="offering-registration-close">Đóng đăng ký</FieldLabel>
              <FieldContent>
                <Input
                  id="offering-registration-close"
                  type="datetime-local"
                  {...form.register("registration_close_at")}
                />
                <FieldError errors={[form.formState.errors.registration_close_at]} />
              </FieldContent>
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection
          description="Ghi chú nội bộ giúp quản trị viên và giảng viên theo dõi bối cảnh mở học phần."
          title="Thông Tin Hệ Thống"
        >
          <FormGrid>
            <Field className="md:col-span-2" data-invalid={!!form.formState.errors.notes}>
              <FieldLabel htmlFor="offering-notes">Ghi chú</FieldLabel>
              <FieldContent>
                <Textarea id="offering-notes" rows={4} {...form.register("notes")} />
                <FieldError errors={[form.formState.errors.notes]} />
              </FieldContent>
            </Field>
          </FormGrid>
        </FormSection>
      </FormContainer>
      <FormStickyFooter>
        <div className="min-w-0 flex-1">
          <FormAlert message={state.message} success={state.success} />
        </div>
        <SubmitButton className="w-full md:w-auto" pending={isPending}>
          {mode === "edit" ? "Cập nhật học phần mở" : "Tạo học phần mở"}
        </SubmitButton>
      </FormStickyFooter>
    </form>
  );
}
