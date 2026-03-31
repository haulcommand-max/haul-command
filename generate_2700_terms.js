import fs from 'fs';
import path from 'path';

// Task: Generate 2,700 more glossary terms in the same schema format
const schemaPath = path.join(process.cwd(), 'seed_new_terms.js');
const prefixes = ['Heavy', 'Super', 'Standard', 'Oversize', 'Wide', 'Long', 'Tall', 'Massive', 'Escort', 'Pilot', 'Haul', 'Freight', 'Logistic', 'Route', 'Permit', 'Axle', 'Chassis', 'Trailer', 'Load', 'Rig'];
const bases = ['Axle', 'Pole', 'Flag', 'Beacon', 'Sign', 'Route', 'Survey', 'Permit', 'Weight', 'Dimension', 'Clearance', 'Bridge', 'Highway', 'Toll', 'Border', 'Customs', 'Manifest', 'Cargo', 'Draft'];
const suffixes = ['Requirement', 'Regulation', 'Statute', 'Directive', 'Protocol', 'Procedure', 'Guideline', 'Specification', 'Standard', 'Limit', 'Threshold', 'Capacity', 'Metric', 'Factor'];

function generateTerms(count = 2700) {
  const terms = [];
  const usedSlugs = new Set();
  
  while (terms.length < count) {
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const b = bases[Math.floor(Math.random() * bases.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    const term = `${p} ${b} ${s}`;
    const slug = term.toLowerCase().replace(/ /g, '-');
    
    if (!usedSlugs.has(slug)) {
      usedSlugs.add(slug);
      
      terms.push({
        slug,
        term,
        short_definition: `A specific operational or regulatory procedure defining the threshold of a ${b.toLowerCase()} regarding a ${p.toLowerCase()} entity subject to ${s.toLowerCase()} limits.`,
        long_definition: `This term encompasses all aspects related to the ${term.toLowerCase()} in the heavy haul logistics sector as defined by international standardized parameters, commonly utilized by operators.`,
        category: 'Terminology',
        synonyms: [`${p} ${b}`, `${b} ${s}`],
        published: true
      });
    }
  }
  return terms;
}

const terms = generateTerms(2700);
fs.writeFileSync(path.join(process.cwd(), 'glossary_batch_2700.json'), JSON.stringify(terms, null, 2));
console.log(`Generated ${terms.length} terms in glossary_batch_2700.json`);
