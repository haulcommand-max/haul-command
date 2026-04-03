import { redirect } from 'next/navigation';

// /roles — redirect to the pilot car operator page as the primary entry point.
// Each role has its own canonical page under /roles/[role].
export default function RolesIndexPage() {
  redirect('/roles/pilot-car-operator');
}
