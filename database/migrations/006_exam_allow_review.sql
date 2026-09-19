-- Lets a teacher allow students to review their answers (right vs wrong,
-- question by question) after an exam is over, independent of
-- show_result_instantly (which only reveals the total score). See
-- components/teacher/ExamBuilder.tsx's new toggle, and
-- app/api/exam-sessions/review/route.ts for how it's gated at read time.
alter table exams add column if not exists allow_review boolean not null default false;
