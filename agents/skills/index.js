/**
 * Skills Registry — Haul Command Agent Skills Layer
 * ===================================================
 * Every process engine imports this to get callable skill modules.
 * Skills are the actual tools that do the work — API calls, DB writes,
 * email sends, image generation, file processing.
 *
 * Usage:
 *   const skills = require('./skills');
 *   await skills.sponsorOutreach.sweep('escort-calculator');
 *   await skills.assetRender.generateHero({ route: '/directory/us/tx', locale: 'en-US' });
 */

const { route: routeModel, CostTracker } = require('./lib/model-router');

// ── Shared Supabase client ──────────────────────────────────────────────────
function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// ── Shared email sender ─────────────────────────────────────────────────────
async function sendEmail({ to, subject, html, from }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: from || 'Haul Command <noreply@haulcommand.com>', to, subject, html }),
  });
  if (!res.ok) throw new Error(`Email send failed: ${res.status}`);
  return res.json();
}

// ── Shared push sender ──────────────────────────────────────────────────────
async function sendPush({ userId, title, body, url, channel }) {
  const supabase = getSupabase();
  // Get user's push subscription
  const { data: sub } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId).single();
  if (!sub) return { sent: false, reason: 'no_subscription' };
  // Fire web push
  const webpush = require('web-push');
  await webpush.sendNotification(sub.subscription, JSON.stringify({ title, body, url }));
  return { sent: true, channel: channel || 'push' };
}

// ── Channel Router ──────────────────────────────────────────────────────────
// Picks cheapest effective channel: push > in-app > email > sms
async function routeChannel({ userId, message, urgency, type }) {
  const supabase = getSupabase();
  const { data: prefs } = await supabase.from('notification_preferences').select('*').eq('user_id', userId).single();

  // Priority: push (free) > in-app (free) > email (cheap) > sms (expensive)
  if (urgency === 'critical') {
    // Try all channels
    const results = [];
    if (prefs?.push_enabled !== false) results.push(await sendPush({ userId, ...message, channel: 'push' }));
    results.push(await sendEmail({ to: prefs?.email, ...message }));
    return results;
  }
  if (prefs?.push_enabled !== false) return sendPush({ userId, ...message, channel: 'push' });
  if (prefs?.email) return sendEmail({ to: prefs.email, ...message });
  return { sent: false, reason: 'no_channel_available' };
}


// ═══════════════════════════════════════════════════════════════════════════════
// SKILL MODULES
// ═══════════════════════════════════════════════════════════════════════════════

const skills = {

  // ─── SPONSOR OUTREACH ─────────────────────────────────────────────────────
  sponsorOutreach: {
    /**
     * Check tool page traffic and send sponsor offers when threshold hit
     */
    async sweep(toolSlug) {
      const supabase = getSupabase();
      // Get page traffic from analytics
      const { data: traffic } = await supabase
        .from('page_analytics')
        .select('monthly_views, top_markets')
        .eq('page_path', `/tools/${toolSlug}`)
        .single();

      if (!traffic || traffic.monthly_views < 500) return { action: 'skip', reason: 'low_traffic' };

      // Find local brokers in top markets
      const { data: brokers } = await supabase
        .from('operators')
        .select('id, business_name, email, service_area')
        .eq('operator_type', 'broker')
        .in('service_area', traffic.top_markets || [])
        .limit(5);

      if (!brokers?.length) return { action: 'skip', reason: 'no_brokers_in_market' };

      // Draft outreach email using nano (cheapest model)
      const emailResult = await routeModel('revenue_engine', 'sponsor_outreach_email', 
        `Draft a short, professional sponsorship offer email for the ${toolSlug} page on HaulCommand.com. 
         Monthly traffic: ${traffic.monthly_views} views. Target: ${brokers[0].business_name}.
         Offer: featured sponsor listing on this tool page. Keep it under 150 words.`
      );

      // Send to each broker
      const sent = [];
      for (const broker of brokers) {
        if (!broker.email) continue;
        await sendEmail({
          to: broker.email,
          subject: `Sponsor the ${toolSlug.replace(/-/g, ' ')} on Haul Command`,
          html: emailResult?.text || `<p>Sponsorship opportunity available.</p>`,
        });
        sent.push(broker.business_name);
      }

      return { action: 'sent', tool: toolSlug, traffic: traffic.monthly_views, sent_to: sent };
    },
  },

  // ─── TRAINING CHECKOUT ────────────────────────────────────────────────────
  trainingCheckout: {
    /**
     * Find incomplete enrollments and send upsell with Stripe checkout link
     */
    async sweepCourse(courseSlug) {
      const supabase = getSupabase();
      const { data: incomplete } = await supabase
        .from('training_enrollments')
        .select('user_id, progress_pct, enrolled_at, users(email, full_name)')
        .eq('course_slug', courseSlug)
        .lt('progress_pct', 100)
        .gt('progress_pct', 25)  // only nudge people who started
        .order('enrolled_at', { ascending: true })
        .limit(20);

      if (!incomplete?.length) return { action: 'skip', reason: 'no_incomplete' };

      let nudged = 0;
      for (const enrollment of incomplete) {
        if (!enrollment.users?.email) continue;
        const checkoutUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/training/${courseSlug}/checkout`;
        await routeChannel({
          userId: enrollment.user_id,
          message: {
            title: `Finish your ${courseSlug.replace(/-/g, ' ')} certification`,
            body: `You're ${enrollment.progress_pct}% done. Complete it now and get your HC Certified badge.`,
            url: checkoutUrl,
            subject: `You're ${enrollment.progress_pct}% done — finish your certification`,
            html: `<p>Hi ${enrollment.users.full_name},</p>
              <p>You're <strong>${enrollment.progress_pct}% complete</strong> on ${courseSlug.replace(/-/g, ' ')}.</p>
              <p><a href="${checkoutUrl}">Complete your certification now →</a></p>`,
          },
          urgency: 'normal',
          type: 'training_upsell',
        });
        nudged++;
      }
      return { action: 'nudged', course: courseSlug, count: nudged };
    },
  },

  // ─── CORRIDOR PACKAGER ────────────────────────────────────────────────────
  corridorPackager: {
    /**
     * Package corridor data into sellable product + public teaser
     */
    async package(corridorSlug) {
      const supabase = getSupabase();
      const { data: corridor } = await supabase
        .from('corridors')
        .select('*, corridor_rates(*), corridor_weather(*)')
        .eq('slug', corridorSlug)
        .single();

      if (!corridor) return { action: 'skip', reason: 'corridor_not_found' };

      // Generate public teaser (free, drives signups)
      const teaser = {
        slug: corridorSlug,
        headline: `${corridor.name} — Live Rates & Intelligence`,
        avg_rpm: corridor.corridor_rates?.[0]?.avg_rpm || null,
        carrier_count: corridor.active_carriers || 0,
        last_updated: new Date().toISOString(),
        cta: 'Subscribe to Corridor Command for full intelligence',
        price_monthly: 2900, // $29/mo
      };

      // Upsert teaser page data
      await supabase.from('corridor_teasers').upsert(teaser, { onConflict: 'slug' });

      return { action: 'packaged', corridor: corridorSlug, teaser };
    },
  },

  // ─── ASSET RENDER ─────────────────────────────────────────────────────────
  assetRender: {
    /**
     * Generate a visual asset and store in the Visual Production OS
     */
    async generate({ route, assetType, locale, market, prompt, dimensions }) {
      const supabase = getSupabase();
      const crypto = require('crypto');
      const promptHash = crypto.createHash('sha256').update(prompt).digest('hex');

      // Check for existing asset with same prompt (dedup)
      const { data: existing } = await supabase
        .from('visual_assets')
        .select('id, cdn_url')
        .eq('prompt_hash', promptHash)
        .eq('is_current', true)
        .single();

      if (existing) return { action: 'cached', asset_id: existing.id, url: existing.cdn_url };

      // Generate image via OpenAI DALL-E or Google Imagen
      // For now, use OpenAI as it's the most reliable for on-demand generation
      const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: dimensions || '1792x1024',
          quality: 'standard',
          response_format: 'url',
        }),
      });

      if (!openaiRes.ok) throw new Error(`Image generation failed: ${openaiRes.status}`);
      const imgData = await openaiRes.json();
      const imageUrl = imgData.data[0].url;

      // Download and upload to Supabase Storage
      const imgRes = await fetch(imageUrl);
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
      const storagePath = `${assetType}/${market || 'global'}/${Date.now()}.webp`;

      const { error: uploadErr } = await supabase.storage
        .from('visual-assets')
        .upload(storagePath, imgBuffer, { contentType: 'image/webp' });

      if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

      const { data: { publicUrl } } = supabase.storage.from('visual-assets').getPublicUrl(storagePath);

      // Record in Visual Production OS
      const { data: asset } = await supabase.from('visual_assets').insert({
        asset_type: assetType,
        route,
        locale: locale || 'en-US',
        market,
        prompt_hash: promptHash,
        prompt_text: prompt,
        model_used: 'dall-e-3',
        generation_cost: 0.04, // DALL-E 3 standard pricing
        storage_path: storagePath,
        cdn_url: publicUrl,
        format: 'webp',
        width_px: parseInt((dimensions || '1792x1024').split('x')[0]),
        height_px: parseInt((dimensions || '1792x1024').split('x')[1]),
        file_size_bytes: imgBuffer.length,
        alt_text: prompt.slice(0, 200),
      }).select().single();

      return { action: 'generated', asset_id: asset?.id, url: publicUrl, cost: 0.04 };
    },
  },

  // ─── LOCAL PAGE PUBLISHER ─────────────────────────────────────────────────
  localPagePublisher: {
    /**
     * Generate a localized "[City] Pilot Car" page with hero, OG, and schema
     */
    async publish({ country, subdivision, city }) {
      const supabase = getSupabase();
      const slug = `${country}/${subdivision}/${city}`.toLowerCase();

      // Check if page already exists
      const { data: existing } = await supabase
        .from('localized_pages')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) return { action: 'exists', slug };

      // Generate page content using Flash-Lite (cheapest for bulk generation)
      const content = await routeModel('seo_engine', 'local_page_generation',
        `Generate a localized landing page for "${city}, ${subdivision}" pilot car and escort vehicle services.
         Include: H1 title, 150-word intro, local regulations summary, nearby corridors, and a CTA to claim a listing.
         Target keyword: "${city} pilot car services"
         Format: JSON with fields: title, meta_description, h1, intro, regulations_summary, corridors, cta_text`
      );

      // Parse and store
      let pageData;
      try { pageData = JSON.parse(content?.text || '{}'); } catch { pageData = { title: `${city} Pilot Car Services` }; }

      await supabase.from('localized_pages').insert({
        slug,
        country_code: country,
        subdivision,
        city_slug: city,
        title: pageData.title || `${city} Pilot Car & Escort Services`,
        meta_description: pageData.meta_description || `Find verified pilot car operators in ${city}, ${subdivision}.`,
        content_json: pageData,
        is_published: true,
      });

      // Generate hero asset
      await skills.assetRender.generate({
        route: `/directory/${slug}`,
        assetType: 'city_hero',
        locale: 'en-US',
        market: `${country}-${subdivision}`,
        prompt: `Professional logistics photography of a pilot car escort vehicle on a highway near ${city}, ${subdivision}. Wide landscape, golden hour, dramatic sky. No text overlays.`,
        dimensions: '1792x1024',
      });

      // Generate OG card
      await skills.assetRender.generate({
        route: `/directory/${slug}`,
        assetType: 'city_og',
        market: `${country}-${subdivision}`,
        prompt: `Social media card for "${city} Pilot Car Services" by Haul Command. Professional, dark theme with amber accent. Include city name prominently.`,
        dimensions: '1200x630',
      });

      return { action: 'published', slug, title: pageData.title };
    },
  },

  // ─── REPORT CARD EXPORT ───────────────────────────────────────────────────
  reportCardExport: {
    /**
     * Generate an exportable, shareable report card for an operator
     */
    async generate(operatorId) {
      const supabase = getSupabase();
      const { data: operator } = await supabase
        .from('operators')
        .select('*, trust_scores(*), certifications(*), reviews(*)')
        .eq('id', operatorId)
        .single();

      if (!operator) return { action: 'skip', reason: 'operator_not_found' };

      const reportCard = {
        operator_id: operatorId,
        business_name: operator.business_name,
        trust_score: operator.trust_scores?.[0]?.score || 0,
        certifications: operator.certifications?.map(c => c.name) || [],
        review_count: operator.reviews?.length || 0,
        avg_rating: operator.reviews?.length
          ? (operator.reviews.reduce((s, r) => s + r.rating, 0) / operator.reviews.length).toFixed(1)
          : 'N/A',
        generated_at: new Date().toISOString(),
        shareable_url: `${process.env.NEXT_PUBLIC_SITE_URL}/report-card/${operatorId}`,
        is_premium: false, // free version — premium adds detailed breakdown
      };

      await supabase.from('report_cards').upsert(reportCard, { onConflict: 'operator_id' });

      // Generate report card graphic
      await skills.assetRender.generate({
        route: `/report-card/${operatorId}`,
        assetType: 'report_card_graphic',
        prompt: `Professional trust report card for "${operator.business_name}". Trust Score: ${reportCard.trust_score}/100. ${reportCard.review_count} reviews. Dark theme, amber accents, verified badge. Clean data visualization.`,
        dimensions: '1200x630',
      });

      return { action: 'generated', operator: operator.business_name, report_card: reportCard };
    },
  },

  // ─── NEAR-ME BUILDER ──────────────────────────────────────────────────────
  nearMeBuilder: {
    /**
     * Build "near me" spatial link graph for a city
     */
    async build({ lat, lng, citySlug, radius_miles }) {
      const supabase = getSupabase();
      // Find nearby operators using PostGIS
      const { data: nearby } = await supabase.rpc('find_nearby_operators', {
        p_lat: lat, p_lng: lng, p_radius_miles: radius_miles || 50,
      });

      if (!nearby?.length) return { action: 'skip', reason: 'no_operators_nearby' };

      // Build spatial edges
      const edges = nearby.map(op => ({
        from_slug: citySlug,
        to_operator_id: op.id,
        distance_miles: op.distance_miles,
        edge_type: 'near_me',
      }));

      await supabase.from('spatial_edges').upsert(edges, { onConflict: 'from_slug,to_operator_id' });

      return { action: 'built', city: citySlug, operators_linked: nearby.length };
    },
  },

  // ─── GBP SYNC ─────────────────────────────────────────────────────────────
  gbpSync: {
    /**
     * Sync operator data to Google Business Profile format
     */
    async sync(operatorId) {
      const supabase = getSupabase();
      const { data: op } = await supabase
        .from('operators')
        .select('*')
        .eq('id', operatorId)
        .single();

      if (!op) return { action: 'skip', reason: 'operator_not_found' };

      const gbpData = {
        operator_id: operatorId,
        business_name: op.business_name,
        address: op.address,
        phone: op.phone,
        website: `${process.env.NEXT_PUBLIC_SITE_URL}/directory/${op.slug}`,
        category: 'Transportation Service',
        hours: op.business_hours || 'Open 24 hours',
        synced_at: new Date().toISOString(),
      };

      await supabase.from('gbp_sync_queue').upsert(gbpData, { onConflict: 'operator_id' });
      return { action: 'synced', operator: op.business_name };
    },
  },

  // ─── PUSH ROUTER ──────────────────────────────────────────────────────────
  pushRouter: {
    /**
     * Route a notification through the cheapest effective channel
     */
    async send({ userId, type, message, urgency }) {
      return routeChannel({ userId, message, urgency, type });
    },
  },

  // ─── ESCORT PROOF PACK ───────────────────────────────────────────────────
  escortProofPack: {
    /**
     * Generate downloadable compliance proof pack for an operator
     */
    async generate(operatorId) {
      const supabase = getSupabase();
      const { data: op } = await supabase
        .from('operators')
        .select('*, insurance_records(*), certifications(*), permits(*)')
        .eq('id', operatorId)
        .single();

      if (!op) return { action: 'skip' };

      const pack = {
        operator_id: operatorId,
        business_name: op.business_name,
        insurance_valid: op.insurance_records?.some(r => new Date(r.expiry) > new Date()) || false,
        certifications: op.certifications?.map(c => ({ name: c.name, issued: c.issued_at, expires: c.expires_at })) || [],
        active_permits: op.permits?.filter(p => p.status === 'active')?.length || 0,
        generated_at: new Date().toISOString(),
        is_premium: true, // paid feature
      };

      await supabase.from('proof_packs').upsert(pack, { onConflict: 'operator_id' });
      return { action: 'generated', operator: op.business_name, pack };
    },
  },
};

module.exports = skills;
