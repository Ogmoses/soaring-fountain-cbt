-- Retroactively fixes any exam whose pass_mark ended up null or 0 (see
-- components/teacher/ExamBuilder.tsx's validate() for how that could
-- happen silently — clearing the "Pass mark" field turns into 0, not an
-- error, and nothing previously rejected that on save), then makes it
-- structurally impossible going forward.
--
-- Why this matters: Class Analytics computes pass rate as
-- `score% >= pass_mark`. A pass_mark of 0 makes that comparison true for
-- every score, no matter how low — silently pinning the pass rate at
-- 100% forever, regardless of actual performance.
update exams set pass_mark = 50 where pass_mark is null or pass_mark <= 0;
alter table exams alter column pass_mark set default 50;
alter table exams alter column pass_mark set not null;
alter table exams add constraint exams_pass_mark_range check (pass_mark > 0 and pass_mark <= 100);
