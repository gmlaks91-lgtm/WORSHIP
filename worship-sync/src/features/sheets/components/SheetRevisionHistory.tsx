"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import type { SheetRevision } from "@/features/sheets/types";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

type SheetRevisionHistoryProps = {
  revisions: (SheetRevision & { editor_name?: string })[];
};

export function SheetRevisionHistory({ revisions }: SheetRevisionHistoryProps) {
  const [expandedRevisions, setExpandedRevisions] = useState<Set<string>>(new Set());

  const toggleExpand = (revisionId: string) => {
    const newSet = new Set(expandedRevisions);
    if (newSet.has(revisionId)) {
      newSet.delete(revisionId);
    } else {
      newSet.add(revisionId);
    }
    setExpandedRevisions(newSet);
  };

  if (revisions.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-150 bg-neutral-50 px-4 py-6 text-center">
        <p className="text-sm text-neutral-500">수정 이력이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-neutral-900">수정 이력</h3>
      <div className="space-y-2">
        {revisions.map((revision) => {
          const isExpanded = expandedRevisions.has(revision.id);
          const relativeTime = formatDistanceToNow(new Date(revision.edited_at), {
            addSuffix: true,
            locale: ko,
          });

          return (
            <div key={revision.id} className="rounded-lg border border-neutral-150 bg-white">
              <button
                type="button"
                onClick={() => toggleExpand(revision.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 transition-colors"
              >
                <div className="flex-1 text-left space-y-1">
                  <p className="text-sm font-medium text-neutral-900">
                    {revision.change_summary || "수정됨"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {revision.editor_name || "Unknown"} • {relativeTime}
                  </p>
                </div>
                <div className="shrink-0 text-neutral-400">
                  {isExpanded ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-neutral-150 bg-neutral-50 px-4 py-3 space-y-3">
                  {/* 코드 변경사항 */}
                  {(revision.chords_before || revision.chords_after) && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-neutral-700">코드</p>
                      <div className="grid grid-cols-2 gap-2">
                        {revision.chords_before && (
                          <div className="rounded bg-red-50 p-2 border border-red-200/50">
                            <p className="text-[11px] text-red-700 font-medium mb-1">수정 전</p>
                            <div className="space-y-0.5">
                              {revision.chords_before.chords && (
                                <p className="text-xs text-red-600">
                                  {revision.chords_before.chords.join(", ")}
                                </p>
                              )}
                              {revision.chords_before.progression && (
                                <p className="text-[11px] text-red-600 italic">
                                  {revision.chords_before.progression}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        {revision.chords_after && (
                          <div className="rounded bg-green-50 p-2 border border-green-200/50">
                            <p className="text-[11px] text-green-700 font-medium mb-1">수정 후</p>
                            <div className="space-y-0.5">
                              {revision.chords_after.chords && (
                                <p className="text-xs text-green-600">
                                  {revision.chords_after.chords.join(", ")}
                                </p>
                              )}
                              {revision.chords_after.progression && (
                                <p className="text-[11px] text-green-600 italic">
                                  {revision.chords_after.progression}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 진행 순서 변경사항 */}
                  {(revision.song_structure_before || revision.song_structure_after) && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-neutral-700">진행 순서</p>
                      <div className="grid grid-cols-2 gap-2">
                        {revision.song_structure_before && (
                          <div className="rounded bg-red-50 p-2 border border-red-200/50">
                            <p className="text-[11px] text-red-700 font-medium mb-1">수정 전</p>
                            <div className="space-y-0.5">
                              {revision.song_structure_before.order && (
                                <p className="text-xs text-red-600">
                                  {revision.song_structure_before.order.join(", ")}
                                </p>
                              )}
                              {revision.song_structure_before.sections && (
                                <p className="text-[11px] text-red-600">
                                  {revision.song_structure_before.sections.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        {revision.song_structure_after && (
                          <div className="rounded bg-green-50 p-2 border border-green-200/50">
                            <p className="text-[11px] text-green-700 font-medium mb-1">수정 후</p>
                            <div className="space-y-0.5">
                              {revision.song_structure_after.order && (
                                <p className="text-xs text-green-600">
                                  {revision.song_structure_after.order.join(", ")}
                                </p>
                              )}
                              {revision.song_structure_after.sections && (
                                <p className="text-[11px] text-green-600">
                                  {revision.song_structure_after.sections.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 메모 변경사항 */}
                  {(revision.memo_before !== undefined || revision.memo_after !== undefined) && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-neutral-700">메모</p>
                      <div className="grid grid-cols-2 gap-2">
                        {revision.memo_before !== undefined && (
                          <div className="rounded bg-red-50 p-2 border border-red-200/50">
                            <p className="text-[11px] text-red-700 font-medium mb-1">수정 전</p>
                            <p className="text-xs text-red-600 line-clamp-3">
                              {revision.memo_before || "(메모 없음)"}
                            </p>
                          </div>
                        )}
                        {revision.memo_after !== undefined && (
                          <div className="rounded bg-green-50 p-2 border border-green-200/50">
                            <p className="text-[11px] text-green-700 font-medium mb-1">수정 후</p>
                            <p className="text-xs text-green-600 line-clamp-3">
                              {revision.memo_after || "(메모 없음)"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
