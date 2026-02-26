

const calculateTireDiameter = (width, aspect, rim) => {
    const sidewallHeightMm = width * (aspect / 100);
    const sidewallHeightInches = sidewallHeightMm / 25.4;
    const diameter = rim + (2 * sidewallHeightInches);
    return diameter;
};

// User Proposed: Front 275/40R22, Rear 305/35R22
const frontWidth = 275;
const frontAspect = 40;
const frontRim = 22;

const rearWidth = 305;
const rearAspect = 35;
const rearRim = 22;

// Standard Maverick Ref (225/65R17) approx 28.5"
const stockDiameter = 28.5;

const frontDia = calculateTireDiameter(frontWidth, frontAspect, frontRim);
const rearDia = calculateTireDiameter(rearWidth, rearAspect, rearRim);

const diff = Math.abs(frontDia - rearDia);
const percentDiff = (diff / frontDia) * 100;

console.log(`Front Tire (275/40R22): ${frontDia.toFixed(2)} inches`);
console.log(`Rear Tire (305/35R22): ${rearDia.toFixed(2)} inches`);
console.log(`Diameter Difference: ${diff.toFixed(2)} inches`);
console.log(`Percentage Difference: ${percentDiff.toFixed(2)}%`);
console.log(`Height Increase over Stock (28.5"): +${(frontDia - stockDiameter).toFixed(2)}"`);

if (percentDiff > 3) {
    console.log("WARNING: Diameter delta > 3%. ABS/Traction Impact.");
} else {
    console.log("SUCCESS: Diameter delta is within tolerance (<3%).");
}

if (frontDia > 30.5) {
    console.log("CRITICAL: Diameters > 30.5 inches will likely RUB without a lift kit.");
}

