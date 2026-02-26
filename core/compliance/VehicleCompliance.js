
const FORD_MAVERICK_2022 = {
    id: 'ford-maverick-2022',
    make: 'Ford',
    model: 'Maverick',
    year: 2022,
    driveTrain: 'FWD',
    wheelSpec: {
        boltPattern: '5x108',
        centerBoreMm: 63.4,
        minOffsetMm: 30, // Considers suspension clearance
        maxOffsetMm: 45,
        originalOffsetMm: 37.5,
        originalWidthInches: 7,
        flushFrontSpacingMm: 75 // Approx limit for flush fitment (calculations vary)
    }
};

class VehicleComplianceEngine {

    /**
     * Calculates the position of the outer wheel face relative to the hub.
     * @param {number} widthInches 
     * @param {number} offsetMm 
     * @returns {number} Distance in mm from hub face to outer wheel lip
     */
    calculateFrontSpacing(widthInches, offsetMm) {
        const widthMm = widthInches * 25.4;
        const centerlineMm = widthMm / 2;
        // Positive offset moves the wheel IN, reducing front spacing.
        return centerlineMm - offsetMm;
    }

    checkWheelFitment(vehicle, newWheel, adapterThicknessMm = 0) {
        const issues = [];
        let effectiveOffset = newWheel.offsetMm;
        let effectiveCenterBore = newWheel.centerBoreMm;
        let effectiveBoltPattern = newWheel.boltPattern;

        // Apply Adapter Logic
        if (adapterThicknessMm > 0) {
            effectiveOffset = newWheel.offsetMm - adapterThicknessMm; // Adapter pushes wheel OUT, lowering offset
            // Assuming adapter fixes bolt pattern and center bore if standard "conversion" adapter
            if (newWheel.boltPattern !== vehicle.wheelSpec.boltPattern) {
                // If adapter is being used for conversion, we assume it handles the adaptation
                // But we must flag the offset change.
            }
        } else {
            // No adapter: standard checks
            if (vehicle.wheelSpec.boltPattern !== newWheel.boltPattern) {
                issues.push(`Bolt pattern mismatch: Vehicle is ${vehicle.wheelSpec.boltPattern}, Wheel is ${newWheel.boltPattern}.`);
            }
            if (newWheel.centerBoreMm < vehicle.wheelSpec.centerBoreMm) {
                issues.push(`Center bore too small: Vehicle needs ${vehicle.wheelSpec.centerBoreMm}mm.`);
            }
        }

        // POKE CALCULATION
        const currentFrontSpacing = this.calculateFrontSpacing(vehicle.wheelSpec.originalWidthInches, vehicle.wheelSpec.originalOffsetMm);
        const newFrontSpacing = this.calculateFrontSpacing(newWheel.widthInches, effectiveOffset);

        const extraPokeMm = newFrontSpacing - currentFrontSpacing;
        const extraPokeInches = extraPokeMm / 25.4;

        if (extraPokeInches > 1.5) { // Threshold for "Massive Poke" vs just "Aggressive"
            issues.push(`EXCESSIVE POKE: Wheel will stick out ${extraPokeInches.toFixed(1)}" further than stock.`);
            issues.push(`Effective Offset with adapter: ET${effectiveOffset} (Stock is ET${vehicle.wheelSpec.originalOffsetMm}).`);
        }

        return {
            compatible: issues.length === 0,
            issues,
            data: {
                extraPokeInches,
                effectiveOffset
            }
        };
    }
}

module.exports = { FORD_MAVERICK_2022, VehicleComplianceEngine };
