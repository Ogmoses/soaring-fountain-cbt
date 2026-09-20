-- Replaces the fixed 5-theme picker with a single hex color stored
-- directly. A full 50–900 accent ramp is now generated at read time from
-- whatever color this holds (see lib/themes.ts's buildRampFromHex) —
-- admins aren't limited to a preset list anymore; RECOMMENDED_COLORS in
-- that file is just a curated starting point shown first in the picker.
-- The older `theme_key` column (from the first version of this feature)
-- is left in place, unused, rather than dropped — additive-only, no risk
-- to existing data.
alter table school_profile add column if not exists theme_color text not null default '#AB1509';
