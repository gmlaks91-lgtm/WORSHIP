-- Sheet 편집 기능 및 수정 이력 추적
-- sheets 테이블에 악보 정보 필드 추가 및 revision 테이블 생성

begin;

-- ============================================================================
-- sheets 테이블에 필드 추가
-- ============================================================================

-- 악보의 코드 정보 (JSON: { "chords": ["Am", "G", "D", ...], "progression": "verse->chorus->..."}
alter table public.sheets
  add column if not exists chords jsonb default '{}'::jsonb;

-- 악보의 진행 순서 (JSON: { "order": [1, 2, 2, 3, 1], "sections": ["Verse", "Chorus", ...] }
alter table public.sheets
  add column if not exists song_structure jsonb default '{}'::jsonb;

-- 마지막 수정자 (수정 전용)
alter table public.sheets
  add column if not exists updated_at timestamptz default now();

-- ============================================================================
-- sheet_revisions 테이블 - 악보 수정 이력 추적
-- ============================================================================

create table if not exists public.sheet_revisions (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references public.sheets (id) on delete cascade,
  
  -- 수정 전 값
  chords_before jsonb,
  song_structure_before jsonb,
  memo_before text,
  
  -- 수정 후 값
  chords_after jsonb,
  song_structure_after jsonb,
  memo_after text,
  
  -- 수정자 정보
  edited_by uuid not null references public.profiles (id) on delete cascade,
  edited_at timestamptz not null default now(),
  change_summary text, -- "코드 수정" / "진행 순서 수정" / "메모 수정" 등
  
  created_at timestamptz not null default now()
);

-- 인덱스 추가
create index if not exists sheet_revisions_sheet_id_idx
  on public.sheet_revisions (sheet_id, edited_at desc);

create index if not exists sheet_revisions_edited_by_idx
  on public.sheet_revisions (edited_by);

-- RLS 정책
alter table public.sheet_revisions enable row level security;

drop policy if exists "authenticated_read_revisions" on public.sheet_revisions;
create policy "authenticated_read_revisions"
  on public.sheet_revisions
  for select
  to authenticated
  using (true);

drop policy if exists "authenticated_insert_revisions" on public.sheet_revisions;
create policy "authenticated_insert_revisions"
  on public.sheet_revisions
  for insert
  to authenticated
  with check (true);

-- ============================================================================
-- sheets 테이블 RLS 업데이트 - 업데이트 권한 설정
-- ============================================================================

-- 기존 정책 제거
drop policy if exists "authenticated_all_sheets_table" on public.sheets;

-- 새로운 정책 추가
create policy "authenticated_select_sheets"
  on public.sheets
  for select
  to authenticated
  using (true);

create policy "authenticated_insert_sheets"
  on public.sheets
  for insert
  to authenticated
  with check (true);

create policy "authenticated_update_sheets"
  on public.sheets
  for update
  to authenticated
  using (true)
  with check (true);

commit;
