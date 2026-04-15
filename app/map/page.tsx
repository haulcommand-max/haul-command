import { redirect } from 'next/navigation';

// /map index → redirect to map/live
// The /map route had no index page, causing 404s from the mobile nav.
export default function MapRedirect() {
  redirect('/map/live');
}
