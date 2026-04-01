const fs = require('fs');
const path = require('path');

const contactsPath = path.join(__dirname, '..', 'data', 'uspilotcars_all_contacts.json');
const data = JSON.parse(fs.readFileSync(contactsPath, 'utf8'));

console.log(`Total Contacts in file: ${data.length}`);

const roles = {};
let noLocation = 0;
let noPosition = 0;

data.forEach(c => {
    const pos = c.position || c.role || c.type || 'Unknown';
    roles[pos] = (roles[pos] || 0) + 1;
    
    // Check if in proper places
    const hasLocation = c.state || c.location || c.city || c.address || c.lat || c.coordinates;
    if (!hasLocation) {
        noLocation++;
    }
});

console.log('Roles/Positions:', roles);
console.log(`Contacts without locations (not in "proper places"?): ${noLocation}`);
