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
import { initialActionState } from "@/lib/actions";
import { useApplyServerFormErrors } from "@/lib/form-errors";
import { upsertRoomAction } from "@/features/rooms/actions";
import { roomSchema, type RoomInput } from "@/features/rooms/schemas";
import type { Room } from "@/types/app";
import type { FormMode } from "@/types/forms";

type RoomFormProps = {
  room?: Room | null;
  returnTo?: string;
};

const EMPTY_ROOM_VALUES: RoomInput = {
  building: "",
  capacity: 40,
  code: "",
  id: undefined,
  name: "",
  status: "ACTIVE",
};

function mapRoomToFormValues(room: Room | null | undefined): RoomInput {
  if (!room) {
    return EMPTY_ROOM_VALUES;
  }

  return {
    building: room.building ?? "",
    capacity: room.capacity ?? 40,
    code: room.code ?? "",
    id: room.id,
    name: room.name ?? "",
    status: room.is_active ? "ACTIVE" : "INACTIVE",
  };
}

export function RoomForm({ room, returnTo = "/admin/rooms" }: RoomFormProps) {
  const [state, submitAction] = useActionState(upsertRoomAction, initialActionState);
  const [isPending, startTransition] = useTransition();
  const mode: FormMode = room ? "edit" : "create";
  const formValues = useMemo(() => mapRoomToFormValues(room), [room]);
  const form = useForm<RoomInput>({
    resolver: zodResolver(roomSchema),
    defaultValues: EMPTY_ROOM_VALUES,
    reValidateMode: "onChange",
  });
  useApplyServerFormErrors(form, state.errors);
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
        payload.set("code", values.code);
        payload.set("name", values.name);
        payload.set("building", values.building ?? "");
        payload.set("capacity", String(values.capacity));
        payload.set("status", values.status);

        startTransition(() => submitAction(payload));
      })}
    >
      <FormContainer>
        <FormSection
          description="Mã phòng, tên hiển thị và sức chứa dùng cho xếp lịch và kiểm tra trùng phòng."
          title="Thông Tin Cơ Bản"
        >
          <FormGrid>
            <Field data-invalid={!!form.formState.errors.code}>
              <FieldLabel htmlFor="room-code">Mã phòng</FieldLabel>
              <FieldContent>
                <Input
                  autoComplete="off"
                  id="room-code"
                  spellCheck={false}
                  {...form.register("code")}
                />
                <FieldError errors={[form.formState.errors.code]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="room-name">Tên phòng</FieldLabel>
              <FieldContent>
                <Input id="room-name" {...form.register("name")} />
                <FieldError errors={[form.formState.errors.name]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.building}>
              <FieldLabel htmlFor="room-building">Tòa nhà</FieldLabel>
              <FieldContent>
                <Input id="room-building" {...form.register("building")} />
                <FieldError errors={[form.formState.errors.building]} />
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.capacity}>
              <FieldLabel htmlFor="room-capacity">Sức chứa</FieldLabel>
              <FieldContent>
                <Input
                  id="room-capacity"
                  type="number"
                  {...form.register("capacity", { valueAsNumber: true })}
                />
                <FieldError errors={[form.formState.errors.capacity]} />
              </FieldContent>
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection
          description="Phòng có thể bị tạm ngưng nếu đang bảo trì hoặc không còn sử dụng để xếp lịch."
          title="Thông Tin Hệ Thống"
        >
          <FormGrid>
            <Field data-invalid={!!form.formState.errors.status}>
              <FieldLabel>Trạng thái</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={(value) =>
                    form.setValue("status", value as RoomInput["status"], {
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
                      <SelectItem value="ACTIVE">Sẵn sàng</SelectItem>
                      <SelectItem value="INACTIVE">Ngưng sử dụng</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.status]} />
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
          {mode === "edit" ? "Cập nhật phòng" : "Tạo phòng"}
        </SubmitButton>
      </FormStickyFooter>
    </form>
  );
}
