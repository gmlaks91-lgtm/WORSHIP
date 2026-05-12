export type SheetChords = {
  chords?: string[];
  progression?: string; // "Verse->Chorus->Bridge->Chorus->Outro"
};

export type SheetStructure = {
  order?: number[]; // [1, 2, 2, 3, 1] = V->C->C->B->V
  sections?: string[]; // ["Verse", "Chorus", "Bridge", "Outro"]
  notes?: string; // 진행 순서 설명
};

export type SheetSummary = {
  id: string;
  song_id: string;
  image_urls: string[];
  memo: string | null;
  chords?: SheetChords;
  song_structure?: SheetStructure;
  created_at: string;
  updated_at?: string;
};

export type SheetRevision = {
  id: string;
  sheet_id: string;
  chords_before?: SheetChords | null;
  song_structure_before?: SheetStructure | null;
  memo_before?: string | null;
  chords_after?: SheetChords | null;
  song_structure_after?: SheetStructure | null;
  memo_after?: string | null;
  edited_by: string;
  edited_at: string;
  change_summary?: string;
  created_at: string;
};

export type SheetWithRevisions = SheetSummary & {
  revisions?: SheetRevision[];
};
