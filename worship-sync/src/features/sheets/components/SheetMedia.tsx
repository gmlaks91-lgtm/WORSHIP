"use client";

import Image from "next/image";

import { isImageUrl, isPdfUrl } from "@/features/sheets/lib/file-kind";
import { cn } from "@/lib/utils";

type SheetMediaProps = {
  fileUrl: string;
  className?: string;
};

/**
 * PDF는 iframe, 이미지는 next/image(object-contain)로 표시합니다.
 */
export function SheetMedia({ fileUrl, className }: SheetMediaProps) {
  if (isPdfUrl(fileUrl)) {
    return (
      <iframe
        title="악보 PDF"
        src={fileUrl}
        className={cn("h-full w-full border-0 bg-muted/30", className)}
      />
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
          alt="악보"
          fill
          priority
          sizes="100vw"
          className="object-contain"
        />
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
