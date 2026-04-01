const fs = require('fs');

function fixTag(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace any lowercase <button...> tags that were missed
    content = content.replace(/<button([^>]*)>/g, '<Button$1>');
    content = content.replace(/<\/button>/gi, '</Button>');
    
    fs.writeFileSync(filePath, content, 'utf8');
}

fixTag('app/dashboard/broker/loads/LoadBoardClient.tsx');
fixTag('app/dashboard/operator/OperatorDashboardClient.tsx');
console.log('Fixed tags rigorously.');
