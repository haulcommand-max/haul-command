const fs = require('fs');
const input = fs.readFileSync('C:\\Users\\PC User\\.gemini\\antigravity\\brain\\2a943e8c-0c71-4a12-831b-903df5d84ae4\\.system_generated\\steps\\2289\\content.md', 'utf-8');

const lines = input.split('\n');
const records = [];
let currentRecord = null;

for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('### [')) {
        if (currentRecord) records.push(currentRecord);
        let name = line.replace('### ', '');
        if (name.includes('[') && name.includes(']')) {
            name = name.split(']')[0].substring(1);
        }
        currentRecord = { name, city: '', state: '', phone: '', source_url: '', services: [] };
    } else if (currentRecord) {
        if (line.startsWith('[📞 Call Now](tel:')) {
            const match = line.match(/tel:(.*)\)/);
            if (match) currentRecord.phone = match[1];
        } else if (line.startsWith('[View Company Details](')) {
            const match = line.match(/\((.*)\)/);
            if (match) currentRecord.source_url = match[1];
        } else if (line.includes(' , ')) {
            const parts = line.split(' , ');
            currentRecord.city = parts[0];
            currentRecord.state = parts.slice(1).join(' , ');
        } else if (line !== '' && !line.startsWith('[')) {
            currentRecord.services.push(line);
        }
    }
}
if (currentRecord) records.push(currentRecord);

fs.writeFileSync('.planning/data/osowhaven_seed.json', JSON.stringify(records, null, 2));
console.log(`Extracted ${records.length} records.`);
