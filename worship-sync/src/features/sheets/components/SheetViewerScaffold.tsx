"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, X, Edit3, History } from "lucide-react";

import { SheetFeedbackForm } from "@/features/sheets/components/SheetFeedbackForm";
import { SheetMedia } from "@/features/sheets/components/SheetMedia";
import { EditSheetDialog } from "@/features/sheets/components/EditSheetDialog";
import { SheetRevisionHistory } from "@/features/sheets/components/SheetRevisionHistory";
import { Button, buttonVariants } from "@/components/ui/button";
import type { SheetRevision, SheetChords, SheetStructure } from "@/features/sheets/types";
import { cn } from "@/lib/utils";

type SheetViewerScaffoldProps = {
  songId: string;
  songTitle: string;
  fileUrls: string[];
  memo: string | null;
  mode: "dialog" | "page";
  onClose?: () => void;
  sheetId?: string;
  chords?: SheetChords | null;
  songStructure?: SheetStructure | null;
  revisions?: (SheetRevision & { editor_name?: string })[];
};

export function SheetViewerScaffold({
  songId,
  songTitle,
  fileUrls,
  memo,
  mode,
  onClose,
  sheetId,
  chords,
  songStructure,
  revisions = [],
}: SheetViewerScaffoldProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-start gap-2 border-b border-border/70 bg-background/95 px-3 py-3 backdrop-blur-md sm:px-4">
          {mode === "dialog" ? (
            <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} aria-label="닫기">
              <X className="size-4" />
            </Button>
          ) : (
            <Link href="/sheets" aria-label="악보 목록으로" className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}>
              <ArrowLeft className="size-4" />
            </Link>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-semibold leading-tight sm:text-base">{songTitle}</p>
            {memo ? (
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{memo}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">리더 메모가 없습니다.</p>
            )}
            {mode === "dialog" ? (
              <Link
                href={`/sheets/${songId}`}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary underline-offset-4 hover:underline"
              >
                전용 페이지로 열기
              </Link>
            ) : null}
          </div>

          {/* 액션 버튼 */}
          {mode === "page" && sheetId && (
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditOpen(true)}
                title="악보 편집"
              >
                <Edit3 className="size-4" />
              </Button>
              {revisions && revisions.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setHistoryOpen(!historyOpen)}
                  title="수정 이력"
                >
                  <History className="size-4" />
                </Button>
              )}
            </div>
          )}
        </header>

        <div className="flex min-h-[55vh] flex-1 flex-col overflow-y-auto">
          <SheetMedia fileUrls={fileUrls} className="min-h-[45vh]" />
          <div className="px-3 py-4 sm:px-4 space-y-6">
            {/* 수정 이력 */}
            {historyOpen && revisions && revisions.length > 0 && (
              <SheetRevisionHistory revisions={revisions} />
            )}

            <SheetFeedbackForm songTitle={songTitle} />
          </div>
        </div>
      </div>

      {/* 편집 다이얼로그 */}
      {sheetId && (
        <EditSheetDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          sheetId={sheetId}
          songTitle={songTitle}
          currentChords={chords}
          currentStructure={songStructure}
          currentMemo={memo}
        />
      )}
    </>
  );
}
