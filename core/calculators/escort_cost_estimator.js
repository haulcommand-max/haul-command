
// Transpiled version of EscortCostEstimator for standalone verification
export class EscortCostEstimator {
    static RATES = {
        STANDARD: {
            MILE_MIN: 1.85,
            MILE_MAX: 2.25,
            DAY_MIN_LOW: 450,
            DAY_MIN_HIGH: 650
        },
        POLE_CAR: {
            MILE_MIN: 2.25,
            MILE_MAX: 2.75,
            DAY_MIN_LOW: 550,
            DAY_MIN_HIGH: 750
        },
        BUCKET_TRUCK: {
            FLAT_LOW: 3500,
            FLAT_HIGH: 5500
        },
        POLICE: {
            HOURLY_MIN: 85,
            HOURLY_MAX: 135,
            MIN_HOURS: 4,
            MGMT_FEE_PERCENT: 0.15
        },
        OVERNIGHT: {
            LOW: 150,
            HIGH: 250
        }
    };

    /**
     * Calculates the estimated cost range for escort services.
     */
    static calculate(request) {
        const lines = {};
        let totalMin = 0;
        let totalMax = 0;

        const days = request.durationDays || 1;
        const overnights = request.overnightStops !== undefined ? request.overnightStops : Math.max(0, days - 1);

        // 1. Standard Escorts Calculation
        if (request.standardEscorts && request.standardEscorts > 0) {
            const { min, max } = this.calculateVehicleCost(
                request.miles,
                request.standardEscorts,
                this.RATES.STANDARD
            );
            lines.standardEscort = { min, max, breakdown: `${request.standardEscorts} x (Lead/Chase)` };
            totalMin += min;
            totalMax += max;
        }

        // 2. High Pole Car Calculation
        if (request.highPoleCar) {
            const { min, max } = this.calculateVehicleCost(
                request.miles,
                1,
                this.RATES.POLE_CAR
            );
            lines.highPole = { min, max, breakdown: '1 x High Pole w/ Height Stick' };
            totalMin += min;
            totalMax += max;
        }

        // 3. Bucket Truck Calculation
        if (request.bucketTruck) {
            const min = this.RATES.BUCKET_TRUCK.FLAT_LOW;
            const max = this.RATES.BUCKET_TRUCK.FLAT_HIGH;
            lines.bucketTruck = { min, max, breakdown: 'Route mitigation / Obstruction removal' };
            totalMin += min;
            totalMax += max;
        }

        // 4. Police Escort Calculation
        if (request.policeEscorts && request.policeEscorts > 0) {
            const hours = Math.max(request.policeHoursPerOfficer || 4, this.RATES.POLICE.MIN_HOURS);
            const officerCount = request.policeEscorts;

            const rawMin = officerCount * hours * this.RATES.POLICE.HOURLY_MIN;
            const rawMax = officerCount * hours * this.RATES.POLICE.HOURLY_MAX;

            // Calculate Mgmt Fee
            const feeMin = rawMin * this.RATES.POLICE.MGMT_FEE_PERCENT;
            const feeMax = rawMax * this.RATES.POLICE.MGMT_FEE_PERCENT;

            lines.police = { min: rawMin, max: rawMax, breakdown: `${officerCount} Officer(s) @ ${hours}hrs est` };
            lines.mgmtFees = { min: feeMin, max: feeMax, breakdown: '15% Police Coordination Fee' };

            totalMin += rawMin + feeMin;
            totalMax += rawMax + feeMax;
        }

        // 5. Overnights
        if (overnights > 0) {
            // Per vehicle per night
            const totalVehicles = (request.standardEscorts || 0) + (request.highPoleCar ? 1 : 0);
            if (totalVehicles > 0) {
                const min = totalVehicles * overnights * this.RATES.OVERNIGHT.LOW;
                const max = totalVehicles * overnights * this.RATES.OVERNIGHT.HIGH;
                lines.overnights = { min, max, breakdown: `${totalVehicles} vehicle(s) x ${overnights} night(s)` };
                totalMin += min;
                totalMax += max;
            }
        }

        return {
            totalCost: { min: totalMin, max: totalMax },
            lineItems: lines,
            disclaimer: "ESTIMATE ONLY. Final rates depend on exact route, market availability, and fuel surcharges. Police hours are estimated min 4hr blocks."
        };
    }

    static calculateVehicleCost(miles, count, rates) {
        // Calculate Mileage Based
        const mileageMin = miles * rates.MILE_MIN;
        const mileageMax = miles * rates.MILE_MAX;

        // Check against Day Minimums
        const operationalMin = Math.max(mileageMin, rates.DAY_MIN_LOW);
        const operationalMax = Math.max(mileageMax, rates.DAY_MIN_HIGH);

        return {
            min: operationalMin * count,
            max: operationalMax * count
        };
    }
}
