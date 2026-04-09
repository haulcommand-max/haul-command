import { gemini } from '../lib/ai/brain.js';

/**
 * 120-COUNTRY SEO MONOPOLY MATRIX
 * 
 * Instead of alphabetically scraping the world, this engine uses LLM intelligence
 * to score and rank countries based on how easily Haul Command can monopolize
 * their heavy-haul search traffic.
 */

const REMAINING_COUNTRIES = [
  'Germany', 'France', 'United Kingdom', 'Brazil', 'Mexico', 'South Africa',
  'United Arab Emirates', 'Saudi Arabia', 'India', 'Japan', 'South Korea',
  // ... 106 more
];

async function calculateMonopolyScore(country: string) {
  const prompt = `
Analyze the heavy-haul and oversize transport digital landscape for ${country}.
Score this country from 1-10 on three vectors where 10 means "Easiest to monopolize via SEO".

1. Government Data Transparency (10 = DOT/Permit structures are digital and easily available)
2. Existing Competition (10 = No existing digital directories or heavy-haul aggregators)
3. English Search Intent (10 = Target demographic uses mostly English for global heavy-haul operations)

Return ONLY JSON:
{
  "country": "${country}",
  "transparency": 8,
  "lack_of_competition": 9,
  "english_intent": 5
}
`;

  try {
    const res = await gemini().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json', temperature: 0.1 }
    });
    
    const data = JSON.parse(res.text ?? '{}');
    const totalScore = (data.transparency + data.lack_of_competition + data.english_intent) / 30;
    
    return { ...data, monopolyScore: totalScore.toFixed(2) };
  } catch (err) {
    return { country, monopolyScore: 0 };
  }
}

async function runSeoMatrix() {
  console.log('Calculating SEO Monopoly scores for global targets...');
  
  // We would map through all 117 countries here. Testing top 5:
  const testSet = ['South Africa', 'United Arab Emirates', 'Brazil', 'Germany', 'Saudi Arabia'];
  
  const results = [];
  for (const c of testSet) {
    const score = await calculateMonopolyScore(c);
    results.push(score);
    console.log(`[MATRIX] ${c}: ${score.monopolyScore} Monopoly Score`);
  }
  
  const ranked = results.sort((a, b) => b.monopolyScore - a.monopolyScore);
  
  console.log('\n🏆 TOP 3 EASIEST SEO MONOPOLY TARGETS:');
  ranked.slice(0, 3).forEach(r => console.log(` - ${r.country} (${r.monopolyScore})`));
}

runSeoMatrix().catch(console.error);
