
const fs = require('fs');

async function run() {
    const url = "https://uspilotcars.com/alabama_truck_stops.html";
    console.log("Fetching " + url + "...");
    try {
        const res = await fetch(url);
        const html = await res.text();
        fs.writeFileSync('debug_alabama.html', html);
        console.log("Saved to debug_alabama.html");
    } catch (err) {
        console.error(err);
    }
}

run();
