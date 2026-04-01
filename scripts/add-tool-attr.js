const fs = require('fs');
const path = require('path');
const toolsDir = path.join(__dirname, '../app/tools');

function processDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (file === 'page.tsx') {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (!content.includes('data-tool-interact') && content.includes('return (')) {
                const returnIdx = content.indexOf('return (');
                const divIdx = content.indexOf('<div', returnIdx);
                const mainIdx = content.indexOf('<main', returnIdx);
                
                let targetIdx = -1;
                let addText = '';
                if (divIdx !== -1 && (mainIdx === -1 || divIdx < mainIdx)) {
                    targetIdx = divIdx + 4;
                    addText = ' data-tool-interact="true"';
                } else if (mainIdx !== -1) {
                    targetIdx = mainIdx + 5;
                    addText = ' data-tool-interact="true"';
                }

                if (targetIdx !== -1 && targetIdx < returnIdx + 500) {
                    content = content.slice(0, targetIdx) + addText + content.slice(targetIdx);
                    fs.writeFileSync(fullPath, content, 'utf8');
                    console.log('Updated', fullPath);
                } else {
                    console.log('Skipped', fullPath, 'no <div or <main soon after return');
                }
            }
        }
    });
}

processDir(toolsDir);
