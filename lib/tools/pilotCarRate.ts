export type PilotCarRegion =
  | 'southeast'
  | 'texas_gulf'
  | 'midwest'
  | 'mountain_west'
  | 'west_coast'
  | 'northeast'
  | 'canada';

export type PilotCarDifficulty =
  | 'standard'
  | 'overwide'
  | 'overheight'
  | 'superload'
  | 'emergency';

export type PilotCarRateInput = {
  miles: number;
  escortCount: number;
  waitHours: number;
  region: PilotCarRegion;
  difficulty: PilotCarDifficulty;
  highPole: boolean;
  overnightNights: number;
};

export type PilotCarRateResult = {
  travelDays: number;
  billableMiles: number;
  dailyRate: number;
  mileageRate: number;
  escortLabor: number;
  mileageCharge: number;
  waitCharge: number;
  highPoleCharge: number;
  overnightCharge: number;
  fuelSurcharge: number;
  lowEstimate: number;
  midEstimate: number;
  highEstimate: number;
  perEscortMid: number;
};

const REGION_DAILY_RATE: Record<PilotCarRegion, number> = {
  southeast: 425,
  texas_gulf: 475,
  midwest: 450,
  mountain_west: 525,
  west_coast: 575,
  northeast: 625,
  canada: 650,
};

const REGION_MILEAGE_RATE: Record<PilotCarRegion, number> = {
  southeast: 1.15,
  texas_gulf: 1.25,
  midwest: 1.2,
  mountain_west: 1.35,
  west_coast: 1.45,
  northeast: 1.5,
  canada: 1.55,
};

const DIFFICULTY_FACTOR: Record<PilotCarDifficulty, number> = {
  standard: 1,
  overwide: 1.12,
  overheight: 1.2,
  superload: 1.42,
  emergency: 1.65,
};

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function dollars(value: number) {
  return Math.round(value);
}

export function calculatePilotCarRate(input: PilotCarRateInput): PilotCarRateResult {
  const miles = clampNumber(input.miles, 1, 5000);
  const escortCount = clampNumber(input.escortCount, 1, 8);
  const waitHours = clampNumber(input.waitHours, 0, 96);
  const overnightNights = clampNumber(input.overnightNights, 0, 30);
  const region = input.region in REGION_DAILY_RATE ? input.region : 'southeast';
  const difficulty = input.difficulty in DIFFICULTY_FACTOR ? input.difficulty : 'standard';

  const travelDays = Math.max(1, Math.ceil(miles / 350));
  const billableMiles = Math.max(150, miles);
  const dailyRate = REGION_DAILY_RATE[region];
  const mileageRate = REGION_MILEAGE_RATE[region];
  const factor = DIFFICULTY_FACTOR[difficulty];

  const escortLabor = escortCount * travelDays * dailyRate * factor;
  const mileageCharge = escortCount * billableMiles * mileageRate;
  const waitCharge = escortCount * waitHours * 85;
  const highPoleCharge = input.highPole ? travelDays * 625 : 0;
  const overnightCharge = escortCount * overnightNights * 135;
  const subtotal = escortLabor + mileageCharge + waitCharge + highPoleCharge + overnightCharge;
  const fuelSurcharge = subtotal * 0.14;
  const midEstimate = subtotal + fuelSurcharge;

  return {
    travelDays,
    billableMiles,
    dailyRate,
    mileageRate,
    escortLabor: dollars(escortLabor),
    mileageCharge: dollars(mileageCharge),
    waitCharge: dollars(waitCharge),
    highPoleCharge: dollars(highPoleCharge),
    overnightCharge: dollars(overnightCharge),
    fuelSurcharge: dollars(fuelSurcharge),
    lowEstimate: dollars(midEstimate * 0.84),
    midEstimate: dollars(midEstimate),
    highEstimate: dollars(midEstimate * 1.2),
    perEscortMid: dollars(midEstimate / escortCount),
  };
}

export const pilotCarRegionLabels: Record<PilotCarRegion, string> = {
  southeast: 'Southeast',
  texas_gulf: 'Texas / Gulf Coast',
  midwest: 'Midwest',
  mountain_west: 'Mountain West',
  west_coast: 'West Coast',
  northeast: 'Northeast',
  canada: 'Canada',
};

export const pilotCarDifficultyLabels: Record<PilotCarDifficulty, string> = {
  standard: 'Standard oversize',
  overwide: 'Overwide / two-lane sensitivity',
  overheight: 'Overheight / high-pole risk',
  superload: 'Superload / route survey likely',
  emergency: 'Emergency or short-notice move',
};
