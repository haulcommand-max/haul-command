export const metadata = {
  title: "Privacy Policy | Haul Command",
  description: "Privacy policy and data handling guidelines for Haul Command users and app reviewers.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-24 text-neutral-300">
      <h1 className="text-4xl font-black text-white mb-8">Privacy Policy</h1>
      <div className="prose prose-invert max-w-none">
        <p className="lead text-lg text-neutral-400 mb-8">
          Last Updated: {new Date().toLocaleDateString()}
        </p>
        
        <h2 className="text-2xl font-bold text-white mt-12 mb-4">1. Data Collection</h2>
        <p>Haul Command collects location data, business profile information, and service analytics to match heavy haul transport companies with verified service providers. Location data is collected when you are active on the platform and searching for active pilot cars.</p>
        
        <h2 className="text-2xl font-bold text-white mt-12 mb-4">2. App Review Readiness</h2>
        <p><strong>Note to App Reviewers:</strong> Haul Command utilizes location services to support real-time mapping for heavy haul logistics tracking. Location access is optional and heavily permission-gated. Users may opt out at any time through standard OS settings.</p>
        
        <h2 className="text-2xl font-bold text-white mt-12 mb-4">3. Contact Us</h2>
        <p>For questions or data deletion requests, contact privacy@haulcommand.com.</p>
      </div>
    </main>
  );
}
