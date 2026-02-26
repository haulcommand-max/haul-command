// lib/seo/pilot-car-taxonomy.ts
// Single source of truth for the SEO keyword universe.
// Powers: /pilot-car/[state], /escort-requirements/[state|province], /pilot-car/[state]/[city],
//         /corridors/[slug]/pilot-car, /industries/[slug], /answers/[slug], sitemap, structured data.
// Scale: ~40 US states + 6 Canadian provinces = 46 jurisdictions × cities × load types × corridors
// → 200K–500K indexable keyword targets from this single file.

// ─────────────────────────────────────────────────────────────────────────────
// STATES
// ─────────────────────────────────────────────────────────────────────────────

export interface StateData {
    slug: string;
    name: string;
    abbr: string;
    country?: "US" | "CA"; // defaults to "US" if omitted
    /** Max legal width in FEET before escort required */
    maxWidthFt: number;
    /** Max legal height in FEET before height pole required */
    maxHeightFt: number;
    /** Requires police escort above this width */
    policeWidthFt?: number;
    /** Key commercial metros / cities we target */
    topCities: CityData[];
    /** Major corridors in this state/province — matches corridor slugs */
    corridors: string[];
    /** Override body text intro for differentiation (optional) */
    customIntro?: string;
    /** Port slugs where this state is primary origin/destination */
    portSlugs?: string[];
    /** Demand tier — affects pricing and scarcity copy */
    demandTier: "high" | "medium" | "low";
    /** Regulatory body (for structured data / content) */
    dotName?: string;
}

export interface CityData {
    slug: string;
    name: string;
    county?: string;
    nearPort?: string;
    nearCorridor?: string;
    demandTier: "high" | "medium" | "low";
}

export const PILOT_CAR_STATES: StateData[] = [
    // ── US STATES ──────────────────────────────────────────────────────────
    {
        slug: "texas",
        name: "Texas",
        abbr: "TX",
        maxWidthFt: 8.5,
        maxHeightFt: 14,
        policeWidthFt: 20,
        demandTier: "high",
        corridors: ["i-10-southern", "i-35-central", "i-20-west", "i-45-gulf"],
        portSlugs: ["port-houston", "port-beaumont", "port-corpus-christi"],
        topCities: [
            { slug: "houston", name: "Houston", county: "Harris County", nearPort: "port-houston", nearCorridor: "i-10-southern", demandTier: "high" },
            { slug: "dallas", name: "Dallas", county: "Dallas County", nearCorridor: "i-35-central", demandTier: "high" },
            { slug: "san-antonio", name: "San Antonio", county: "Bexar County", nearCorridor: "i-35-central", demandTier: "high" },
            { slug: "beaumont", name: "Beaumont", county: "Jefferson County", nearPort: "port-beaumont", demandTier: "high" },
            { slug: "laredo", name: "Laredo", county: "Webb County", nearCorridor: "i-35-central", demandTier: "medium" },
            { slug: "odessa", name: "Odessa", county: "Ector County", nearCorridor: "i-20-west", demandTier: "medium" },
            { slug: "corpus-christi", name: "Corpus Christi", county: "Nueces County", nearPort: "port-corpus-christi", demandTier: "medium" },
        ],
    },
    {
        slug: "florida",
        name: "Florida",
        abbr: "FL",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        policeWidthFt: 18,
        demandTier: "high",
        corridors: ["i-75-southeast", "i-10-southern", "i-95-atlantic"],
        portSlugs: ["port-of-jacksonville", "port-of-tampa", "port-everglades"],
        topCities: [
            { slug: "jacksonville", name: "Jacksonville", county: "Duval County", nearPort: "port-of-jacksonville", nearCorridor: "i-95-atlantic", demandTier: "high" },
            { slug: "tampa", name: "Tampa", county: "Hillsborough County", nearPort: "port-of-tampa", nearCorridor: "i-75-southeast", demandTier: "high" },
            { slug: "miami", name: "Miami", county: "Miami-Dade County", nearPort: "port-everglades", nearCorridor: "i-95-atlantic", demandTier: "high" },
            { slug: "gainesville", name: "Gainesville", county: "Alachua County", nearCorridor: "i-75-southeast", demandTier: "medium" },
            { slug: "tallahassee", name: "Tallahassee", county: "Leon County", nearCorridor: "i-10-southern", demandTier: "medium" },
            { slug: "orlando", name: "Orlando", county: "Orange County", nearCorridor: "i-75-southeast", demandTier: "medium" },
        ],
    },
    {
        slug: "georgia",
        name: "Georgia",
        abbr: "GA",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        policeWidthFt: 16,
        demandTier: "high",
        corridors: ["i-75-southeast", "i-95-atlantic", "i-20-east"],
        portSlugs: ["port-of-savannah", "port-of-brunswick"],
        topCities: [
            { slug: "atlanta", name: "Atlanta", county: "Fulton County", nearCorridor: "i-75-southeast", demandTier: "high" },
            { slug: "savannah", name: "Savannah", county: "Chatham County", nearPort: "port-of-savannah", nearCorridor: "i-95-atlantic", demandTier: "high" },
            { slug: "brunswick", name: "Brunswick", county: "Glynn County", nearPort: "port-of-brunswick", demandTier: "medium" },
            { slug: "macon", name: "Macon", county: "Bibb County", nearCorridor: "i-75-southeast", demandTier: "medium" },
        ],
    },
    {
        slug: "california",
        name: "California",
        abbr: "CA",
        maxWidthFt: 8.5,
        maxHeightFt: 14,
        policeWidthFt: 20,
        demandTier: "high",
        corridors: ["i-5-west-coast", "i-10-southern"],
        portSlugs: ["port-of-los-angeles", "port-of-long-beach", "port-of-oakland"],
        topCities: [
            { slug: "los-angeles", name: "Los Angeles", county: "Los Angeles County", nearPort: "port-of-los-angeles", nearCorridor: "i-5-west-coast", demandTier: "high" },
            { slug: "long-beach", name: "Long Beach", county: "Los Angeles County", nearPort: "port-of-long-beach", demandTier: "high" },
            { slug: "fresno", name: "Fresno", county: "Fresno County", nearCorridor: "i-5-west-coast", demandTier: "medium" },
            { slug: "bakersfield", name: "Bakersfield", county: "Kern County", nearCorridor: "i-5-west-coast", demandTier: "medium" },
            { slug: "stockton", name: "Stockton", county: "San Joaquin County", nearPort: "port-of-oakland", demandTier: "medium" },
        ],
    },
    {
        slug: "louisiana",
        name: "Louisiana",
        abbr: "LA",
        maxWidthFt: 8.5,
        maxHeightFt: 13.6,
        policeWidthFt: 18,
        demandTier: "high",
        corridors: ["i-10-southern", "i-20-west"],
        portSlugs: ["port-of-new-orleans", "port-of-baton-rouge", "port-of-lake-charles"],
        topCities: [
            { slug: "new-orleans", name: "New Orleans", county: "Orleans Parish", nearPort: "port-of-new-orleans", nearCorridor: "i-10-southern", demandTier: "high" },
            { slug: "baton-rouge", name: "Baton Rouge", county: "East Baton Rouge Parish", nearPort: "port-of-baton-rouge", nearCorridor: "i-10-southern", demandTier: "high" },
            { slug: "lake-charles", name: "Lake Charles", county: "Calcasieu Parish", nearPort: "port-of-lake-charles", demandTier: "high" },
            { slug: "shreveport", name: "Shreveport", county: "Caddo Parish", nearCorridor: "i-20-west", demandTier: "medium" },
        ],
    },
    {
        slug: "alabama",
        name: "Alabama",
        abbr: "AL",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        policeWidthFt: 16,
        demandTier: "medium",
        corridors: ["i-10-southern", "i-65-central"],
        portSlugs: ["port-of-mobile"],
        topCities: [
            { slug: "mobile", name: "Mobile", county: "Mobile County", nearPort: "port-of-mobile", nearCorridor: "i-10-southern", demandTier: "high" },
            { slug: "birmingham", name: "Birmingham", county: "Jefferson County", nearCorridor: "i-65-central", demandTier: "medium" },
            { slug: "huntsville", name: "Huntsville", county: "Madison County", demandTier: "medium" },
        ],
    },
    {
        slug: "mississippi",
        name: "Mississippi",
        abbr: "MS",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "medium",
        corridors: ["i-10-southern", "i-20-west"],
        portSlugs: ["port-of-gulfport"],
        topCities: [
            { slug: "gulfport", name: "Gulfport", county: "Harrison County", nearPort: "port-of-gulfport", nearCorridor: "i-10-southern", demandTier: "medium" },
            { slug: "jackson", name: "Jackson", county: "Hinds County", nearCorridor: "i-20-west", demandTier: "low" },
        ],
    },
    {
        slug: "south-carolina",
        name: "South Carolina",
        abbr: "SC",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "medium",
        corridors: ["i-95-atlantic", "i-26-southeast"],
        portSlugs: ["port-of-charleston"],
        topCities: [
            { slug: "charleston", name: "Charleston", county: "Charleston County", nearPort: "port-of-charleston", nearCorridor: "i-95-atlantic", demandTier: "high" },
            { slug: "columbia", name: "Columbia", county: "Richland County", nearCorridor: "i-26-southeast", demandTier: "medium" },
        ],
    },
    {
        slug: "north-carolina",
        name: "North Carolina",
        abbr: "NC",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "medium",
        corridors: ["i-95-atlantic", "i-85-southeast"],
        portSlugs: ["port-of-wilmington", "port-of-morehead-city"],
        topCities: [
            { slug: "wilmington", name: "Wilmington", county: "New Hanover County", nearPort: "port-of-wilmington", nearCorridor: "i-95-atlantic", demandTier: "medium" },
            { slug: "charlotte", name: "Charlotte", county: "Mecklenburg County", nearCorridor: "i-85-southeast", demandTier: "medium" },
            { slug: "greensboro", name: "Greensboro", county: "Guilford County", demandTier: "low" },
        ],
    },
    {
        slug: "virginia",
        name: "Virginia",
        abbr: "VA",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "medium",
        corridors: ["i-95-atlantic", "i-81-appalachian"],
        portSlugs: ["port-of-virginia"],
        topCities: [
            { slug: "norfolk", name: "Norfolk", county: "Norfolk City", nearPort: "port-of-virginia", nearCorridor: "i-95-atlantic", demandTier: "high" },
            { slug: "richmond", name: "Richmond", county: "Richmond City", nearCorridor: "i-95-atlantic", demandTier: "medium" },
            { slug: "roanoke", name: "Roanoke", county: "Roanoke City", nearCorridor: "i-81-appalachian", demandTier: "low" },
        ],
    },
    {
        slug: "ohio",
        name: "Ohio",
        abbr: "OH",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "medium",
        corridors: ["i-70-midwest", "i-75-midwest", "i-80-northern"],
        topCities: [
            { slug: "columbus", name: "Columbus", county: "Franklin County", nearCorridor: "i-70-midwest", demandTier: "medium" },
            { slug: "cleveland", name: "Cleveland", county: "Cuyahoga County", nearCorridor: "i-80-northern", demandTier: "medium" },
            { slug: "toledo", name: "Toledo", county: "Lucas County", nearCorridor: "i-75-midwest", demandTier: "low" },
        ],
    },
    {
        slug: "pennsylvania",
        name: "Pennsylvania",
        abbr: "PA",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "medium",
        corridors: ["i-76-northeast", "i-80-northern", "i-95-atlantic"],
        portSlugs: ["port-of-philadelphia"],
        topCities: [
            { slug: "philadelphia", name: "Philadelphia", county: "Philadelphia County", nearPort: "port-of-philadelphia", nearCorridor: "i-95-atlantic", demandTier: "medium" },
            { slug: "pittsburgh", name: "Pittsburgh", county: "Allegheny County", nearCorridor: "i-76-northeast", demandTier: "medium" },
        ],
    },
    {
        slug: "michigan",
        name: "Michigan",
        abbr: "MI",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "medium",
        corridors: ["i-75-midwest", "i-94-northern"],
        topCities: [
            { slug: "detroit", name: "Detroit", county: "Wayne County", nearCorridor: "i-94-northern", demandTier: "medium" },
            { slug: "grand-rapids", name: "Grand Rapids", county: "Kent County", demandTier: "low" },
        ],
    },
    {
        slug: "tennessee",
        name: "Tennessee",
        abbr: "TN",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "medium",
        corridors: ["i-40-central", "i-75-southeast", "i-24-southeast"],
        topCities: [
            { slug: "nashville", name: "Nashville", county: "Davidson County", nearCorridor: "i-40-central", demandTier: "medium" },
            { slug: "memphis", name: "Memphis", county: "Shelby County", nearCorridor: "i-40-central", demandTier: "medium" },
            { slug: "knoxville", name: "Knoxville", county: "Knox County", nearCorridor: "i-75-southeast", demandTier: "low" },
        ],
    },
    {
        slug: "arizona",
        name: "Arizona",
        abbr: "AZ",
        maxWidthFt: 8.5,
        maxHeightFt: 14,
        demandTier: "medium",
        corridors: ["i-10-southern", "i-40-central"],
        topCities: [
            { slug: "phoenix", name: "Phoenix", county: "Maricopa County", nearCorridor: "i-10-southern", demandTier: "high" },
            { slug: "tucson", name: "Tucson", county: "Pima County", nearCorridor: "i-10-southern", demandTier: "medium" },
        ],
    },
    {
        slug: "colorado",
        name: "Colorado",
        abbr: "CO",
        maxWidthFt: 8.5,
        maxHeightFt: 14.5,
        demandTier: "medium",
        corridors: ["i-70-west", "i-25-mountain"],
        topCities: [
            { slug: "denver", name: "Denver", county: "Denver County", nearCorridor: "i-70-west", demandTier: "medium" },
            { slug: "pueblo", name: "Pueblo", county: "Pueblo County", nearCorridor: "i-25-mountain", demandTier: "low" },
        ],
    },
    {
        slug: "oklahoma",
        name: "Oklahoma",
        abbr: "OK",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "medium",
        corridors: ["i-40-central", "i-35-central"],
        topCities: [
            { slug: "oklahoma-city", name: "Oklahoma City", county: "Oklahoma County", nearCorridor: "i-35-central", demandTier: "medium" },
            { slug: "tulsa", name: "Tulsa", county: "Tulsa County", nearCorridor: "i-40-central", demandTier: "medium" },
        ],
    },
    {
        slug: "kansas",
        name: "Kansas",
        abbr: "KS",
        maxWidthFt: 8.5,
        maxHeightFt: 14,
        demandTier: "low",
        corridors: ["i-70-midwest", "i-35-central"],
        topCities: [
            { slug: "wichita", name: "Wichita", county: "Sedgwick County", nearCorridor: "i-35-central", demandTier: "low" },
        ],
    },
    {
        slug: "illinois",
        name: "Illinois",
        abbr: "IL",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "medium",
        corridors: ["i-55-midwest", "i-80-northern", "i-70-midwest"],
        topCities: [
            { slug: "chicago", name: "Chicago", county: "Cook County", nearCorridor: "i-80-northern", demandTier: "medium" },
            { slug: "springfield", name: "Springfield", county: "Sangamon County", nearCorridor: "i-55-midwest", demandTier: "low" },
        ],
    },
    {
        slug: "indiana",
        name: "Indiana",
        abbr: "IN",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "medium",
        corridors: ["i-65-central", "i-70-midwest", "i-80-northern"],
        topCities: [
            { slug: "indianapolis", name: "Indianapolis", county: "Marion County", nearCorridor: "i-70-midwest", demandTier: "medium" },
            { slug: "gary", name: "Gary", county: "Lake County", nearCorridor: "i-80-northern", demandTier: "low" },
        ],
    },
    {
        slug: "wyoming",
        name: "Wyoming",
        abbr: "WY",
        maxWidthFt: 8.5,
        maxHeightFt: 14.5,
        demandTier: "low",
        corridors: ["i-80-northern", "i-25-mountain"],
        topCities: [
            { slug: "cheyenne", name: "Cheyenne", county: "Laramie County", nearCorridor: "i-25-mountain", demandTier: "low" },
            { slug: "casper", name: "Casper", county: "Natrona County", demandTier: "low" },
        ],
    },
    {
        slug: "montana",
        name: "Montana",
        abbr: "MT",
        maxWidthFt: 8.5,
        maxHeightFt: 14.5,
        demandTier: "low",
        corridors: ["i-90-northern", "i-15-mountain"],
        topCities: [
            { slug: "billings", name: "Billings", county: "Yellowstone County", nearCorridor: "i-90-northern", demandTier: "low" },
        ],
    },
    {
        slug: "north-dakota",
        name: "North Dakota",
        abbr: "ND",
        maxWidthFt: 8.5,
        maxHeightFt: 14,
        demandTier: "low",
        corridors: ["i-94-northern"],
        topCities: [
            { slug: "fargo", name: "Fargo", county: "Cass County", nearCorridor: "i-94-northern", demandTier: "low" },
        ],
    },
    {
        slug: "south-dakota",
        name: "South Dakota",
        abbr: "SD",
        maxWidthFt: 8.5,
        maxHeightFt: 14.5,
        demandTier: "low",
        corridors: ["i-90-northern", "i-29-midwest"],
        topCities: [
            { slug: "sioux-falls", name: "Sioux Falls", county: "Minnehaha County", nearCorridor: "i-29-midwest", demandTier: "low" },
        ],
    },
    {
        slug: "nebraska",
        name: "Nebraska",
        abbr: "NE",
        maxWidthFt: 8.5,
        maxHeightFt: 14.5,
        demandTier: "low",
        corridors: ["i-80-northern", "i-29-midwest"],
        topCities: [
            { slug: "omaha", name: "Omaha", county: "Douglas County", nearCorridor: "i-80-northern", demandTier: "low" },
        ],
    },
    {
        slug: "iowa",
        name: "Iowa",
        abbr: "IA",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "low",
        corridors: ["i-80-northern", "i-35-central"],
        topCities: [
            { slug: "des-moines", name: "Des Moines", county: "Polk County", nearCorridor: "i-80-northern", demandTier: "low" },
        ],
    },
    {
        slug: "minnesota",
        name: "Minnesota",
        abbr: "MN",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "low",
        corridors: ["i-94-northern", "i-35-central"],
        topCities: [
            { slug: "minneapolis", name: "Minneapolis", county: "Hennepin County", nearCorridor: "i-94-northern", demandTier: "medium" },
        ],
    },
    {
        slug: "wisconsin",
        name: "Wisconsin",
        abbr: "WI",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "low",
        corridors: ["i-94-northern", "i-90-northern"],
        topCities: [
            { slug: "milwaukee", name: "Milwaukee", county: "Milwaukee County", nearCorridor: "i-94-northern", demandTier: "low" },
        ],
    },
    {
        slug: "kentucky",
        name: "Kentucky",
        abbr: "KY",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "low",
        corridors: ["i-75-southeast", "i-65-central", "i-64-southern"],
        topCities: [
            { slug: "louisville", name: "Louisville", county: "Jefferson County", nearCorridor: "i-65-central", demandTier: "medium" },
            { slug: "lexington", name: "Lexington", county: "Fayette County", nearCorridor: "i-75-southeast", demandTier: "low" },
        ],
    },
    {
        slug: "arkansas",
        name: "Arkansas",
        abbr: "AR",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "low",
        corridors: ["i-30-south-central", "i-40-central"],
        topCities: [
            { slug: "little-rock", name: "Little Rock", county: "Pulaski County", nearCorridor: "i-40-central", demandTier: "low" },
        ],
    },
    {
        slug: "maryland",
        name: "Maryland",
        abbr: "MD",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "medium",
        corridors: ["i-95-atlantic", "i-70-midwest"],
        portSlugs: ["port-of-baltimore"],
        topCities: [
            { slug: "baltimore", name: "Baltimore", county: "Baltimore City", nearPort: "port-of-baltimore", nearCorridor: "i-95-atlantic", demandTier: "medium" },
        ],
    },
    {
        slug: "new-jersey",
        name: "New Jersey",
        abbr: "NJ",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "medium",
        corridors: ["i-95-atlantic", "i-78-northeast"],
        portSlugs: ["port-of-new-york-new-jersey"],
        topCities: [
            { slug: "newark", name: "Newark", county: "Essex County", nearPort: "port-of-new-york-new-jersey", nearCorridor: "i-95-atlantic", demandTier: "medium" },
        ],
    },
    {
        slug: "new-york",
        name: "New York",
        abbr: "NY",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "medium",
        corridors: ["i-90-northern", "i-87-northeast", "i-95-atlantic"],
        portSlugs: ["port-of-new-york-new-jersey"],
        topCities: [
            { slug: "buffalo", name: "Buffalo", county: "Erie County", nearCorridor: "i-90-northern", demandTier: "medium" },
            { slug: "albany", name: "Albany", county: "Albany County", nearCorridor: "i-87-northeast", demandTier: "low" },
        ],
    },
    {
        slug: "washington",
        name: "Washington",
        abbr: "WA",
        maxWidthFt: 8.5,
        maxHeightFt: 14,
        demandTier: "medium",
        corridors: ["i-5-west-coast", "i-90-northern"],
        portSlugs: ["port-of-seattle", "port-of-tacoma"],
        topCities: [
            { slug: "seattle", name: "Seattle", county: "King County", nearPort: "port-of-seattle", nearCorridor: "i-5-west-coast", demandTier: "medium" },
            { slug: "tacoma", name: "Tacoma", county: "Pierce County", nearPort: "port-of-tacoma", demandTier: "medium" },
            { slug: "spokane", name: "Spokane", county: "Spokane County", nearCorridor: "i-90-northern", demandTier: "low" },
        ],
    },
    {
        slug: "oregon",
        name: "Oregon",
        abbr: "OR",
        maxWidthFt: 8.5,
        maxHeightFt: 14,
        demandTier: "medium",
        corridors: ["i-5-west-coast", "i-84-northwest"],
        portSlugs: ["port-of-portland"],
        topCities: [
            { slug: "portland", name: "Portland", county: "Multnomah County", nearPort: "port-of-portland", nearCorridor: "i-5-west-coast", demandTier: "medium" },
        ],
    },
    {
        slug: "nevada",
        name: "Nevada",
        abbr: "NV",
        maxWidthFt: 8.5,
        maxHeightFt: 14,
        demandTier: "low",
        corridors: ["i-80-northern", "i-15-mountain"],
        topCities: [
            { slug: "las-vegas", name: "Las Vegas", county: "Clark County", nearCorridor: "i-15-mountain", demandTier: "medium" },
            { slug: "reno", name: "Reno", county: "Washoe County", nearCorridor: "i-80-northern", demandTier: "low" },
        ],
    },
    {
        slug: "idaho",
        name: "Idaho",
        abbr: "ID",
        maxWidthFt: 8.5,
        maxHeightFt: 14,
        demandTier: "low",
        corridors: ["i-84-northwest", "i-15-mountain"],
        topCities: [
            { slug: "boise", name: "Boise", county: "Ada County", nearCorridor: "i-84-northwest", demandTier: "low" },
        ],
    },
    {
        slug: "utah",
        name: "Utah",
        abbr: "UT",
        maxWidthFt: 8.5,
        maxHeightFt: 14,
        demandTier: "low",
        corridors: ["i-15-mountain", "i-70-west"],
        topCities: [
            { slug: "salt-lake-city", name: "Salt Lake City", county: "Salt Lake County", nearCorridor: "i-15-mountain", demandTier: "low" },
        ],
    },
    {
        slug: "new-mexico",
        name: "New Mexico",
        abbr: "NM",
        maxWidthFt: 8.5,
        maxHeightFt: 14,
        demandTier: "low",
        corridors: ["i-10-southern", "i-25-mountain", "i-40-central"],
        topCities: [
            { slug: "albuquerque", name: "Albuquerque", county: "Bernalillo County", nearCorridor: "i-40-central", demandTier: "low" },
        ],
    },
    {
        slug: "west-virginia",
        name: "West Virginia",
        abbr: "WV",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "low",
        corridors: ["i-77-appalachian", "i-64-southern"],
        topCities: [
            { slug: "charleston-wv", name: "Charleston", county: "Kanawha County", nearCorridor: "i-64-southern", demandTier: "low" },
        ],
    },
    {
        slug: "delaware",
        name: "Delaware",
        abbr: "DE",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "low",
        corridors: ["i-95-atlantic"],
        topCities: [
            { slug: "dover", name: "Dover", county: "Kent County", nearCorridor: "i-95-atlantic", demandTier: "low" },
        ],
    },
    {
        slug: "connecticut",
        name: "Connecticut",
        abbr: "CT",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "low",
        corridors: ["i-95-atlantic", "i-84-northeast"],
        topCities: [
            { slug: "hartford", name: "Hartford", county: "Hartford County", nearCorridor: "i-84-northeast", demandTier: "low" },
        ],
    },
    {
        slug: "massachusetts",
        name: "Massachusetts",
        abbr: "MA",
        country: "US",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        demandTier: "low",
        corridors: ["i-95-atlantic", "i-90-northern"],
        portSlugs: ["port-of-boston"],
        dotName: "MassDOT",
        topCities: [
            { slug: "boston", name: "Boston", county: "Suffolk County", nearPort: "port-of-boston", nearCorridor: "i-95-atlantic", demandTier: "medium" },
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// CANADIAN PROVINCES — Transport Canada escort thresholds
// Width/height in FEET (converted from metric for consistency)
// ─────────────────────────────────────────────────────────────────────────────

export const CANADIAN_PROVINCES: StateData[] = [
    {
        slug: "alberta",
        name: "Alberta",
        abbr: "AB",
        country: "CA",
        maxWidthFt: 8.5,   // 2.6m
        maxHeightFt: 14.8, // 4.5m
        policeWidthFt: 19.7, // 6.0m
        demandTier: "high",
        corridors: ["trans-canada-hwy", "hwy-16-alberta", "hwy-2-alberta", "hwy-63-alberta"],
        portSlugs: [],
        dotName: "Alberta Transportation",
        customIntro: "Alberta requires an escort vehicle for loads wider than 8.5 feet (2.6m) or taller than 14.8 feet (4.5m). Police escort is mandatory for loads exceeding 19.7 feet (6.0m) in width. Permits are issued by Alberta Transportation and must be obtained before departure.",
        topCities: [
            { slug: "calgary", name: "Calgary", county: "Calgary Region", nearCorridor: "hwy-2-alberta", demandTier: "high" },
            { slug: "edmonton", name: "Edmonton", county: "Edmonton Region", nearCorridor: "hwy-16-alberta", demandTier: "high" },
            { slug: "fort-mcmurray", name: "Fort McMurray", county: "Wood Buffalo", nearCorridor: "hwy-63-alberta", demandTier: "high" },
            { slug: "red-deer", name: "Red Deer", county: "Red Deer County", nearCorridor: "hwy-2-alberta", demandTier: "medium" },
            { slug: "lethbridge", name: "Lethbridge", county: "Lethbridge County", nearCorridor: "trans-canada-hwy", demandTier: "medium" },
        ],
    },
    {
        slug: "ontario",
        name: "Ontario",
        abbr: "ON",
        country: "CA",
        maxWidthFt: 8.5,   // 2.6m
        maxHeightFt: 14.1, // 4.3m
        policeWidthFt: 16.4, // 5.0m
        demandTier: "high",
        corridors: ["hwy-401-ontario", "hwy-400-ontario", "trans-canada-hwy", "hwy-17-ontario"],
        portSlugs: ["port-of-toronto", "port-of-hamilton"],
        dotName: "Ontario MTO",
        customIntro: "Ontario requires an escort vehicle for loads wider than 8.5 feet (2.6m) or taller than 14.1 feet (4.3m). Permits are issued by Ontario MTO. The OPMS (Online Permit Management System) is used for applications. Police escort is required above 16.4 feet (5.0m) in width.",
        topCities: [
            { slug: "toronto", name: "Toronto", county: "Greater Toronto Area", nearPort: "port-of-toronto", nearCorridor: "hwy-401-ontario", demandTier: "high" },
            { slug: "hamilton", name: "Hamilton", county: "Hamilton-Wentworth", nearPort: "port-of-hamilton", nearCorridor: "hwy-401-ontario", demandTier: "high" },
            { slug: "london-on", name: "London", county: "Middlesex County", nearCorridor: "hwy-401-ontario", demandTier: "medium" },
            { slug: "windsor", name: "Windsor", county: "Essex County", nearCorridor: "hwy-401-ontario", demandTier: "medium" },
            { slug: "thunder-bay", name: "Thunder Bay", county: "Thunder Bay District", nearCorridor: "trans-canada-hwy", demandTier: "medium" },
            { slug: "sudbury", name: "Greater Sudbury", county: "Sudbury District", nearCorridor: "hwy-17-ontario", demandTier: "medium" },
        ],
    },
    {
        slug: "british-columbia",
        name: "British Columbia",
        abbr: "BC",
        country: "CA",
        maxWidthFt: 8.5,   // 2.6m
        maxHeightFt: 14.8, // 4.5m
        policeWidthFt: 19.7, // 6.0m
        demandTier: "high",
        corridors: ["trans-canada-hwy", "hwy-1-bc", "hwy-16-bc", "hwy-97-bc"],
        portSlugs: ["port-of-vancouver", "port-of-prince-rupert"],
        dotName: "BC Ministry of Transportation",
        customIntro: "British Columbia requires an escort vehicle for loads wider than 8.5 feet (2.6m) or taller than 14.8 feet (4.5m). Mountain terrain creates unique route survey requirements. Permits are issued by BC Ministry of Transportation. Police escort required above 19.7 feet (6.0m) wide.",
        topCities: [
            { slug: "vancouver", name: "Vancouver", county: "Metro Vancouver", nearPort: "port-of-vancouver", nearCorridor: "trans-canada-hwy", demandTier: "high" },
            { slug: "prince-george", name: "Prince George", county: "Cariboo", nearCorridor: "hwy-16-bc", demandTier: "medium" },
            { slug: "kelowna", name: "Kelowna", county: "Central Okanagan", nearCorridor: "hwy-97-bc", demandTier: "medium" },
            { slug: "kamloops", name: "Kamloops", county: "Thompson-Nicola", nearCorridor: "trans-canada-hwy", demandTier: "medium" },
            { slug: "prince-rupert", name: "Prince Rupert", county: "Kitimat-Stikine", nearPort: "port-of-prince-rupert", nearCorridor: "hwy-16-bc", demandTier: "medium" },
        ],
    },
    {
        slug: "saskatchewan",
        name: "Saskatchewan",
        abbr: "SK",
        country: "CA",
        maxWidthFt: 8.5,
        maxHeightFt: 14.8,
        demandTier: "medium",
        corridors: ["trans-canada-hwy", "hwy-1-sk", "hwy-16-sk"],
        dotName: "Saskatchewan Highways",
        topCities: [
            { slug: "regina", name: "Regina", county: "Regina Division", nearCorridor: "trans-canada-hwy", demandTier: "medium" },
            { slug: "saskatoon", name: "Saskatoon", county: "Saskatoon Division", nearCorridor: "hwy-16-sk", demandTier: "medium" },
            { slug: "estevan", name: "Estevan", county: "Estevan Division", demandTier: "medium" },
        ],
    },
    {
        slug: "manitoba",
        name: "Manitoba",
        abbr: "MB",
        country: "CA",
        maxWidthFt: 8.5,
        maxHeightFt: 14.8,
        policeWidthFt: 18.0,
        demandTier: "medium",
        corridors: ["trans-canada-hwy", "hwy-1-mb", "hwy-75-mb"],
        dotName: "Manitoba Infrastructure",
        topCities: [
            { slug: "winnipeg", name: "Winnipeg", county: "Winnipeg Capital Region", nearCorridor: "trans-canada-hwy", demandTier: "medium" },
            { slug: "brandon", name: "Brandon", county: "Brandon Division", nearCorridor: "trans-canada-hwy", demandTier: "low" },
        ],
    },
    {
        slug: "quebec",
        name: "Quebec",
        abbr: "QC",
        country: "CA",
        maxWidthFt: 8.5,
        maxHeightFt: 13.5,
        policeWidthFt: 16.4,
        demandTier: "medium",
        corridors: ["hwy-20-quebec", "hwy-40-quebec", "trans-canada-hwy"],
        portSlugs: ["port-of-montreal", "port-of-quebec-city"],
        dotName: "MTQ (Ministère des Transports du Québec)",
        topCities: [
            { slug: "montreal", name: "Montréal", county: "Metropolitan Montréal", nearPort: "port-of-montreal", nearCorridor: "hwy-20-quebec", demandTier: "high" },
            { slug: "quebec-city", name: "Québec City", county: "Capitale-Nationale", nearPort: "port-of-quebec-city", nearCorridor: "hwy-40-quebec", demandTier: "medium" },
            { slug: "sherbrooke", name: "Sherbrooke", county: "Estrie", demandTier: "low" },
        ],
    },
];

// All jurisdictions — US + Canada
export const PILOT_CAR_JURISDICTIONS: StateData[] = [
    ...PILOT_CAR_STATES,
    ...CANADIAN_PROVINCES,
];

// Note: PILOT_CAR_STATES is exported at declaration above (line 46).

// ─────────────────────────────────────────────────────────────────────────────
// KEYWORD CLUSTERS — maps intent → page types
// ─────────────────────────────────────────────────────────────────────────────

export const KEYWORD_CLUSTERS = {
    tier1_head: [
        "pilot car service",
        "pilot car company",
        "oversize load escort",
        "wide load escort",
        "heavy haul escort",
        "escort vehicle service",
        "pilot car near me",
        "oversize escort near me",
        "chase car service",
        "lead car service",
        "height pole escort",
        "pole car service",
        "escort vehicle company",
        "pilot car dispatch",
        "pilot car load board",
        "escort driver marketplace",
    ],
    tier1_geo: (stateName: string) => [
        `pilot car ${stateName}`,
        `oversize escort ${stateName}`,
        `wide load escort ${stateName}`,
        `heavy haul escort ${stateName}`,
        `pilot car service ${stateName}`,
        `escort vehicle company ${stateName}`,
        `oversize load escort ${stateName}`,
    ],
    tier1_city: (cityName: string, stateName: string) => [
        `pilot car ${cityName}`,
        `pilot car near ${cityName}`,
        `escort vehicle ${cityName} ${stateName}`,
        `oversize escort ${cityName}`,
        `wide load escort near ${cityName}`,
        `pilot car service ${cityName} ${stateName}`,
    ],
    tier2_corridor: (corridorLabel: string) => [
        `pilot car ${corridorLabel}`,
        `oversize escort ${corridorLabel} corridor`,
        `wide load escort ${corridorLabel}`,
        `escort vehicle ${corridorLabel}`,
        `heavy haul ${corridorLabel}`,
    ],
    tier2_authority: [
        "escort vehicle requirements by state",
        "pilot car height pole service",
        "escort vehicle regulations",
        "oversize load permit escort",
        "how many pilot cars required",
        "when is escort vehicle required",
        "pilot car certification requirements",
        "how to become pilot car driver",
        "pilot car equipment list",
        "chase car service",
        "escort vehicle rules USA",
        "escort vehicle rules Canada",
        "pilot car certification by state",
    ],
    tier3_lowcomp: [
        "pilot car for mobile home transport",
        "escort vehicle for wind turbine transport",
        "pilot car for bridge beams",
        "oversize escort for precast concrete",
        "pilot car for heavy equipment transport",
        "escort vehicle for crane transport",
        "pilot car for modular homes",
        "wide load escort rural routes",
        "pilot car night escort requirements",
        "height pole escort service",
        "pilot car for agricultural equipment",
        "escort vehicle for yacht transport",
        "pilot car for oil field rig moves",
        "escort for power transformer transport",
    ],
    ai_search: [
        "how many pilot cars do I need",
        "do I need escort vehicle for oversize load",
        "pilot car requirements by state",
        "when is police escort required for oversized load",
        "escort vehicle cost per mile",
        "height pole requirements for oversize loads",
        "pilot car insurance requirements",
        "how much does pilot car service cost",
        "what equipment does a pilot car need",
        "can a pilot car cross state lines",
        "pilot car vs escort vehicle difference",
        "lead car vs chase car oversize load",
    ],
    sleeper: [
        "pilot car availability map",
        "escort vehicle coverage map",
        "pilot car load board",
        "escort driver marketplace",
        "pilot car booking platform",
        "oversize escort directory",
        "pilot car shortage",
        "oversize escort demand",
        "pilot car dispatch software",
        "escort vehicle automation",
        "find pilot car near my route",
        "book escort vehicle online",
    ],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD TYPES — populate long-tail pages
// ─────────────────────────────────────────────────────────────────────────────

export interface LoadTypeData {
    slug: string;
    name: string;
    escortRequiredWidth: number;
    description: string;
    keywords: string[];
    industries: string[];
}

export const LOAD_TYPES: LoadTypeData[] = [
    {
        slug: "wind-turbine",
        name: "Wind Turbine Blades",
        escortRequiredWidth: 12,
        description: "Wind turbine blade transport routinely exceeds 150 feet in length and 14 feet in height, requiring specialized height pole teams, minimum 2 escorts, and often law enforcement coordination.",
        keywords: ["wind turbine blade escort", "turbine blade pilot car", "escort vehicle for wind turbines", "wind energy oversize transport"],
        industries: ["renewable energy", "utilities", "construction"],
    },
    {
        slug: "mobile-home",
        name: "Mobile & Manufactured Homes",
        escortRequiredWidth: 16,
        description: "Manufactured home transport is one of the most common oversize moves in the US, typically running 16–28 feet wide and requiring state-specific dual escort setups.",
        keywords: ["pilot car for mobile home transport", "manufactured home escort", "double-wide mobile home pilot car", "mobile home transport escort"],
        industries: ["housing", "residential construction", "real estate"],
    },
    {
        slug: "heavy-equipment",
        name: "Heavy Construction Equipment",
        escortRequiredWidth: 12,
        description: "Excavators, cranes, scrapers, and dozers frequently exceed legal dimensions once mounted on lowboys. Equipment escorts must be timed around bridge clearances and utility crossings.",
        keywords: ["pilot car for heavy equipment", "excavator transport escort", "crane transport escort", "construction equipment oversize escort"],
        industries: ["construction", "mining", "oil & gas"],
    },
    {
        slug: "precast-concrete",
        name: "Precast Concrete Panels",
        escortRequiredWidth: 12,
        description: "Precast bridge beams and wall panels often require height pole service due to extreme height and length. Route surveys are essential before departure.",
        keywords: ["pilot car for bridge beams", "precast concrete escort", "oversize escort for precast concrete", "bridge beam transport pilot car"],
        industries: ["construction", "infrastructure", "civil engineering"],
    },
    {
        slug: "modular-home",
        name: "Modular Homes",
        escortRequiredWidth: 14,
        description: "Modular home sections range from 14 to 20 feet wide and often require nighttime movement restrictions, dual escorts, and police coordination in urban areas.",
        keywords: ["pilot car for modular homes", "modular home escort", "modular home transport escort", "prefab home pilot car"],
        industries: ["housing", "residential construction"],
    },
    {
        slug: "oil-field",
        name: "Oil Field Equipment",
        escortRequiredWidth: 12,
        description: "Rig moves, pipe coils, and separator units are among the most demanding oversize loads, often requiring 24-hour notice to utilities and police escort in Texas, Louisiana, and Oklahoma.",
        keywords: ["oilfield escort vehicle", "rig move escort", "pilot car for oil field equipment", "oilfield oversize transport"],
        industries: ["oil & gas", "petrochemical", "energy"],
    },
    {
        slug: "transformers",
        name: "Power Transformers",
        escortRequiredWidth: 14,
        description: "Utility transformers can weigh over 900,000 lbs, requiring specialized multi-axle transport, bridge engineering analysis, and police corridor closures.",
        keywords: ["transformer transport escort", "power transformer pilot car", "utility transformer oversize escort", "electrical transformer transport"],
        industries: ["utilities", "energy", "electrical"],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// AI ANSWER SEEDS — powers /answers/[slug] pages (Layer F)
// Each entry becomes a standalone SEO page targeting AI-era natural language queries
// ─────────────────────────────────────────────────────────────────────────────

export interface AiAnswerSeed {
    slug: string;
    question: string;
    shortAnswer: string;
    /** Secondary questions to answer on the same page (boosts AI snippet chance) */
    relatedQuestions: string[];
    /** Keyword tags for internal linking */
    tags: string[];
}

export const AI_ANSWER_SEEDS: AiAnswerSeed[] = [
    {
        slug: "how-many-pilot-cars-required",
        question: "How many pilot cars are required for an oversize load?",
        shortAnswer: "Most US states require 1 pilot car (rear chase) for loads over 8.5ft wide. Loads over 14ft wide typically require both a lead car and a rear chase car (2 escorts total). Police escort is required in most states above 16–20ft wide, depending on the state.",
        relatedQuestions: [
            "When do I need 2 pilot cars?",
            "What width requires a lead and chase car?",
            "Do all states have the same escort requirements?",
            "What is the difference between a lead car and a chase car?",
        ],
        tags: ["escort-count", "requirements", "ai-search"],
    },
    {
        slug: "when-is-escort-vehicle-required",
        question: "When is an escort vehicle required for an oversize load?",
        shortAnswer: "An escort vehicle is required when a load exceeds legal width (typically 8.5ft in most states), height (13.5–14.5ft depending on state), or weight thresholds. Some states also require escort based on length. Requirements vary by state — check your origin AND destination state before departure.",
        relatedQuestions: [
            "What is the legal width limit without escort?",
            "Does height affect escort requirements?",
            "Do I need an escort for a wide manufactured home?",
            "Is escort required for overweight loads?",
        ],
        tags: ["requirements", "width", "height", "legal", "ai-search"],
    },
    {
        slug: "pilot-car-cost-per-mile",
        question: "How much does pilot car service cost per mile?",
        shortAnswer: "Pilot car rates in the US typically range from $1.75 to $3.50 per loaded mile. Night moves, police-required loads, and urban corridor surcharges can push rates to $4.00+/mile. Minimum trip fees ($150–$300) apply for short-distance moves. Canadian rates are generally C$2.50–C$4.50/km.",
        relatedQuestions: [
            "What factors affect pilot car pricing?",
            "Is pilot car service charged by the mile or by the day?",
            "How much does police escort cost for an oversize load?",
            "Do pilot car rates include fuel?",
        ],
        tags: ["pricing", "cost", "per-mile", "ai-search"],
    },
    {
        slug: "pilot-car-equipment-requirements",
        question: "What equipment is required on a pilot car?",
        shortAnswer: "Required pilot car equipment in most US states includes: an illuminated 'OVERSIZE LOAD' banner, amber rotating or strobe lights, a two-way radio (CB Channel 19), safety flags, and a laminated copy of the load permit. Height poles are required when load height exceeds state maximums (typically 14–14.5ft).",
        relatedQuestions: [
            "What is a height pole and when is it required?",
            "Do pilot cars need a CB radio?",
            "What channel do pilot cars use?",
            "What type of vehicle can be a pilot car?",
        ],
        tags: ["equipment", "requirements", "height-pole", "ai-search"],
    },
    {
        slug: "when-is-police-escort-required",
        question: "When is a police escort required for an oversize load?",
        shortAnswer: "Police escort (law enforcement escort) is required in most US states when loads exceed 16–20 feet in width, or when crossing certain bridge types, traveling through tunnels, or moving at night in controlled areas. Requirements vary significantly by state. Texas requires police above 20ft; Georgia above 16ft. Most require 48–72 hours advance notice.",
        relatedQuestions: [
            "How do I arrange a police escort for an oversize load?",
            "How much does police escort cost?",
            "How much advance notice is needed for police escort?",
            "Can I move an oversize load without police at night?",
        ],
        tags: ["police-escort", "law-enforcement", "requirements", "ai-search"],
    },
    {
        slug: "pilot-car-certification-requirements",
        question: "What are the pilot car certification requirements?",
        shortAnswer: "Pilot car certification requirements vary by state. Most states require a valid driver's license, completion of a state-approved safety course, and a clean driving record. Some states (like Texas and California) have formal certification programs. The National Association of Escort & Pilot Cars (NAEC) offers voluntary national certification.",
        relatedQuestions: [
            "How do I get certified as a pilot car driver?",
            "Which states require pilot car certification?",
            "Is NAEC certification recognized in all states?",
            "How long does pilot car certification take?",
        ],
        tags: ["certification", "training", "requirements", "ai-search"],
    },
    {
        slug: "lead-car-vs-chase-car",
        question: "What is the difference between a lead car and a chase car?",
        shortAnswer: "A lead car (or front escort) travels ahead of the oversize load to warn oncoming traffic and signal turns. A chase car (or rear escort) follows behind the load to warn following traffic and manage merges. When only one escort is required, it's typically the rear chase car. Both are required for loads over ~14ft wide in most states.",
        relatedQuestions: [
            "Which position does the escort car take for single-escort moves?",
            "Do lead and chase car drivers need to stay in contact?",
            "Can the same company provide both lead and chase cars?",
            "What radio channel do lead and chase cars use?",
        ],
        tags: ["lead-car", "chase-car", "escort-types", "ai-search"],
    },
    {
        slug: "height-pole-requirements",
        question: "When is a height pole required for an oversize load?",
        shortAnswer: "Height poles are required when a load exceeds the state's maximum legal height — typically 13.5ft to 14.5ft depending on the state. The height pole measures bridge, overpass, and utility line clearances ahead of the load. The pole operator walks or drives ahead to verify clearances before the truck passes.",
        relatedQuestions: [
            "What is the maximum legal height without a height pole?",
            "How tall is a height pole?",
            "Does the height pole operator need special certification?",
            "Are height poles required in Canada?",
        ],
        tags: ["height-pole", "equipment", "clearance", "ai-search"],
    },
    {
        slug: "oversize-load-escort-requirements-by-state",
        question: "What are the oversize load escort requirements by state?",
        shortAnswer: "Oversize load escort requirements vary significantly by state. Most require 1 escort for loads over 8.5ft wide, 2 escorts (lead + chase) for loads over 14ft wide, and police escort above 16–20ft. Height poles are required when loads exceed 13.5–14.5ft. Some states have mandatory nighttime movement bans. See state-specific guides below.",
        relatedQuestions: [
            "Which state has the strictest oversize load rules?",
            "Do escort requirements change at state borders?",
            "What is the widest load I can move without an escort?",
            "Do Canadian provinces have different escort rules?",
        ],
        tags: ["requirements", "by-state", "regulations", "ai-search"],
    },
    {
        slug: "pilot-car-insurance-requirements",
        question: "What insurance does a pilot car need?",
        shortAnswer: "Pilot car operators in the US typically need: commercial auto insurance ($300K–$1M liability), general liability insurance ($1M+), and some states require an occupational accident policy for the driver. Some brokers require pilot cars to carry contingent cargo coverage. Requirements vary by state and by broker/carrier contract.",
        relatedQuestions: [
            "Does my personal auto insurance cover pilot car work?",
            "How much liability insurance does a pilot car need?",
            "Do I need cargo insurance as a pilot car driver?",
            "What insurance does a pilot car company need?",
        ],
        tags: ["insurance", "liability", "requirements", "ai-search"],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// CORRIDOR DATA — powers /corridors/[slug]/pilot-car pages
// ─────────────────────────────────────────────────────────────────────────────

export interface CorridorData {
    slug: string;
    label: string;       // e.g. "I-10 Southern"
    shortLabel: string;  // e.g. "I-10"
    country: "US" | "CA";
    states: string[];    // state/province slugs this corridor passes through
    demandTier: "high" | "medium" | "low";
    description: string;
}

export const MAJOR_CORRIDORS: CorridorData[] = [
    { slug: "i-10-southern", label: "I-10 Southern Corridor", shortLabel: "I-10", country: "US", states: ["california", "arizona", "new-mexico", "texas", "louisiana", "mississippi", "alabama", "florida"], demandTier: "high", description: "The I-10 Southern Corridor is one of the highest-volume oversize freight routes in the United States, stretching 2,460 miles from Santa Monica, CA to Jacksonville, FL. It connects the Port of Los Angeles, Port Houston, Port of New Orleans, Port of Mobile, and Port of Jacksonville." },
    { slug: "i-75-southeast", label: "I-75 Southeast Corridor", shortLabel: "I-75", country: "US", states: ["michigan", "ohio", "kentucky", "tennessee", "georgia", "florida"], demandTier: "high", description: "I-75 is the primary north-south artery for heavy haul freight along the Eastern US, connecting the Great Lakes industrial zone to Florida's Gulf Coast ports and auto manufacturing regions in Kentucky and Tennessee." },
    { slug: "i-95-atlantic", label: "I-95 Atlantic Corridor", shortLabel: "I-95", country: "US", states: ["florida", "georgia", "south-carolina", "north-carolina", "virginia", "maryland", "new-jersey", "new-york", "connecticut", "massachusetts"], demandTier: "high", description: "I-95 runs the length of the East Coast from Miami to the Canadian border, connecting Port of Miami, Port of Savannah, Port of Charleston, Port of Virginia, Port of Baltimore, and Port of New York/NJ." },
    { slug: "i-35-central", label: "I-35 Central Corridor", shortLabel: "I-35", country: "US", states: ["texas", "oklahoma", "kansas", "iowa", "minnesota"], demandTier: "high", description: "I-35 is the primary NAFTA corridor for US-Mexico cross-border freight, stretching from Laredo, TX through Oklahoma City, Wichita, and Minneapolis. Wind energy transport from Texas and Oklahoma makes this one of the heaviest haul corridors in North America." },
    { slug: "i-5-west-coast", label: "I-5 West Coast Corridor", shortLabel: "I-5", country: "US", states: ["california", "oregon", "washington"], demandTier: "high", description: "I-5 connects the three major West Coast port hubs — Los Angeles/Long Beach, Portland, and Seattle/Tacoma — making it the primary Pacific freight spine for oversize cargo entering through West Coast ports." },
    { slug: "i-20-west", label: "I-20 West Corridor", shortLabel: "I-20", country: "US", states: ["texas", "louisiana", "mississippi", "alabama", "georgia", "south-carolina"], demandTier: "medium", description: "I-20 is a key southern cross-country route connecting West Texas oilfield regions through the Deep South to Port of Savannah and Port of Charleston. Heavy equipment from Permian Basin operations frequently moves on this corridor." },
    { slug: "trans-canada-hwy", label: "Trans-Canada Highway", shortLabel: "TCH", country: "CA", states: ["british-columbia", "alberta", "saskatchewan", "manitoba", "ontario", "quebec"], demandTier: "high", description: "The Trans-Canada Highway is the primary oversize freight route across Canada, stretching 7,800 km from Victoria, BC to St. John's, NL. It connects major port cities with industrial zones in Alberta (oil sands), Ontario (manufacturing), and Quebec." },
    { slug: "hwy-401-ontario", label: "Highway 401 Ontario", shortLabel: "Hwy 401", country: "CA", states: ["ontario"], demandTier: "high", description: "Highway 401 is the busiest highway in North America by traffic volume and one of the most important oversize freight corridors in Canada. It connects Windsor (US border crossing) through the Toronto manufacturing belt to Quebec at Montréal." },
    { slug: "hwy-63-alberta", label: "Highway 63 Alberta (Oil Sands Corridor)", shortLabel: "Hwy 63", country: "CA", states: ["alberta"], demandTier: "high", description: "Highway 63 is North America's most intense modular/oversize load corridor, serving the Athabasca Oil Sands near Fort McMurray. Oversize modules, separators, and heavy equipment move daily on this route, requiring specialized escort services familiar with oil sands logistics." },
    { slug: "hwy-2-alberta", label: "Highway 2 Alberta (CANAMEX)", shortLabel: "Hwy 2 AB", country: "CA", states: ["alberta"], demandTier: "high", description: "Highway 2 is Alberta's primary north-south freight corridor connecting Calgary and Edmonton, and is the Canadian portion of the CANAMEX international trade corridor. High volumes of oilfield equipment and wind turbine components move on this route." },
];

export function getCorridorBySlug(slug: string): CorridorData | null {
    return MAJOR_CORRIDORS.find(c => c.slug === slug) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function getStateBySlug(slug: string): StateData | null {
    return PILOT_CAR_JURISDICTIONS.find((s) => s.slug === slug) ?? null;
}

export function getCityBySlug(stateSlug: string, citySlug: string): CityData | null {
    const state = getStateBySlug(stateSlug);
    return state?.topCities.find((c) => c.slug === citySlug) ?? null;
}

export function getAllStateSlugs(): string[] {
    return PILOT_CAR_STATES.map((s) => s.slug); // US only for /pilot-car route
}

export function getAllJurisdictionSlugs(): string[] {
    return PILOT_CAR_JURISDICTIONS.map((s) => s.slug); // US + CA for /escort-requirements
}

export function getAllCitySlugs(): { stateSlug: string; citySlug: string }[] {
    return PILOT_CAR_JURISDICTIONS.flatMap((s) =>
        s.topCities.map((c) => ({ stateSlug: s.slug, citySlug: c.slug }))
    );
}

export function getLoadTypeBySlug(slug: string) {
    return LOAD_TYPES.find((lt) => lt.slug === slug) ?? null;
}

export function getAiAnswerBySlug(slug: string): AiAnswerSeed | null {
    return AI_ANSWER_SEEDS.find(a => a.slug === slug) ?? null;
}

export function getDemandLabel(tier: "high" | "medium" | "low"): string {
    return { high: "High Demand", medium: "Active Market", low: "Growing Market" }[tier];
}

export function getRequirementsIntro(state: StateData): string {
    if (state.customIntro) return state.customIntro;
    const dotRef = state.dotName ? ` All permits must be obtained from ${state.dotName} before departure.` : ` All permits must be obtained from the ${state.name} DOT before departure.`;
    return `${state.name} requires an escort vehicle for loads wider than ${state.maxWidthFt} feet or taller than ${state.maxHeightFt} feet. ` +
        (state.policeWidthFt
            ? `Police escort is mandatory for loads exceeding ${state.policeWidthFt} feet in width. `
            : "") +
        dotRef;
}
