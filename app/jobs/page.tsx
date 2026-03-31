import { redirect } from 'next/navigation';

// /jobs → redirects to /loads (the canonical load board)
// Sitemap listed /jobs at priority 0.85 but no page existed.
// Redirect to the live load board to capture that traffic.
export default function JobsRedirect() {
    redirect('/loads');
}
