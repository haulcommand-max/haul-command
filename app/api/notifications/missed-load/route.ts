/**
 * POST /api/notifications/missed-load
 * Triggers push notifications to operators when loads expire on their corridors.
 */
import { handleMissedLoadAPI } from '@/lib/notifications/missed-load';

export async function POST(req: Request) {
  return handleMissedLoadAPI(req);
}
