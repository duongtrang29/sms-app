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
import { upsertScheduleAction } from "@/features/schedules/actions";
import {
  scheduleSchema,
  type ScheduleInput,
} from "@/features/schedules/schemas";
import { initialActionState } from "@/lib/actions";
import { useApplyServerFormErrors } from "@/lib/form-errors";
import type { Schedule } from "@/types/app";
import type { FormMode, SelectOption } from "@/types/forms";

type ScheduleFormProps = {
  courseOfferingOptions: SelectOption[];
  roomOptions: SelectOption[];
  schedule?: Schedule | null;
};

const EMPTY_SCHEDULE_VALUES: ScheduleInput = {
  course_offering_id: "",
  day_of_week: 1,
  end_date: "",
  end_time: "09:30",
  id: undefined,
  note: "",
  room_id: undefined,
  start_date: "",
  start_time: "07:30",
  week_pattern: "ALL",
};

function mapScheduleToFormValues(
  schedule: Schedule | null | undefined,
  fallbackCourseOfferingId: string,
  fallbackRoomId?: string,
): ScheduleInput {
  if (!schedule) {
    return {
      ...EMPTY_SCHEDULE_VALUES,
      course_offering_id: fallbackCourseOfferingId,
      room_id: fallbackRoomId,
    };
  }

  return {
    course_offering_id: schedule.course_offering_id ?? fallbackCourseOfferingId,
    day_of_week: schedule.day_of_week ?? 1,
    end_date: schedule.end_date ?? "",
    end_time: schedule.end_time ?? "09:30",
    id: schedule.id,
    note: schedule.note ?? "",
    room_id: schedule.room_id ?? fallbackRoomId,
    start_date: schedule.start_date ?? "",
    start_time: schedule.start_time ?? "07:30",
    week_pattern: schedule.week_pattern ?? "ALL",
  };
}

export function ScheduleForm({
  courseOfferingOptions,
  roomOptions,
  schedule,
}: ScheduleFormProps) {
  const [state, submitAction] = useActionState(
    upsertScheduleAction,
    initialActionState,
  );
  const [isPending, startTransition] = useTransition();
  const mode: FormMode = schedule ? "edit" : "create";
  const formValues = useMemo(
    () =>
      mapScheduleToFormValues(
        schedule,
        courseOfferingOptions[0]?.value ?? "",
        roomOptions[0]?.value,
      ),
    [courseOfferingOptions, roomOptions, schedule],
  );
  const form = useForm<ScheduleInput>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: EMPTY_SCHEDULE_VALUES,
    reValidateMode: "onChange",
  });
  useApplyServerFormErrors(form, state.errors);
  const courseOfferingId = useWatch({
    control: form.control,
    name: "course_offering_id",
  });
  const roomId = useWatch({
    control: form.control,
    name: "room_id",
  });
  const dayOfWeek = useWatch({
    control: form.control,
    name: "day_of_week",
  });
  const weekPattern = useWatch({
    control: form.control,
    name: "week_pattern",
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
        if (values.id) {
          payload.set("id", values.id);
        }
        payload.set("course_offering_id", values.course_offering_id);
        payload.set("day_of_week", String(values.day_of_week));
        payload.set("start_time", values.start_time);
        payload.set("end_time", values.end_time);
        payload.set("start_date", values.start_date ?? "");
        payload.set("end_date", values.end_date ?? "");
        payload.set("note", values.note ?? "");
        payload.set("week_pattern", values.week_pattern ?? "ALL");
        if (values.room_id) {
          payload.set("room_id", values.room_id);
        }

        startTransition(() => submitAction(payload));
      })}
    >
      <FormContainer>
        <FormSection
          description="Gắn lịch với học phần mở, phòng học và thứ trong tuần để hệ thống kiểm tra trùng lịch chính xác."
          title="Thông Tin Cơ Bản"
        >
          <FormGrid>
            <Field data-invalid={!!form.formState.errors.course_offering_id}>
              <FieldLabel>Học phần</FieldLabel>
              <FieldContent>
                <RelationSelect
                  onValueChange={(value) => {
                    if (!value) {
                      return;
                    }

                    form.setValue("course_offering_id", value, {
                      shouldValidate: true,
                    });
                  }}
                  options={courseOfferingOptions}
                  placeholder="Chọn học phần"
                  value={courseOfferingId}
                />
                <FieldError errors={[form.formState.errors.course_offering_id]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.room_id}>
              <FieldLabel>Phòng học</FieldLabel>
              <FieldContent>
                <RelationSelect
                  allowEmpty
                  emptyLabel="Chưa gán phòng"
                  onValueChange={(value) =>
                    form.setValue("room_id", value, {
                      shouldValidate: true,
                    })
                  }
                  options={roomOptions}
                  placeholder="Chọn phòng học"
                  value={roomId}
                />
                <FieldError errors={[form.formState.errors.room_id]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.day_of_week}>
              <FieldLabel>Thứ</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={(value) =>
                    form.setValue("day_of_week", Number(value), {
                      shouldValidate: true,
                    })
                  }
                  value={String(dayOfWeek)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="1">Thứ hai</SelectItem>
                      <SelectItem value="2">Thứ ba</SelectItem>
                      <SelectItem value="3">Thứ tư</SelectItem>
                      <SelectItem value="4">Thứ năm</SelectItem>
                      <SelectItem value="5">Thứ sáu</SelectItem>
                      <SelectItem value="6">Thứ bảy</SelectItem>
                      <SelectItem value="7">Chủ nhật</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.day_of_week]} />
              </FieldContent>
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection
          description="Thiết lập khung giờ, tuần học và khoảng thời gian lịch có hiệu lực."
          title="Thông Tin Học Tập"
        >
          <FormGrid columns={3}>
            <Field data-invalid={!!form.formState.errors.start_time}>
              <FieldLabel htmlFor="schedule-start-time">Bắt đầu</FieldLabel>
              <FieldContent>
                <Input
                  id="schedule-start-time"
                  type="time"
                  {...form.register("start_time")}
                />
                <FieldError errors={[form.formState.errors.start_time]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.end_time}>
              <FieldLabel htmlFor="schedule-end-time">Kết thúc</FieldLabel>
              <FieldContent>
                <Input
                  id="schedule-end-time"
                  type="time"
                  {...form.register("end_time")}
                />
                <FieldError errors={[form.formState.errors.end_time]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.week_pattern}>
              <FieldLabel>Chu kỳ tuần</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={(value) =>
                    form.setValue("week_pattern", value ?? "ALL", {
                      shouldValidate: true,
                    })
                  }
                  value={weekPattern ?? "ALL"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="ALL">Mọi tuần</SelectItem>
                      <SelectItem value="ODD">Tuần lẻ</SelectItem>
                      <SelectItem value="EVEN">Tuần chẵn</SelectItem>
                      {weekPattern &&
                      !["ALL", "ODD", "EVEN"].includes(weekPattern) ? (
                        <SelectItem value={weekPattern}>{weekPattern}</SelectItem>
                      ) : null}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.week_pattern]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.start_date}>
              <FieldLabel htmlFor="schedule-start-date">Ngày hiệu lực</FieldLabel>
              <FieldContent>
                <Input
                  id="schedule-start-date"
                  type="date"
                  {...form.register("start_date")}
                />
                <FieldError errors={[form.formState.errors.start_date]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.end_date}>
              <FieldLabel htmlFor="schedule-end-date">Ngày kết thúc</FieldLabel>
              <FieldContent>
                <Input
                  id="schedule-end-date"
                  type="date"
                  {...form.register("end_date")}
                />
                <FieldError errors={[form.formState.errors.end_date]} />
              </FieldContent>
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection
          description="Ghi chú nội bộ như tuần bù, lịch học đặc biệt hoặc yêu cầu phòng."
          title="Thông Tin Hệ Thống"
        >
          <FormGrid>
            <Field className="md:col-span-2" data-invalid={!!form.formState.errors.note}>
              <FieldLabel htmlFor="schedule-note">Ghi chú</FieldLabel>
              <FieldContent>
                <Textarea id="schedule-note" rows={4} {...form.register("note")} />
                <FieldError errors={[form.formState.errors.note]} />
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
          {mode === "edit" ? "Cập nhật lịch học" : "Tạo lịch học"}
        </SubmitButton>
      </FormStickyFooter>
    </form>
  );
}
