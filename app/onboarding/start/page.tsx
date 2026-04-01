import { redirect } from 'next/navigation';

// /onboarding/start → redirects to /onboarding
// This fixes the 404 reported by the dominance audit.
// All CTAs across the site link here; the real onboarding lives at /onboarding.
export default function OnboardingStartRedirect() {
    redirect('/onboarding');
}
