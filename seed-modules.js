require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const UI_MODULES = [
  {
    slug: 'the-escort-driver-regulatory',
    title: 'The Escort Driver & Regulatory Protocol',
    description: 'Regulatory compliance, pilot car qualification baseline, MUTCD flagging procedures (stop/slow paddle & flag protocols), liability mechanics, and the Class 2 High-Vis apparel framework.',
    duration_minutes: 480,
    order_index: 1,
    certification_tier: 'hc_certified',
    is_free: true,
    pass_score: 80
  },
  {
    slug: 'the-escort-vehicle-equipment-standards',
    title: 'The Escort Vehicle & Equipment Standards',
    description: 'In-depth vehicle specifications, commercial vs. non-commercial considerations, minimum insurance requirements, required DOT interior/exterior equipment, and surviving DOT inspections without fines.',
    duration_minutes: 480,
    order_index: 2,
    certification_tier: 'hc_certified',
    is_free: false,
    pass_score: 80
  },
  {
    slug: 'over-dimensional-load-permits',
    title: 'The Over-Dimensional Load & Pre-Trip',
    description: 'Permit restrictions, load dimension limitations (height, width, weight), broker communication workflows, and leading pre-trip/post-trip carrier meetings.',
    duration_minutes: 480,
    order_index: 3,
    certification_tier: 'hc_certified',
    is_free: false,
    pass_score: 80
  },
  {
    slug: 'maneuvering-techniques-emergencies',
    title: 'Maneuvering Techniques & Emergency Response',
    description: 'Intersection control, safe load maneuvering on various road configurations, emergency breakdown procedures, braking distance calculations, and multi-vehicle convoy radio discipline.',
    duration_minutes: 480,
    order_index: 4,
    certification_tier: 'av_ready',
    is_free: false,
    pass_score: 80
  },
  {
    slug: 'route-survey-clearance-intelligence',
    title: 'Route Survey & Clearance Intelligence',
    description: 'Advanced capability: Heights, widths, vertical/horizontal clearance measurements, bridge capacity documentation, and hazard logging workflows for broker routing teams.',
    duration_minutes: 480,
    order_index: 5,
    certification_tier: 'av_ready',
    is_free: false,
    pass_score: 80
  },
  {
    slug: 'specialized-vertical-operations',
    title: 'Specialized Operations (High Pole & AV-Ready)',
    description: 'Premium capability: High Pole measurement execution, Wind Industry (WITPAC) escort standards, superload planning, oilfield norms, port/TWIC procedures, and autonomous (AV) Kodiak/Aurora protocol.',
    duration_minutes: 480,
    order_index: 6,
    certification_tier: 'elite',
    is_free: false,
    pass_score: 80
  },
  {
    slug: 'final-assessment-certification',
    title: 'Final Assessment & Haul Command Profiling',
    description: 'The definitive 50-question comprehensive closed-book style exam (80% minimum to pass). Concludes with Haul Command digital profile setup, badge verification, and market positioning strategy.',
    duration_minutes: 480,
    order_index: 7,
    certification_tier: 'hc_certified',
    is_free: false,
    pass_score: 80
  }
];

async function fix() {
  for (const m of UI_MODULES) {
    const { error } = await supabase.from('training_modules').upsert(m, { onConflict: 'slug' });
    if (error) console.error('Error upserting', m.slug, error);
    else console.log('Upserted', m.slug);
  }
  
  // Create solid content for over-dimensional-load-permits lessons
  const { data: moduleData } = await supabase.from('training_modules').select('id').eq('slug', 'over-dimensional-load-permits').single();
  const moduleId = moduleData.id;
  
  const lessons = [
      {
          module_id: moduleId,
          title: 'Understanding Oversize Load Permits',
          content_type: 'reading',
          content_html: `
          <h2>Section 1: The Anatomy of a True Oversize Permit</h2>
          <p>Every commercial movement of an oversize or overweight load legally requires a state-issued authorization document known as the permit. An escort operator must physically possess and understand the precise clauses written on this document. To execute without one is a direct violation of FMCSA routing protocol, resulting in severe commercial fines, points added to a DOT profile, and immediate cessation of the haul.</p>
          <p>Permits typically spell out the essential parameters: maximum width, maximum height, overall haul length, allowed operating hours, and whether police escorts are required at specific choke points. If you do not verify these elements before turning the ignition, you are liable.</p>
          <h3>Key Dimensions to Check Immediately</h3>
          <ul>
            <li><strong>Overall Width:</strong> Is this load 12 feet, 14 feet, or 16+ feet? The width decides whether you run front or rear.</li>
            <li><strong>Overall Height:</strong> Anything over 15' 6" typically necessitates a certified High Pole operator.</li>
            <li><strong>Restricted Routes:</strong> The permit spells out specific bridge crossings and tunnels that are restricted. Ignoring this leads directly to bridge strikes.</li>
          </ul>
          <h3>The Escort's Duty of Care</h3>
          <p>You must read the permit alongside the driver. Many state troopers will request the escort show proof of the permit or knowledge of the dimensions during an inspection. A proper escort doesn't just drive; they command the corridor.</p>
          `,
          order_index: 1
      },
      {
          module_id: moduleId,
          title: 'The Pre-Trip Carrier Meeting',
          content_type: 'video',
          content_html: null,
          video_url: 'https://example.com/demo.mp4',
          order_index: 2
      },
      {
          module_id: moduleId,
          title: 'Module 3 Quiz',
          content_type: 'quiz',
          content_html: null,
          order_index: 3
      }
  ];

  for (const l of lessons) {
      const { error } = await supabase.from('training_lessons').insert(l);
      if (error) console.error('Error inserting lesson', error);
  }
  
  console.log('Done!');
}

fix();
