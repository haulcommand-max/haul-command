import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Video Production Guide â€” Free Tools Only | Haul Command Admin',
  description: 'Step-by-step guide to producing YouTube videos using only free tools.',
};

const STEPS = [
  {
    step: 1,
    title: 'Get Your Script',
    tool: 'Haul Command Admin',
    cost: 'Free',
    instructions: [
      'Go to /admin/content and click the YouTube tab',
      'Find a script with status = Script Ready',
      'Click \'Copy Script\' to copy the full script to clipboard',
      'Scripts are 5-7 minutes when spoken at normal pace',
    ],
  },
  {
    step: 2,
    title: 'Generate AI Voiceover',
    tool: 'ElevenLabs (elevenlabs.io)',
    cost: 'Free tier: 10,000 chars/month (2 videos) | Paid: $5/month (6 videos)',
    instructions: [
      'Create free account at elevenlabs.io',
      'Click \'Text to Speech\' in the left sidebar',
      'Select voice: \'Adam\' (authoritative) or \'Rachel\' (clear)',
      'Paste your script into the text box',
      'Click Generate, then Download MP3',
      'OPTIONAL (â†’ $22/month): Go to Voice Lab â†’ Clone a Voice',
      'Record yourself speaking for 60 seconds',
      'Upload recording â€” ElevenLabs clones your voice',
      'All future videos sound like you. No recording booth needed.',
    ],
  },
  {
    step: 3,
    title: 'Create Slides',
    tool: 'Google Slides (slides.google.com)',
    cost: 'Free',
    instructions: [
      'Open Google Slides, set background to black (#0A0A0A)',
      'Use gold headings (#F5A623), white body text',
      'One key point per slide. Keep it sparse.',
      'Add Haul Command logo to bottom-right of every slide',
      'For data slides: paste screenshots from haulcommand.com/admin',
      'For corridor slides: paste a Google Maps screenshot',
      'Aim for 12-20 slides for a 7-minute video',
    ],
  },
  {
    step: 4,
    title: 'Screen Record',
    tool: 'Built-in OS recorder',
    cost: 'Free',
    instructions: [
      'Mac: Press Shift+Cmd+5, select \'Record Entire Screen\'',
      'Windows: Press Win+G, click the record button',
      'Alternative: Download OBS Studio (free, obsproject.com)',
      'Play your ElevenLabs MP3 through headphones',
      'Start recording, advance slides to match the audio',
      'One slide every 15-30 seconds',
      'Record in one take â€” perfection is not required',
    ],
  },
  {
    step: 5,
    title: 'Edit in CapCut',
    tool: 'CapCut Desktop (capcut.com)',
    cost: 'Free',
    instructions: [
      'Download CapCut free at capcut.com/tools/desktop-video-editor',
      'Import your screen recording',
      'Click \'Auto Captions\' â€” CapCut generates captions in one click',
      'Optional: Add 3-second intro card with Haul Command logo + black background',
      'Optional: Add end screen with haulcommand.com URL',
      'Export at 1080p HD',
      'Total editing time: 10-15 minutes',
    ],
  },
  {
    step: 6,
    title: 'Upload to YouTube',
    tool: 'YouTube Studio (studio.youtube.com)',
    cost: 'Free',
    instructions: [
      'Title: Use the exact keyword from the script (CRITICAL for SEO)',
      'Description: 300+ words. Put haulcommand.com link in first 3 lines.',
      'Tags: Add 10-15 tags from the script topic',
      'Thumbnail: Create in Canva (free). Dark background + bold gold text.',
      'Thumbnail text example: â€œ47 MIN FILL TIMEâ€ or â€œAV TRUCKS NEED ESCORTSâ€',
      'Set End Screen: link to haulcommand.com and suggest related video',
      'Add Cards: link to haulcommand.com/directory or relevant page',
    ],
  },
];

const COST_SUMMARY = [
  { item: 'Script writing (Claude API)', cost: '$0', note: 'Already running' },
  { item: 'Voiceover (ElevenLabs free)', cost: '$0', note: '2 videos/month' },
  { item: 'Voiceover (your cloned voice)', cost: '$22/mo', note: 'Unlimited videos' },
  { item: 'Slides (Google Slides)', cost: '$0', note: 'Google account' },
  { item: 'Screen recording', cost: '$0', note: 'Built into OS' },
  { item: 'Editing (CapCut)', cost: '$0', note: 'Free desktop app' },
  { item: 'Upload (YouTube)', cost: '$0', note: 'Always free' },
];

export default function VideoGuidePage() {
  return (
    <div className=" bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">YouTube Video Production Guide</h1>
          <p className="text-gray-400">
            Make professional YouTube videos using only free tools.
            Scripts are auto-generated. This guide covers everything else.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6 mb-12">
          {STEPS.map((s) => (
            <div key={s.step} className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-amber-500 text-white font-bold rounded-lg flex items-center justify-center flex-shrink-0">
                  {s.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="font-bold text-lg">{s.title}</h2>
                    <span className="text-xs px-2 py-0.5 bg-white/5 text-gray-400 rounded-full">{s.tool}</span>
                  </div>
                  <p className="text-xs text-amber-400 mb-3">Cost: {s.cost}</p>
                  <ul className="space-y-1.5">
                    {s.instructions.map((inst, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-amber-500 mt-0.5">â†’</span>
                        {inst}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cost summary */}
        <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
          <h2 className="font-bold mb-4">Total cost per video</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/5">
              {COST_SUMMARY.map((row) => (
                <tr key={row.item}>
                  <td className="py-2 text-gray-300">{row.item}</td>
                  <td className="py-2 font-bold text-amber-400 text-right">{row.cost}</td>
                  <td className="py-2 text-gray-600 text-right text-xs">({row.note})</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
            <span className="font-bold">Total</span>
            <span className="font-bold text-green-400">$0 â€” $22/month</span>
          </div>
        </div>
      </div>
    </div>
  );
}