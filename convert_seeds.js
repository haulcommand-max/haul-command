const fs = require('fs');

const queueCsv = fs.readFileSync('app/training/data/country_queue.csv', 'utf8').trim().split('\n').slice(1);
const sourcesCsv = fs.readFileSync('app/training/data/confirmed_sources_seed.csv', 'utf8').trim().split('\n').slice(1);

let sqlQueue = '-- country_ingest_queue seeds\nINSERT INTO country_ingest_queue (country_code, country_name, tier, crawl_priority, search_status, coverage_status) VALUES\n';
const queueValues = queueCsv.map(row => {
  const [cc, name, tier, priority, status, coverage] = row.split(',');
  if(!cc) return null;
  return `('${cc}', '${name.replace(/'/g, "''")}', '${tier}', ${priority}, '${status}', '${coverage}')`;
}).filter(Boolean);
sqlQueue += queueValues.join(',\n') + '\nON CONFLICT (country_code) DO NOTHING;\n\n';

let sqlSources = '-- regulation_sources seeds\nINSERT INTO regulation_sources (row_key, country_code, country_name, state_province, jurisdiction_level, source_type, year_stated, official_status, training_value_score, url, source_title, authority_name, language_code, notes) VALUES\n';

const parseCSV = (str) => {
    const arr = [];
    let quote = false;
    for (let row = '', i = 0; i < str.length; i++) {
        const cc = str[i], nc = str[i+1];
        if (cc === '"' && quote && nc === '"') { row += cc; ++i; continue; }
        if (cc === '"') { quote = !quote; continue; }
        if (cc === ',' && !quote) { arr.push(row); row = ''; continue; }
        row += cc;
        if (i === str.length - 1) arr.push(row);
    }
    return arr;
};

const sourceValues = sourcesCsv.map(row => {
  if(!row) return null;
  const parsed = parseCSV(row);
  const [key, cc, cname, state, level, type, yr, off_non, score, url, title, auth, lang, notes] = parsed;
  return `('${key}', '${cc}', '${cname.replace(/'/g, "''")}', ${state ? "'"+state.replace(/'/g, "''")+"'" : 'NULL'}, '${level}', '${type}', '${yr}', '${off_non}', ${score}, '${url.replace(/'/g, "''")}', '${title.replace(/'/g, "''")}', '${auth.replace(/'/g, "''")}', '${lang}', '${notes ? notes.replace(/'/g, "''") : ''}')`;
}).filter(Boolean);
sqlSources += sourceValues.join(',\n') + '\nON CONFLICT (row_key) DO NOTHING;\n';

fs.writeFileSync('supabase/migrations/20260408_009_seed_regulation_sources.sql', sqlQueue + sqlSources);
console.log("Written to 20260408_009_seed_regulation_sources.sql");
