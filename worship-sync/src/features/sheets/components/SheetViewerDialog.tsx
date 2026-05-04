"use client";

import Link from "next/link";
import { ExternalLink, X } from "lucide-react";

import { SheetMedia } from "@/features/sheets/components/SheetMedia";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type SheetViewerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songId: string;
  songTitle: string;
  fileUrl: string;
  memo: string | null;
};

export function SheetViewerDialog({
  open,
  onOpenChange,
  songId,
  songTitle,
  fileUrl,
  memo,
}: SheetViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "fixed inset-0 left-0 top-0 z-50 flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-background p-0 shadow-none sm:max-w-none",
          "data-open:zoom-in-100 data-closed:zoom-out-100",
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{songTitle} 악보</DialogTitle>
          <DialogDescription>PDF 또는 이미지 악보 뷰어</DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 items-start gap-2 border-b border-border/70 bg-background/95 px-3 py-3 backdrop-blur-md sm:px-4">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={() => onOpenChange(false)}
            aria-label="닫기"
          >
            <X className="size-4" />
          </Button>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-semibold leading-tight">{songTitle}</p>
            {memo ? (
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{memo}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">리더 메모가 없습니다.</p>
            )}
            <Link
              href={`/sheets/${songId}`}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary underline-offset-4 hover:underline"
            >
              <ExternalLink className="size-3" aria-hidden />
              전용 페이지로 열기
            </Link>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SheetMedia fileUrl={fileUrl} className="min-h-0 flex-1" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
