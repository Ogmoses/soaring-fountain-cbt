-- ============================================================================
-- Migration: custom access tokens for teacher invite / password reset
-- ============================================================================
-- Replaces Supabase Auth's built-in inviteUserByEmail / resetPasswordForEmail
-- flow. Those issue a token that's consumed the moment the link is *opened*
-- (Supabase parses it client-side and immediately starts a session) — which
-- is exactly what school mail-scanners (Microsoft Safe Links, Google
-- Workspace link-scanning, etc.) trip over: they open the link to check it's
-- safe, burning the one-time token before the teacher ever sees it. The
-- result is "invalid or expired" on the very first genuine click, with no
-- way to tell the difference between "a scanner ate this" and "you waited
-- too long".
--
-- This table backs a token that is only ever consumed on *password submit*
-- (see lib/accessTokens.ts), never on page load. Visiting the link — by a
-- person or a scanner — does nothing. Only POSTing a new password does.
-- That sidesteps the scanner problem entirely, needs no Supabase dashboard
-- email-template changes, and lets an admin resend as many times as needed
-- without worrying about stale links racing new ones.
-- ============================================================================

create type access_token_purpose as enum ('invite', 'reset');

create table access_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  purpose access_token_purpose not null,
  -- SHA-256 hex digest of the raw token. The raw token only ever exists in
  -- the email link itself and in memory for the moment it's generated —
  -- never stored, never logged, so a database read alone can't produce a
  -- usable token.
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_access_tokens_user on access_tokens(user_id);
create unique index idx_access_tokens_hash on access_tokens(token_hash);
-- Cleans up old rows when looking up a live token; not required for
-- correctness, just keeps the common query fast as the table grows.
create index idx_access_tokens_lookup on access_tokens(token_hash, used_at, expires_at);

-- No client (browser) ever touches this table directly — only the
-- service-role client does, from server-side API routes. RLS is enabled
-- with zero policies attached, which means: service role (bypasses RLS)
-- can do anything, and every other role is denied by default. This is
-- deliberate, not an oversight — do not add a policy here without adding
-- an equally deliberate reason a browser session would ever need to query
-- this table directly (it shouldn't).
alter table access_tokens enable row level security;

comment on table access_tokens is
  'Single-use tokens for teacher account setup (invite) and password reset. Consumed on password submit, not on link click — see migration header comment.';
