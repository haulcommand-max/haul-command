export interface EquipmentRules {
    Signs: string;
    Lights: string;
    High_Pole: string;
}

export interface CurfewRules {
    "Day/Night": string;
    "Sunday/Holiday": string;
}

export interface StatePilotCarRules {
    Equipment: EquipmentRules;
    Curfews: CurfewRules;
    Insurance: string;
}

export const PILOT_CAR_RULES: Record<string, StatePilotCarRules> = {
    "AL": {
        "Equipment": {
            "Signs": "Oversize Load signs required (Size/Text not explicitly detailed in source)",
            "Lights": "Amber warning lights required",
            "High_Pole": "Required for loads in excess of 16'0\""
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "No Sunday travel restrictions noted in source"
        },
        "Insurance": "Not specified in source"
    },
    "AK": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "AZ": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees, roof mount",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel begins at Sunrise and ends at Sunset",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "AR": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required (18\" square red flags also required)",
            "Lights": "Amber or red rotating/flashing lights visible 360 degrees",
            "High_Pole": "Required for load height of 15'1\""
        },
        "Curfews": {
            "Day/Night": "Daytime travel begins at Sunrise and ends at Sunset",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "$100,000 bodily injury/$300,000 each accident"
    },
    "CA": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset); Special permit required for night travel",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "CO": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights",
            "High_Pole": "Required for load height of 16'0\""
        },
        "Curfews": {
            "Day/Night": "Daytime travel begins at Sunrise and ends at Sunset",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "$1,000,000 combined single limit"
    },
    "CT": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour after sunrise to \u00bd hour before sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "DE": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees, 1,000 ft sight distance",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel begins at Sunrise and ends at Sunset",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "FL": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD (12\" high black letters on yellow background, 7' x 18\" sign)",
            "Lights": "Amber rotating/strobe/flashing lights (Class 2) visible 360 degrees at 500 ft",
            "High_Pole": "Required for over-height loads (pole set 6\" above load height)"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset); Night travel allowed for specific dimensions (e.g., <10' wide South of Florida City)",
            "Sunday/Holiday": "Holiday travel restricted"
        },
        "Insurance": "Not specified in source"
    },
    "GA": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees (Amber Light Permit required)",
            "High_Pole": "Required for over height loads"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour after sunrise to \u00bd hour before sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "ID": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "IL": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD (Yellow background, Black letters)",
            "Lights": "Amber rotating or flashing lights visible 360 degrees, 500 ft sight distance",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "$500,000 combined bodily injury and property damage"
    },
    "IN": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees, 500 ft sight distance",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel begins at Sunrise and ends at Sunset",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "IA": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees, 500 ft sight distance",
            "High_Pole": "Required for all loads exceeding 14'4\""
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "KS": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Minimum insurance required by state"
    },
    "KY": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Travel allowed 24/7 unless noted on permit",
            "Sunday/Holiday": "Travel not permitted on Sunday"
        },
        "Insurance": "Not specified in source"
    },
    "LA": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD (Yellow background)",
            "Lights": "Amber lights",
            "High_Pole": "Required for loads exceeding 15'0\""
        },
        "Curfews": {
            "Day/Night": "Daytime travel begins at Sunrise and ends at Sunset",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "$50,000/$100,000"
    },
    "ME": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "MD": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour after sunrise to \u00bd hour before sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "MA": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "MI": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Required for all loads exceeding 14'6\""
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "MN": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees, 500 ft sight distance",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel begins at Sunrise and ends at Sunset",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Minnesota insurance required"
    },
    "MS": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour after sunrise to \u00bd hour before sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "MO": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "MT": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights (flashing/rotating) visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel begins at Sunrise and ends at Sunset",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "NE": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "NV": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel begins at Sunrise and ends at Sunset",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "NH": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "NJ": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel begins at Sunrise and ends at Sunset",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "NM": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel begins at Sunrise and ends at Sunset",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "NY": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "NC": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel begins at Sunrise and ends at Sunset",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "ND": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel begins at Sunrise and ends at Sunset",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "OH": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Required for all loads over 14'6\""
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "OK": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "$1,000,000 combined single limit"
    },
    "OR": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "PA": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights (1 minimum, 2 maximum)",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel begins at Sunrise and ends at Sunset",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "$1,000,000 combined single limit and/or commercial auto coverage; $1,000,000 general/professional liability"
    },
    "RI": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "SC": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel begins at Sunrise and ends at Sunset",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "SD": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "TN": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel begins at Sunrise and ends at Sunset",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "TX": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights (8\" min) visible 360 degrees; Blue/Amber alternating allowed",
            "High_Pole": "Required at load height of 17'0\""
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "UT": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required (5' wide x 10\" high min)",
            "Lights": "Amber lights (flashing/rotating) visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset); Night travel allowed for specific dimensions",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "$750,000 automobile liability"
    },
    "VT": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "VA": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD or WIDE LOAD or OVERWEIGHT LOAD signs required",
            "Lights": "Amber flashing lights visible 360 degrees",
            "High_Pole": "Required at load height of 15'0\""
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour after sunrise to \u00bd hour before sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "WA": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber flashing/rotating lights (or strobe) visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "$100,000/$300,000/$50,000 public liability"
    },
    "WV": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel begins at Sunrise and ends at Sunset",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "WI": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel begins at Sunrise and ends at Sunset",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "Not specified in source"
    },
    "WY": {
        "Equipment": {
            "Signs": "OVERSIZE LOAD signs required",
            "Lights": "Amber lights visible 360 degrees",
            "High_Pole": "Not specified in source"
        },
        "Curfews": {
            "Day/Night": "Daytime travel allowed (\u00bd hour before sunrise to \u00bd hour after sunset)",
            "Sunday/Holiday": "Not specified in source"
        },
        "Insurance": "$500,000 combined single limit"
    }
};

export const getPilotCarRules = (stateCode: string): StatePilotCarRules | null => {
    return PILOT_CAR_RULES[stateCode] || null;
};
