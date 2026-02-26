
const fs = require('fs');
const filePath = 'c:\\Users\\PC User\\Biz\\core\\seeds\\raw_vendor_grid.json';

try {
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`File exists. Size: ${stats.size} bytes`);
        if (stats.size > 0) {
            // Look at the first few characters to see if it's valid JSON start
            const fd = fs.openSync(filePath, 'r');
            const buffer = Buffer.alloc(100);
            fs.readSync(fd, buffer, 0, 100, 0);
            console.log(`First 100 bytes: ${buffer.toString('utf8')}`);
            fs.closeSync(fd);
        }
    } else {
        console.log('File does NOT exist yet.');
    }
} catch (err) {
    console.error(err);
}
