import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async () => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await sb.storage.emptyBucket("teaching-videos");
  const del = await sb.storage.deleteBucket("teaching-videos");
  return new Response(JSON.stringify({ emptyError: error?.message ?? null, deleteError: del.error?.message ?? null }));
});
