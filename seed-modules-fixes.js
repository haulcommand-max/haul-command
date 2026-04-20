require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);


async function fix() {
  
  // Create solid content for over-dimensional-load-permits lessons
  const { data: moduleData } = await supabase.from('training_modules').select('id').eq('slug', 'over-dimensional-load-permits').single();
  const moduleId = moduleData.id;
  
  // delete existing lessons for safety
  await supabase.from('training_lessons').delete().eq('module_id', moduleId);

  const lessons = [
      {
          module_id: moduleId,
          title: 'Understanding Oversize Load Permits',
          content_type: 'text',
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
          video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
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
  
  // insert quiz questions
  const { data: lessData } = await supabase.from('training_lessons').select('id').eq('module_id', moduleId).eq('title', 'Module 3 Quiz').single();
  const quizLessonId = lessData.id;
  
  const qs = [
      {
        module_id: moduleId,
        question_text: "What happens if an escort ignores a route restriction printed on the state permit?",
        question_type: "multiple_choice",
        options: [
            { id: "a", text: "The broker gets a warning.", correct: false, explanation: "Broker warnings do not stop bridge impacts." },
            { id: "b", text: "Immediate fine, DOT points, and highly probable structural damage (like a bridge strike).", correct: true, explanation: "You are legally and physically responsible for adhering to the permitted route over every inch of the corridor." },
            { id: "c", text: "The driver is the only one held legally responsible.", correct: false, explanation: "Escorts share liability." },
            { id: "d", text: "It is allowed if the alternate route is faster.", correct: false, explanation: "Never deviate from a state permit route." }
        ],
        correct_answer_id: "b",
        explanation: "Ignoring route restrictions directly causes infrastructure impacts. Escort operators represent the lead defense and are liable."
      }
  ];
  
  for (const q of qs) {
     const {error} = await supabase.from('training_questions').insert(q);
     if(error) console.error(error);
  }

  console.log('Done!');
}

fix();
