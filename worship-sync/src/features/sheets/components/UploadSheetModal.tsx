"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { registerSheet } from "@/features/sheets/actions/sheetActions";
import { toastError, toastPromise } from "@/lib/app-toast";
import { extensionFromFile } from "@/features/sheets/lib/file-kind";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
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
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ACCEPT = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
} as const;

type UploadSheetModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songId: string;
  songTitle: string;
};

export function UploadSheetModal({
  open,
  onOpenChange,
  songId,
  songTitle,
}: UploadSheetModalProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = useCallback(() => {
    setFile(null);
    setMemo("");
  }, []);

  const onDrop = useCallback((accepted: File[]) => {
    const next = accepted[0];
    if (next) setFile(next);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } = useDropzone({
    onDrop,
    multiple: false,
    maxFiles: 1,
    accept: ACCEPT,
    disabled: busy,
  });

  const fileLabel = useMemo(() => {
    if (!file) return "파일을 선택하세요";
    return file.name;
  }, [file]);

  const onSubmit = async () => {
    if (!file) {
      toastError("업로드할 파일을 선택해 주세요.");
      return;
    }

    setBusy(true);
    try {
      await toastPromise(
        (async () => {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) throw new Error("로그인이 필요합니다.");

          const ext = extensionFromFile(file);
          const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

          const { error: uploadError } = await supabase.storage.from("sheets").upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });

          if (uploadError) throw new Error(uploadError.message);

          const { data: pub } = supabase.storage.from("sheets").getPublicUrl(path);
          const publicUrl = pub.publicUrl;

          const result = await registerSheet({
            songId,
            fileUrl: publicUrl,
            memo: memo.trim().length ? memo.trim() : undefined,
          });

          if (!result.ok) throw new Error(result.message);
        })(),
        "악보를 업로드하는 중이에요…",
      ).unwrap();

      reset();
      onOpenChange(false);
      router.refresh();
    } catch {
      /* toastPromise가 처리 */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="border-b border-border/60 px-4 py-4 sm:px-5">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-base">악보 등록</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              <span className="font-medium text-foreground">{songTitle}</span> 곡에 PDF 또는 이미지를
              연결합니다.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
          <FieldSet className="gap-3">
            <Field className="gap-2">
              <FieldLabel>파일</FieldLabel>
              <div
                {...getRootProps()}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center transition-[background,border-color]",
                  isDragActive && "border-primary/50 bg-primary/5",
                  busy && "pointer-events-none opacity-60",
                )}
              >
                <input {...getInputProps()} />
                <UploadCloud className="size-8 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium text-foreground">
                  {isDragActive ? "여기에 놓으세요" : "드래그 앤 드롭 또는 클릭"}
                </p>
                <p className="text-xs text-muted-foreground">PDF, PNG, JPG, WebP, GIF · 최대 50MB</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openFilePicker}
                  disabled={busy}
                >
                  파일 선택
                </Button>
                <span className="truncate text-xs text-muted-foreground">{fileLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">또는</span>
                <Input
                  type="file"
                  accept="application/pdf,image/*"
                  disabled={busy}
                  className="h-8 flex-1 text-xs file:mr-2 file:text-xs"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }}
                />
              </div>
            </Field>

            <Field className="gap-2">
              <FieldLabel htmlFor="sheet-memo">메모 (선택)</FieldLabel>
              <textarea
                id="sheet-memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                disabled={busy}
                placeholder="예: 인트로 2마디 반복, 브릿지 템포 주의"
                className={cn(
                  "min-h-[88px] w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors",
                  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
                )}
              />
              <FieldDescription>태블릿 뷰어 상단에 작게 표시됩니다.</FieldDescription>
            </Field>
          </FieldSet>

          <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button
              type="button"
              className="gap-1.5"
              onClick={onSubmit}
              disabled={busy || !file}
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  업로드 중…
                </>
              ) : (
                "업로드 및 저장"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UploadSheetTriggerButton({
  songId,
  songTitle,
  className,
}: {
  songId: string;
  songTitle: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
      >
        악보 등록
      </Button>
      <UploadSheetModal open={open} onOpenChange={setOpen} songId={songId} songTitle={songTitle} />
    </>
  );
}
