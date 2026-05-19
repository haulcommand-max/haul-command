-- Keep public directory views read-only through the Data API.
-- The directory UI only needs SELECT; write paths must go through claim,
-- correction, admin, or ingestion functions with their own authorization.

revoke insert, update, delete, truncate, references, trigger on table
  public.v_directory_operators,
  public.v_directory_publishable
from anon, authenticated;

grant select on table
  public.v_directory_operators,
  public.v_directory_publishable
to anon, authenticated;
