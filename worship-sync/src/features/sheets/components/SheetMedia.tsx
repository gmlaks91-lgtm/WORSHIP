"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { isImageUrl, isPdfUrl } from "@/features/sheets/lib/file-kind";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SheetMediaProps = {
  fileUrls: string[];
  className?: string;
};

/**
 * 다중 악보 URL을 캐러셀로 표시합니다.
 */
export function SheetMedia({ fileUrls, className }: SheetMediaProps) {
  const [index, setIndex] = useState(0);
  const total = fileUrls.length;
  const currentIndex = total === 0 ? 0 : Math.min(index, total - 1);
  const fileUrl = fileUrls[currentIndex] ?? "";

  if (total === 0) {
    return (
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-2 bg-muted/30 p-6 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        <p>등록된 악보 이미지가 없습니다.</p>
      </div>
    );
  }

  if (isPdfUrl(fileUrl)) {
    return (
      <div className={cn("relative flex h-full w-full flex-col", className)}>
        <iframe
          title="악보 PDF"
          src={fileUrl}
          className="h-full w-full border-0 bg-muted/30"
        />
        {total > 1 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/90 px-2 py-1 shadow-sm">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setIndex((prev) => (prev - 1 + total) % total)}
                aria-label="이전 악보"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentIndex + 1} / {total}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setIndex((prev) => (prev + 1) % total)}
                aria-label="다음 악보"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (isImageUrl(fileUrl)) {
    return (
      <div
        className={cn(
          "relative min-h-0 w-full flex-1 bg-gradient-to-b from-muted/40 to-background",
          className,
        )}
      >
        <Image
          src={fileUrl}
          alt={`악보 ${currentIndex + 1}`}
          fill
          priority
          sizes="100vw"
          className="object-contain"
        />
        {total > 1 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/90 px-2 py-1 shadow-sm">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setIndex((prev) => (prev - 1 + total) % total)}
                aria-label="이전 악보"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentIndex + 1} / {total}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setIndex((prev) => (prev + 1) % total)}
                aria-label="다음 악보"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-2 bg-muted/30 p-6 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      <p>지원하지 않는 형식입니다. PDF 또는 이미지(PNG, JPG, WebP, GIF)를 사용해 주세요.</p>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-4"
      >
        새 탭에서 열기
      </a>
    </div>
  );
}
