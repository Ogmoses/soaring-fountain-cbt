/**
 * orThrow — wraps a Supabase call and throws a real Error if it failed,
 * instead of the common `const { data } = await supabase...` pattern that
 * silently discards `error` and just treats a failed call as empty data.
 *
 * That silent-discard pattern is exactly what let the current_role_is()
 * infinite-recursion bug (see database/schema.sql) hide for so long as
 * "the list is just empty" instead of a visible error — every admin/
 * teacher page's write handlers already have a try/catch around them (the
 * editor modals show whatever message the handler throws), so throwing
 * here is enough to make failures visible without restructuring anything
 * else.
 *
 * Usage: `await orThrow(supabase.from("subjects").insert({...}));`
 *        `const created = await orThrow(supabase.from("subjects").insert({...}).select("id").single());`
 */
export async function orThrow<T>(promise: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data;
}
