"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";

import { createPrepSetlist } from "@/features/setlist/actions/setlistActions";
import {
  addSetlistFormSchema,
  type AddSetlistFormValues,
} from "@/features/setlist/schemas/addSetlist";
import {
  getYoutubeThumbnailUrl,
  getYoutubeVideoId,
  toYoutubeWatchUrl,
} from "@/features/setlist/utils/youtube";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toastPromise } from "@/lib/app-toast";
import { cn } from "@/lib/utils";

function useDebouncedOembedTitle(url: string, debounceMs: number) {
  const videoId = useMemo(() => getYoutubeVideoId(url), [url]);
  const [title, setTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!videoId) {
      return;
    }
    const watchUrl = toYoutubeWatchUrl(videoId);
    const t = window.setTimeout(async () => {
      setLoading(true);
      try {
        const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
        const res = await fetch(endpoint);
        if (!res.ok) {
          setTitle(null);
          return;
        }
        const data = (await res.json()) as { title?: string };
        setTitle(data.title?.trim() ?? null);
      } catch {
        setTitle(null);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
    return () => window.clearTimeout(t);
  }, [videoId, debounceMs, url]);

  return { videoId, title: videoId ? title : null, loading: videoId ? loading : false };
}

function TrackRowPreviewField({
  control,
  index,
}: {
  control: Control<AddSetlistFormValues>;
  index: number;
}) {
  const url = useWatch({ control, name: `tracks.${index}.youtubeUrl`, defaultValue: "" }) ?? "";
  return <TrackRowPreview key={url ? `${index}-${url}` : `empty-${index}`} url={url} />;
}

function TrackRowPreview({ url }: { url: string }) {
  const { videoId, title, loading } = useDebouncedOembedTitle(url, 450);
  const thumb = videoId ? getYoutubeThumbnailUrl(videoId) : null;

  if (!videoId) {
    return (
      <p className="text-[11px] text-muted-foreground">유효한 링크를 입력하면 미리보기가 표시됩니다.</p>
    );
  }

  return (
    <div className="flex gap-4 rounded-lg border border-border/60 bg-muted/25 p-3 shadow-sm">
      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border/60">
        {thumb ? (
          <Image src={thumb} alt="" fill className="object-cover" sizes="96px" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-muted-foreground">미리보기</p>
        <p className="truncate text-sm leading-snug text-foreground">
          {loading ? "제목 불러오는 중…" : title ?? "제목을 가져올 수 없습니다"}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">{videoId}</p>
      </div>
    </div>
  );
}

type AddSetlistDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddSetlistDialog({ open, onOpenChange }: AddSetlistDialogProps) {
  const form = useForm<AddSetlistFormValues>({
    resolver: zodResolver(addSetlistFormSchema),
    defaultValues: {
      title: "",
      eventDate: new Date(),
      tracks: [{ youtubeUrl: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tracks",
  });

  const eventDateValue = useWatch({ control: form.control, name: "eventDate" });

  const resetForm = useCallback(() => {
    form.reset({
      title: "",
      eventDate: new Date(),
      tracks: [{ youtubeUrl: "" }],
    });
  }, [form]);

  useEffect(() => {
    if (!open) return;
    resetForm();
  }, [open, resetForm]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      title: values.title.trim(),
      eventDate: format(values.eventDate, "yyyy-MM-dd"),
      tracks: values.tracks.map((t) => ({
        youtubeUrl: t.youtubeUrl.trim(),
      })),
    };

    try {
      await toastPromise(
        createPrepSetlist(payload).then((result) => {
          if (!result.ok) throw new Error(result.message);
        }),
        "콘티를 저장하는 중이에요…",
      ).unwrap();
      onOpenChange(false);
      resetForm();
    } catch {
      /* handled */
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-h-[min(90vh,720px)] w-[calc(100%-1.5rem)] max-w-lg gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        <div className="border-b border-border/60 px-4 py-4 sm:px-5">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-lg">예습 콘티 추가</DialogTitle>
            <DialogDescription>
              날짜·제목·YouTube 링크를 입력하면 예습(prep) 상태로 저장됩니다.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-5 px-4 py-4 sm:px-5">
          <FieldSet className="gap-4">
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="setlist-title">콘티 제목</FieldLabel>
                <Input
                  id="setlist-title"
                  placeholder="예: 5월 둘째 주 예습"
                  autoComplete="off"
                  aria-invalid={!!form.formState.errors.title}
                  {...form.register("title")}
                />
                <FieldError errors={[form.formState.errors.title]} />
              </Field>

              <Field>
                <FieldLabel>콘티 날짜</FieldLabel>
                <Popover>
                  <PopoverTrigger
                    nativeButton={false}
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-9 w-full justify-start gap-2 text-left font-normal",
                          !eventDateValue && "text-muted-foreground",
                        )}
                      />
                    }
                  >
                    <CalendarIcon className="size-4 opacity-70" />
                    {eventDateValue ? (
                      format(eventDateValue, "PPP", { locale: ko })
                    ) : (
                      <span>날짜 선택</span>
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <Calendar
                      mode="single"
                      selected={eventDateValue}
                      onSelect={(d) => {
                        if (d) form.setValue("eventDate", d, { shouldValidate: true });
                      }}
                      locale={ko}
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
                <FieldDescription>예배·연습 기준 날짜를 선택하세요.</FieldDescription>
                <FieldError errors={[form.formState.errors.eventDate]} />
              </Field>
            </FieldGroup>

            <FieldGroup className="gap-3">
              <div className="flex items-end justify-between gap-2">
                <span className="text-sm font-medium leading-none">수록곡 (YouTube)</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => append({ youtubeUrl: "" })}
                >
                  <Plus className="size-3.5" />
                  곡 줄 추가
                </Button>
              </div>
              <FieldDescription>각 줄에 영상 링크를 넣으면 썸네일·제목이 미리보기됩니다.</FieldDescription>
              {form.formState.errors.tracks &&
              typeof form.formState.errors.tracks === "object" &&
              "message" in form.formState.errors.tracks ? (
                <FieldError>{String(form.formState.errors.tracks.message)}</FieldError>
              ) : null}

              <ul className="flex flex-col gap-4">
                {fields.map((field, index) => (
                  <li
                    key={field.id}
                    className="rounded-xl border border-border/60 bg-card/50 p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <Field className="flex-1 gap-1.5">
                        <FieldLabel htmlFor={`yt-${field.id}`} className="text-xs text-muted-foreground">
                          유튜브 URL · {index + 1}
                        </FieldLabel>
                        <Input
                          id={`yt-${field.id}`}
                          placeholder="https://www.youtube.com/watch?v=…"
                          aria-invalid={!!form.formState.errors.tracks?.[index]?.youtubeUrl}
                          {...form.register(`tracks.${index}.youtubeUrl` as const)}
                        />
                        <FieldError errors={[form.formState.errors.tracks?.[index]?.youtubeUrl]} />
                      </Field>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={fields.length <= 1}
                        onClick={() => remove(index)}
                        aria-label="이 곡 줄 삭제"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <div className="mt-4">
                      <TrackRowPreviewField control={form.control} index={index} />
                    </div>
                  </li>
                ))}
              </ul>
            </FieldGroup>
          </FieldSet>

          <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={form.formState.isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  저장 중…
                </>
              ) : (
                "저장"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddSetlistTriggerButton({
  className,
  variant = "outline",
  size = "sm",
}: {
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn("gap-1.5 shadow-sm", className)}
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        콘티 추가
      </Button>
      <AddSetlistDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
