const fs = require('fs');

function fixTag(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Force all buttons to uppercase component <Button>
    content = content.replace(/<button /g, '<Button ');
    content = content.replace(/<\/button>/g, '</Button>');
    
    fs.writeFileSync(filePath, content, 'utf8');
}

fixTag('app/dashboard/broker/loads/LoadBoardClient.tsx');
fixTag('app/dashboard/operator/OperatorDashboardClient.tsx');
console.log('Fixed tags aggressively.');
