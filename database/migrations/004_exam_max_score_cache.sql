-- Adds a cached `max_score` column to `exams`, kept in sync by triggers
-- whenever exam_questions or a question's points change.
--
-- Why: `lib/reportCard.ts`'s fetchExamMaxScores used to compute this by
-- joining exam_questions -> questions and reading `points` directly.
-- Students have no RLS access to `questions` (it also holds each
-- question's answer key, which must never be exposed to them) — so under
-- RLS the joined `questions` field silently came back `null` for a
-- student session, and `.points` on `null` threw. With no try/catch
-- around the caller, that exception left the page's loading state stuck
-- on `true` forever: an infinite "Loading…" spinner with no visible
-- error. See app/student/page.tsx and components/layout/ErrorState.tsx
-- for the app-side half of this fix.
--
-- Reading a plain column off `exams` instead needs no new grant: students
-- already have row-level SELECT on `exams` for exams they're assigned to
-- (`exams_student_read`), so this sidesteps the permission problem
-- entirely rather than working around it.
alter table exams add column if not exists max_score numeric(6,2) not null default 0;

create or replace function recompute_exam_max_score(p_exam_id uuid) returns void as $$
begin
  update exams
  set max_score = coalesce((
    select sum(q.points)
    from exam_questions eq
    join questions q on q.id = eq.question_id
    where eq.exam_id = p_exam_id
  ), 0)
  where id = p_exam_id;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function trg_exam_questions_recompute_max_score() returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    perform recompute_exam_max_score(old.exam_id);
    return old;
  else
    perform recompute_exam_max_score(new.exam_id);
    return new;
  end if;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists exam_questions_recompute_max_score on exam_questions;
create trigger exam_questions_recompute_max_score
after insert or update or delete on exam_questions
for each row execute function trg_exam_questions_recompute_max_score();

create or replace function trg_questions_points_recompute_max_score() returns trigger as $$
declare
  r record;
begin
  if new.points is distinct from old.points then
    for r in select exam_id from exam_questions where question_id = new.id loop
      perform recompute_exam_max_score(r.exam_id);
    end loop;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists questions_points_recompute_max_score on questions;
create trigger questions_points_recompute_max_score
after update of points on questions
for each row execute function trg_questions_points_recompute_max_score();

-- Backfill existing exams once, going forward the triggers keep it current.
update exams e set max_score = coalesce((
  select sum(q.points) from exam_questions eq join questions q on q.id = eq.question_id where eq.exam_id = e.id
), 0);
