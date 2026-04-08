import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Surge Page Builder Worker
 * 
 * When a hc_market_surge_window is activated, this worker auto-generates
 * the corresponding surge page draft with correct H1, subheadline,
 * proof block, FAQ, and CTA variant.
 */
export async function buildSurgePage(jobPayload: {
  surge_window_id: string;
}) {
  const { surge_window_id } = jobPayload;

  // 1. Fetch the surge window
  const { data: window } = await supabaseAdmin
    .from("hc_market_surge_window")
    .select("*")
    .eq("id", surge_window_id)
    .single();

  if (!window) throw new Error(`Surge window not found: ${surge_window_id}`);

  // 2. Check if page already exists
  const slug = `surge/${window.market_code}-${window.surge_type}-${window.surge_name}`
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-\/]/g, "");

  const { data: existing } = await supabaseAdmin
    .from("hc_surge_page")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return { action: "skipped", reason: "Surge page already exists", slug };
  }

  // 3. Generate headline and subheadline
  const headline = `${capitalize(window.surge_type)} Support — ${capitalize(window.surge_name)} in ${window.market_code}`;
  const subheadline = `Verified operators and support services available during ${window.surge_name}. Fast response. Proven coverage.`;

  // 4. Generate FAQ
  const faq = [
    { question: `Who can help during ${window.surge_name}?`, answer: "Haul Command connects you with verified, locally active operators who specialize in this market." },
    { question: "How fast can I get coverage?", answer: "Most verified operators on Haul Command respond within 15 minutes during surge periods." },
    { question: "What certifications matter here?", answer: "Requirements vary by region. Use our Requirement Calculator tool to check what you need for this load and route." },
    { question: `What happens if my operator no-shows during ${window.surge_name}?`, answer: "Submit an urgent replacement request and we will match you with available coverage immediately." },
    { question: "What does this cost?", answer: "Rates vary by service type, urgency, and distance. Claimed providers can display pricing examples on their profiles." },
  ];

  // 5. Write surge page
  const { data: page, error } = await supabaseAdmin
    .from("hc_surge_page")
    .insert({
      slug,
      page_type: "surge_conversion",
      market_code: window.market_code,
      surge_window_id,
      headline,
      subheadline,
      faq_json: faq,
      cta_variant: "request_urgent_coverage",
      status: "draft",
    })
    .select("id, slug")
    .single();

  if (error) throw error;

  // 6. Enqueue internal link generation
  await supabaseAdmin.from("hc_agent_jobs").insert({
    agent_name: "internal_link_agent",
    job_type: "generate_link_slots",
    target_type: "surge_page",
    target_id: page.id,
    priority: 130,
  });

  return {
    action: "created",
    page_id: page.id,
    slug: page.slug,
    headline,
  };
}

function capitalize(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
