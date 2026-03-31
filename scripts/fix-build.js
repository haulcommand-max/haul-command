const fs = require('fs');
const glob = require('glob');

// Fix ssr: false
function fixSSRFalse(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const newContent = content.replace(/,\s*\{\s*ssr:\s*false\s*\}/g, '');
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Fixed ssr: false in ${filePath}`);
    }
}

// Fix mismatched <button> ... </Button> tags
function fixMismatchedButtons(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Regex to fix an opening <button> tag that ends with </Button>
    // Just find any </Button> and replace it with </button> if it was a <button> opening tag
    // Or easier: globally replace <button aria-label="Interactive Button" with <Button aria-label="Interactive Button"
    // Wait, if we replace `<button aria-label="Interactive Button"` with `<Button aria-label="Interactive Button"`
    // it fixes the mismatched tag because it will now be <Button>...</Button>, but we must make sure all those match `<Button>`.
    // Let's just replace all `</Button>` with `</button>` where the opening tag was `<button`.
    
    // Actually, it's easier to just globally replace `<button aria-label="Interactive Button"` with `<Button aria-label="Interactive Button"`
    // if the file imports `Button`, or just change `</Button>` to `</button>` universally where `Button` isn't imported correctly.
    // In LoadBoardClient, it imported `Button`. But it's easier to just change `</Button>` to `</button>` globally to be safe.
    // Actually no, `<Button>` allows `size="sm"` and `variant="outline"`. Standard `<button>` does not.
    // Therefore we MUST change `<button aria-label="Interactive Button"` to `<Button aria-label="Interactive Button"`.
    let newContent = content.replace(/<button aria-label="Interactive Button"/g, '<Button aria-label="Interactive Button"');
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Fixed mismatched buttons in ${filePath}`);
    }
}

fixSSRFalse('app/blog/[slug]/page.tsx');
fixSSRFalse('app/tools/[country_code]/[slug]/page.tsx');

fixMismatchedButtons('app/dashboard/broker/loads/LoadBoardClient.tsx');
fixMismatchedButtons('app/dashboard/operator/OperatorDashboardClient.tsx');
// Just in case, fix other files if they have it
try {
  fixMismatchedButtons('app/tools/cross-border/page.tsx');
} catch (e) {}

console.log("Fixes applied.");
