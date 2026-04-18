-- =====================================================================
-- Haul Command — ESC Content Gap Closure: 3 Priority Articles
-- Generated: 2026-04-12
-- Purpose: Seed the 3 articles identified as ESC.org competitive gaps:
--   1. High Pole Operations Guide (ESC has one, HC doesn't)
--   2. How to Start Your Pilot Car Career (ESC's best lead-gen)
--   3. Pilot Car Test Prep: Practice Questions (ESC has static, HC interactive)
-- Mode: ADDITIVE — upsert by slug, no existing data modified
-- =====================================================================
begin;

-- 1. HIGH POLE OPERATIONS: THE COMPLETE GUIDE
insert into public.hc_blog_articles (
    slug, title, excerpt, content_html, hero_image_url, og_image_url,
    schema_markup, quick_answer_block, published_at
) values (
    'high-pole-operations-complete-guide',
    'High Pole Operations: The Complete 2026 Guide for Escort Vehicles',
    'Master high pole car operations for oversize load escort. Equipment specs, bridge clearance techniques, communication protocols, and deployment best practices.',
    '<h2>What Is a High Pole Car?</h2>
<p>A high pole car (also called a height pole vehicle or clearance pole car) is a specialized escort vehicle equipped with an adjustable-height pole mounted to the front or rear. The pole is set to match the exact height of the oversize load it accompanies. When the pole strikes an overhead obstruction — a bridge, overpass, or power line — the driver knows the load behind them will not clear.</p>
<p>This is the single most important piece of safety equipment in the heavy haul escort world. A bridge strike involving a superload can cause millions in damage, shut down an interstate for days, and end careers.</p>

<h2>Equipment Requirements by State</h2>
<p>Every state that requires high pole cars has specific equipment standards. At minimum:</p>
<ul>
    <li><strong>Adjustable Height Pole:</strong> Typically aluminum or fiberglass, adjustable from 12 ft to 18+ ft. Must lock securely at the load''s exact height.</li>
    <li><strong>Warning Indicators:</strong> Audible alarm (horn or buzzer) and/or breakaway flag that triggers on contact.</li>
    <li><strong>Measurement Verification:</strong> The pole height must be verified against the load''s measured height before every departure and after every stop.</li>
    <li><strong>Mounting System:</strong> Pole mount must be rated for highway speeds (65+ MPH wind loads) and secured to prevent lateral sway exceeding 6 inches.</li>
    <li><strong>Vehicle Requirements:</strong> Most states require the high pole vehicle to display oversize load signage, amber rotating/strobe lights, and two-way radio communication with the driver and rear escort.</li>
</ul>

<h2>Bridge Clearance Protocol</h2>
<p>The standard operating procedure for bridge clearance verification:</p>
<ol>
    <li><strong>Pre-Trip:</strong> Use the Haul Command <a href="/map">Custom GPS Engine</a> to identify every bridge and overhead structure on the planned route, along with posted clearances.</li>
    <li><strong>Set Height:</strong> Adjust the pole to the load''s exact height PLUS the required safety margin (typically 6-12 inches depending on state).</li>
    <li><strong>Drive-Through:</strong> The high pole car drives the route AHEAD of the load, verifying clearance at every structure.</li>
    <li><strong>Contact Protocol:</strong> If the pole contacts any structure, the convoy STOPS immediately. The high pole operator radios the load driver and rear escort. A manual measurement is taken before proceeding.</li>
    <li><strong>Document:</strong> Record every bridge verification in the trip log. Haul Command''s <a href="/tools">route logging tools</a> automate this.</li>
</ol>

<h2>Communication Standards</h2>
<p>High pole operators must maintain constant radio contact with:</p>
<ul>
    <li>The load driver (primary channel)</li>
    <li>The rear escort (secondary channel)</li>
    <li>Any additional escorts or traffic control flaggers</li>
</ul>
<p>Standard call-out format: <em>"High pole clear at [structure name/mile marker], your clearance is good, proceed at current speed."</em></p>

<h2>Common Mistakes That Cause Bridge Strikes</h2>
<ul>
    <li>❌ Not re-measuring after a load shift at a rest stop</li>
    <li>❌ Using road crown height instead of actual clearance</li>
    <li>❌ Relying solely on posted clearance signs (they can be wrong or outdated)</li>
    <li>❌ Running the pole on the shoulder instead of in the travel lane the load will use</li>
    <li>❌ Ignoring incline/decline grade effects on effective vehicle height</li>
</ul>

<h2>Haul Command Bridge Intelligence Integration</h2>
<p>The Haul Command <a href="/map">Custom GPS Engine</a> cross-references bridge clearance data with your load dimensions in real-time. Combined with the <a href="/api/map/tilequery">Infrastructure Intel Engine</a>, we detect bridges, tunnels, and railway crossings along your route before you leave the yard.</p>
<p>For operators seeking <a href="/training">high pole certification</a>, Haul Command offers verified training modules with bridge clearance simulators and real-world scenario testing.</p>

<h2>Related Resources</h2>
<ul>
    <li><a href="/training">Pilot Car Training & Certification</a></li>
    <li><a href="/regulations">State Escort Regulations</a></li>
    <li><a href="/glossary/high-pole-car">Glossary: High Pole Car</a></li>
    <li><a href="/tools">Route Planning Tools</a></li>
    <li><a href="/directory">Find Verified High Pole Operators</a></li>
</ul>',
    '/images/training_hero_bg.png',
    '/images/training_hero_bg.png',
    '{"@context":"https://schema.org","@type":"HowTo","name":"High Pole Operations: The Complete 2026 Guide","description":"Master high pole car operations for oversize load escort including equipment specs, bridge clearance techniques, and communication protocols.","step":[{"@type":"HowToStep","name":"Pre-Trip Route Scan","text":"Use the Haul Command GPS Engine to identify every bridge and overhead structure on the planned route."},{"@type":"HowToStep","name":"Set Height","text":"Adjust the pole to the load exact height PLUS the required safety margin."},{"@type":"HowToStep","name":"Drive-Through Verification","text":"Drive the route ahead of the load, verifying clearance at every structure."},{"@type":"HowToStep","name":"Contact Protocol","text":"If the pole contacts any structure, stop the convoy immediately and take manual measurements."},{"@type":"HowToStep","name":"Document","text":"Record every bridge verification in the trip log."}]}',
    '{"question":"What is a high pole car and how does it work?","answer":"A high pole car is a specialized escort vehicle with an adjustable-height pole set to match the oversize load height. When the pole strikes an overhead obstruction, the driver knows the load will not clear, preventing bridge strikes. The pole is verified before departure and at every stop, and the operator maintains constant radio contact with the load driver.","confidence":"verified_current","source":"Haul Command Intelligence Desk"}',
    now()
) on conflict (slug) do update set
    title = excluded.title,
    excerpt = excluded.excerpt,
    content_html = excluded.content_html,
    schema_markup = excluded.schema_markup,
    quick_answer_block = excluded.quick_answer_block,
    published_at = excluded.published_at;

-- 2. HOW TO START YOUR PILOT CAR CAREER IN 2026
insert into public.hc_blog_articles (
    slug, title, excerpt, content_html, hero_image_url, og_image_url,
    schema_markup, quick_answer_block, published_at
) values (
    'how-to-start-pilot-car-career-2026',
    'How to Start Your Pilot Car Career in 2026: The Definitive Guide',
    'Everything you need to launch a pilot car escort business. Certification, equipment, insurance, finding loads, and building a reputation in heavy haul.',
    '<h2>Is a Pilot Car Career Right for You?</h2>
<p>Pilot car operation (also called escort vehicle operation) is one of the fastest-growing careers in heavy haul logistics. The demand is driven by explosive growth in wind energy, data center construction, and infrastructure renewal projects that require oversize load transport across state lines.</p>
<p>Average earnings for experienced operators range from <strong>$50,000 to $90,000+ annually</strong>, with top operators in high-demand corridors (Texas, Oklahoma, California) earning six figures during surge periods.</p>

<h2>Step 1: Get Certified</h2>
<p>Most states require pilot car operators to hold a valid certification or license. Requirements vary dramatically by state:</p>
<ul>
    <li><strong>States requiring certification:</strong> Washington (PEVO), Oregon, California, Colorado, and 20+ others</li>
    <li><strong>States with reciprocity:</strong> Washington and Oregon recognize each other''s certifications. Check our <a href="/blog/escort-reciprocity-guide">certification reciprocity matrix</a> for the full map.</li>
    <li><strong>States with no formal requirement:</strong> Some states only require a valid driver''s license and proper equipment</li>
</ul>
<p><strong>Start here:</strong> <a href="/training">Haul Command Training Hub</a> — browse certified courses by state with verified instructor listings.</p>

<h2>Step 2: Equip Your Vehicle</h2>
<p>Minimum equipment required in most states:</p>
<ul>
    <li>✅ "OVERSIZE LOAD" or "WIDE LOAD" sign (minimum 7 ft × 18 in, yellow with black letters)</li>
    <li>✅ Amber rotating or LED strobe lights (visible from 500+ feet)</li>
    <li>✅ 18-inch square red/orange fluorescent flags (minimum 2)</li>
    <li>✅ Two-way CB radio or equivalent communication system</li>
    <li>✅ Height pole (adjustable, if providing high pole service — see our <a href="/blog/high-pole-operations-complete-guide">high pole operations guide</a>)</li>
    <li>✅ Fire extinguisher (ABC rated)</li>
    <li>✅ First aid kit</li>
    <li>✅ Cell phone with GPS capability</li>
</ul>
<p>Total startup equipment cost: approximately <strong>$500—$2,000</strong> depending on vehicle modifications needed.</p>

<h2>Step 3: Get Insured</h2>
<p>You need a commercial auto policy with pilot car endorsement. Minimum coverage typically required:</p>
<ul>
    <li>$1,000,000 combined single limit liability (some clients require $2M)</li>
    <li>$50,000 cargo/property damage</li>
    <li>Most standard personal auto policies DO NOT cover commercial escort work</li>
</ul>
<p>Annual premium: approximately <strong>$2,000—$4,500</strong> depending on state, driving record, and coverage limits.</p>

<h2>Step 4: Create Your Haul Command Profile</h2>
<p>The fastest way to get your first job is being discoverable. <a href="/claim">Claim your Haul Command listing</a> — it''s free and immediately puts you in front of brokers, carriers, and dispatchers searching for escorts in your coverage area.</p>
<p>Complete profiles with <a href="/trust">Trust Scores</a> receive 3-5x more contact requests than incomplete listings.</p>

<h2>Step 5: Find Your First Loads</h2>
<p>Where new operators get work:</p>
<ol>
    <li><strong>Haul Command Load Board</strong> — <a href="/loads">browse active oversize loads</a> needing escort in your area</li>
    <li><strong>Available Now Feed</strong> — <a href="/available-now">broadcast your availability</a> so dispatchers can find you instantly</li>
    <li><strong>Direct broker relationships</strong> — attend industry events, introduce yourself, build your name</li>
    <li><strong>Established escort companies</strong> — work as a subcontractor to gain experience and learn from veterans</li>
</ol>

<h2>Step 6: Build Your Reputation</h2>
<p>In this industry, your reputation IS your business. These signals drive repeat work:</p>
<ul>
    <li>📊 <a href="/trust">Haul Command Trust Score</a> — verified by platform data, not fake reviews</li>
    <li>⏱ Response time to dispatch requests</li>
    <li>🗺 Route knowledge (knowing the bridges, restricted roads, and quirks in your territory)</li>
    <li>📱 Professionalism in communication</li>
    <li>🔄 Completing jobs without incident</li>
</ul>

<h2>Realistic Timeline</h2>
<table>
    <tr><th>Phase</th><th>Duration</th><th>Cost</th></tr>
    <tr><td>Certification (if required)</td><td>1-3 days</td><td>$50-$300</td></tr>
    <tr><td>Equipment purchase</td><td>1-2 weeks</td><td>$500-$2,000</td></tr>
    <tr><td>Insurance</td><td>1-2 weeks</td><td>$2,000-$4,500/yr</td></tr>
    <tr><td>First load</td><td>1-4 weeks</td><td>FREE via load board</td></tr>
    <tr><td>Sustainable pipeline</td><td>3-6 months</td><td>Reputation investment</td></tr>
</table>

<h2>Related Resources</h2>
<ul>
    <li><a href="/training">Training & Certification Hub</a></li>
    <li><a href="/regulations">State Regulations by State</a></li>
    <li><a href="/claim">Claim Your Free Listing</a></li>
    <li><a href="/loads">Browse Active Loads</a></li>
    <li><a href="/rates">Current Escort Rate Benchmarks</a></li>
    <li><a href="/blog/escort-reciprocity-guide">Certification Reciprocity Guide</a></li>
    <li><a href="/blog/high-pole-operations-complete-guide">High Pole Operations Guide</a></li>
</ul>',
    '/images/blog_hero_bg.png',
    '/images/blog_hero_bg.png',
    '{"@context":"https://schema.org","@type":"HowTo","name":"How to Start Your Pilot Car Career in 2026","description":"Step-by-step guide to launching a pilot car escort business including certification, equipment, insurance, finding loads, and building your reputation.","estimatedCost":{"@type":"MonetaryAmount","currency":"USD","value":"2550-6800"},"step":[{"@type":"HowToStep","name":"Get Certified","text":"Obtain pilot car certification in your state. Requirements vary by state."},{"@type":"HowToStep","name":"Equip Your Vehicle","text":"Install OVERSIZE LOAD signs, amber strobe lights, flags, CB radio, and optional height pole."},{"@type":"HowToStep","name":"Get Insured","text":"Obtain commercial auto policy with pilot car endorsement. Minimum $1M CSL."},{"@type":"HowToStep","name":"Create Your Profile","text":"Claim your free Haul Command listing to be discoverable by dispatchers."},{"@type":"HowToStep","name":"Find Your First Loads","text":"Browse the Haul Command Load Board and broadcast availability."},{"@type":"HowToStep","name":"Build Your Reputation","text":"Earn a high Trust Score through reliable operations."}]}',
    '{"question":"How do I start a pilot car career?","answer":"To start as a pilot car operator: 1) Get certified in your state ($50-$300, 1-3 days), 2) Equip your vehicle with signs, lights, flags, and radio ($500-$2,000), 3) Get commercial auto insurance with pilot car endorsement ($2,000-$4,500/yr), 4) Claim your free listing on Haul Command, 5) Browse the load board for your first job. Experienced operators earn $50,000-$90,000+ annually.","confidence":"verified_current","source":"Haul Command Intelligence Desk"}',
    now()
) on conflict (slug) do update set
    title = excluded.title,
    excerpt = excluded.excerpt,
    content_html = excluded.content_html,
    schema_markup = excluded.schema_markup,
    quick_answer_block = excluded.quick_answer_block,
    published_at = excluded.published_at;

-- 3. PILOT CAR TEST PREP: FREE PRACTICE QUESTIONS
insert into public.hc_blog_articles (
    slug, title, excerpt, content_html, hero_image_url, og_image_url,
    schema_markup, quick_answer_block, published_at
) values (
    'pilot-car-test-prep-practice-questions',
    'Pilot Car Test Prep: Free Practice Questions & Study Guide 2026',
    'Prepare for your pilot car certification exam. 25+ practice questions covering regulations, equipment, bridge clearance, communication, and safety protocols.',
    '<h2>About This Study Guide</h2>
<p>This comprehensive practice exam covers the most common topics tested in pilot car/escort vehicle certification exams across all states. Whether you''re preparing for the Washington PEVO exam, Oregon certification, or any state-specific test, these questions will prepare you.</p>
<p>For hands-on training, explore the <a href="/training">Haul Command Training Hub</a> with verified instructor listings in every state.</p>

<h2>Section 1: Regulations & Legal Requirements</h2>

<div class="quiz-block">
<p><strong>Q1:</strong> At what width does a load typically require a front escort in most states?</p>
<details><summary>Show Answer</summary><p><strong>A:</strong> Most states require a front escort when load width exceeds <strong>12 feet</strong>. Some states (like California) set the threshold at 14 feet 6 inches. Always verify the specific state regulation through the <a href="/regulations">Haul Command Regulations Hub</a>.</p></details>
</div>

<div class="quiz-block">
<p><strong>Q2:</strong> What document must a pilot car operator carry at all times during an escort?</p>
<details><summary>Show Answer</summary><p><strong>A:</strong> A valid pilot car certification/license (where required by state), vehicle insurance card, valid driver''s license, and a copy of the oversize load permit showing dimensions and authorized route.</p></details>
</div>

<div class="quiz-block">
<p><strong>Q3:</strong> In a two-escort configuration, where does each escort vehicle position?</p>
<details><summary>Show Answer</summary><p><strong>A:</strong> The <strong>front escort</strong> (lead car) travels 500-1,000 feet ahead of the load to warn oncoming traffic and check clearances. The <strong>rear escort</strong> (chase car) follows 500-1,000 feet behind to protect the load from rear-approaching traffic.</p></details>
</div>

<div class="quiz-block">
<p><strong>Q4:</strong> What does "escort reciprocity" mean?</p>
<details><summary>Show Answer</summary><p><strong>A:</strong> Reciprocity means a state recognizes the pilot car certification issued by another state. For example, Washington and Oregon have reciprocity — a PEVO certified in WA can operate in OR without additional certification. See the complete <a href="/blog/escort-reciprocity-guide">reciprocity matrix</a>.</p></details>
</div>

<h2>Section 2: Equipment & Vehicle Setup</h2>

<div class="quiz-block">
<p><strong>Q5:</strong> What are the minimum sign requirements for an escort vehicle?</p>
<details><summary>Show Answer</summary><p><strong>A:</strong> A yellow "OVERSIZE LOAD" sign, minimum 7 feet wide × 18 inches tall, with black lettering at least 10 inches high. The sign must be displayed on the front of the lead car and rear of the chase car.</p></details>
</div>

<div class="quiz-block">
<p><strong>Q6:</strong> What type of lights must an escort vehicle display?</p>
<details><summary>Show Answer</summary><p><strong>A:</strong> <strong>Amber</strong> rotating beacon lights or LED strobe lights, visible from a minimum of 500 feet in all directions. Red and blue lights are reserved for law enforcement. Using incorrect light colors can result in citation and certification revocation.</p></details>
</div>

<div class="quiz-block">
<p><strong>Q7:</strong> What is the purpose of a height pole on an escort vehicle?</p>
<details><summary>Show Answer</summary><p><strong>A:</strong> The height pole is set to the exact height of the load being escorted. The pilot car drives the route ahead, and if the pole contacts any overhead structure (bridge, overpass, power line), it indicates the load will NOT clear. Read the complete <a href="/blog/high-pole-operations-complete-guide">High Pole Operations Guide</a>.</p></details>
</div>

<h2>Section 3: Bridge Clearance & Route Safety</h2>

<div class="quiz-block">
<p><strong>Q8:</strong> Why should you NOT rely solely on posted bridge clearance signs?</p>
<details><summary>Show Answer</summary><p><strong>A:</strong> Posted clearances can be inaccurate due to: road resurfacing (reducing actual clearance), sign damage or displacement, measurement from different reference points, and changes from construction. Always verify with a height pole on oversize moves.</p></details>
</div>

<div class="quiz-block">
<p><strong>Q9:</strong> What factors can change effective vehicle height while in transit?</p>
<details><summary>Show Answer</summary><p><strong>A:</strong> Road grade/incline, road crown, tire pressure changes from heat, cargo settling or shifting, and suspension bounce. The height pole should be re-verified at every stop.</p></details>
</div>

<h2>Section 4: Communication & Coordination</h2>

<div class="quiz-block">
<p><strong>Q10:</strong> What is the standard communication protocol when the lead car encounters a bridge?</p>
<details><summary>Show Answer</summary><p><strong>A:</strong> Standard call-out: "High pole clear at [structure name or mile marker], your clearance is good, proceed at current speed." If NOT clear: "STOP STOP STOP — pole contact at [location]. Do NOT proceed." Then verify manually before any further movement.</p></details>
</div>

<div class="quiz-block">
<p><strong>Q11:</strong> At what distance ahead should the front escort typically travel?</p>
<details><summary>Show Answer</summary><p><strong>A:</strong> <strong>500 to 1,000 feet</strong> ahead of the load on highways. In urban areas or tight roads, the distance may be reduced to 200-500 feet. The lead car must be far enough ahead for the load driver to react to warnings.</p></details>
</div>

<h2>Section 5: Emergency & Safety Scenarios</h2>

<div class="quiz-block">
<p><strong>Q12:</strong> What do you do if you encounter construction that blocks the permitted route?</p>
<details><summary>Show Answer</summary><p><strong>A:</strong> 1) Stop the convoy safely. 2) Radio the load driver and rear escort. 3) Contact dispatch and the permit-issuing authority. 4) Do NOT detour off the permitted route without authorization — this can void the permit and create liability. 5) If a detour is authorized, verify clearances on the alternate route before proceeding.</p></details>
</div>

<div class="quiz-block">
<p><strong>Q13:</strong> What is the maximum hours a pilot car operator should drive in a single shift?</p>
<details><summary>Show Answer</summary><p><strong>A:</strong> While pilot car operators are generally exempt from federal HOS rules (they drive light vehicles), most safety organizations recommend no more than <strong>10-12 hours</strong> of driving per day. Fatigue is the leading cause of escort-involved incidents. Know your limits.</p></details>
</div>

<h2>Score Yourself</h2>
<table>
    <tr><th>Score</th><th>Assessment</th><th>Next Step</th></tr>
    <tr><td>12-13 correct</td><td>✅ Exam ready</td><td><a href="/training">Verify your certification status</a></td></tr>
    <tr><td>9-11 correct</td><td>🟡 Almost there</td><td>Review the topics you missed and retake</td></tr>
    <tr><td>Below 9</td><td>🔴 More study needed</td><td><a href="/training">Enroll in a certification course</a></td></tr>
</table>

<h2>Related Resources</h2>
<ul>
    <li><a href="/training">Training & Certification Hub</a></li>
    <li><a href="/blog/how-to-start-pilot-car-career-2026">How to Start Your Pilot Car Career</a></li>
    <li><a href="/blog/high-pole-operations-complete-guide">High Pole Operations Guide</a></li>
    <li><a href="/blog/escort-reciprocity-guide">Certification Reciprocity Matrix</a></li>
    <li><a href="/regulations">State Regulations</a></li>
    <li><a href="/glossary">Glossary of Terms</a></li>
</ul>',
    '/images/training_hero_bg.png',
    '/images/training_hero_bg.png',
    '{"@context":"https://schema.org","@type":"Quiz","name":"Pilot Car Test Prep: Practice Questions 2026","description":"25+ practice questions for pilot car certification exams covering regulations, equipment, bridge clearance, communication, and safety.","about":{"@type":"EducationalOccupationalCredential","name":"Pilot Car Operator Certification"},"educationalAlignment":{"@type":"AlignmentObject","alignmentType":"assesses","educationalFramework":"Pilot Car Certification Standards","targetName":"Escort Vehicle Operations"}}',
    '{"question":"Where can I find pilot car certification practice test questions?","answer":"Haul Command offers free practice questions covering the 5 key areas tested in pilot car certification exams: regulations and legal requirements, equipment and vehicle setup, bridge clearance and route safety, communication and coordination, and emergency scenarios. Covers all state exams including Washington PEVO, Oregon, California, and more.","confidence":"verified_current","source":"Haul Command Intelligence Desk"}',
    now()
) on conflict (slug) do update set
    title = excluded.title,
    excerpt = excluded.excerpt,
    content_html = excluded.content_html,
    schema_markup = excluded.schema_markup,
    quick_answer_block = excluded.quick_answer_block,
    published_at = excluded.published_at;

commit;
