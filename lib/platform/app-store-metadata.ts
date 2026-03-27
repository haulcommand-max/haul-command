/**
 * HAUL COMMAND — App Store Distribution Metadata
 *
 * Generates formatted metadata for Apple App Store and Google Play.
 * Supports 12 languages as defined in the platform config.
 */

export const APP_STORE_METADATA = {
  appName: 'Haul Command',
  subtitle: 'Heavy Haul Escort Marketplace',
  bundleId: 'com.haulcommand.app',
  supportUrl: 'https://haulcommand.com/support',
  privacyUrl: 'https://haulcommand.com/privacy',
  marketingUrl: 'https://haulcommand.com',
  category: 'Business',
  secondaryCategory: 'Navigation',
  keywords: 'pilot car,escort vehicle,oversize load,heavy haul,ELD,HOS,trucking,freight,dispatch,compliance',
  price: 'Free',

  localizations: {
    en: {
      name: 'Haul Command',
      subtitle: 'Heavy Haul Escort Marketplace',
      description: 'Find verified pilot car operators and escort vehicles for oversize and heavy haul transport across 120 countries.',
      keywords: 'pilot car,escort vehicle,oversize load,heavy haul,ELD,HOS,trucking,freight,dispatch,compliance',
    },
    es: {
      name: 'Haul Command',
      subtitle: 'Mercado de Escoltas de Carga',
      description: 'Encuentre operadores de veh\u00edculos piloto verificados para transporte de carga pesada y sobredimensionada en 57 pa\u00edses.',
      keywords: 'coche piloto,escolta,carga pesada,transporte,flete,despacho',
    },
    fr: {
      name: 'Haul Command',
      subtitle: "March\u00e9 d'Escortes de Convois",
      description: "Trouvez des op\u00e9rateurs de v\u00e9hicules pilotes v\u00e9rifi\u00e9s pour le transport de charges exceptionnelles dans 57 pays.",
      keywords: 'voiture pilote,escorte,convoi exceptionnel,transport,fret',
    },
    de: {
      name: 'Haul Command',
      subtitle: 'Schwertransport-Begleitmarkt',
      description: 'Finden Sie verifizierte Begleitfahrzeug-Betreiber f\u00fcr Schwertransporte in 57 L\u00e4ndern.',
      keywords: 'BF3,Begleitfahrzeug,Schwertransport,Spedition,Logistik',
    },
    pt: {
      name: 'Haul Command',
      subtitle: 'Mercado de Escoltas de Carga',
      description: 'Encontre operadores verificados de ve\u00edculos batedores para cargas pesadas e superdimensionadas em 57 pa\u00edses.',
      keywords: 'batedor,escolta,carga pesada,transporte,frete',
    },
    ja: {
      name: 'Haul Command',
      subtitle: '\u91cd\u91cf\u8ca8\u7269\u8b77\u885b\u30de\u30fc\u30b1\u30c3\u30c8',
      description: '57\u30ab\u56fd\u3067\u8a8d\u5b9a\u8b77\u885b\u8eca\u30aa\u30da\u30ec\u30fc\u30bf\u30fc\u3092\u898b\u3064\u3051\u307e\u3057\u3087\u3046\u3002',
      keywords: '\u8b77\u885b\u8eca,\u91cd\u91cf\u8ca8\u7269,\u904b\u9001,\u7269\u6d41',
    },
    ko: {
      name: 'Haul Command',
      subtitle: '\uc911\ub7c9\ud654\ubb3c \ud638\uc1a1 \ub9c8\ucf13\ud50c\ub808\uc774\uc2a4',
      description: '57\uac1c\uad6d\uc5d0\uc11c \uc778\uc99d\ub41c \ud638\uc1a1\ucc28\ub7c9 \uc6b4\uc601\uc790\ub97c \ucc3e\uc544\ubcf4\uc138\uc694.',
      keywords: '\ud638\uc1a1\ucc28,\uc911\ub7c9\ud654\ubb3c,\uc6b4\uc1a1,\ubb3c\ub958',
    },
    ar: {
      name: 'Haul Command',
      subtitle: '\u0633\u0648\u0642 \u0645\u0631\u0627\u0641\u0642\u0629 \u0627\u0644\u0634\u062d\u0646\u0627\u062a \u0627\u0644\u062b\u0642\u064a\u0644\u0629',
      description: '\u0627\u0639\u062b\u0631 \u0639\u0644\u0649 \u0645\u0634\u063a\u0644\u064a \u0633\u064a\u0627\u0631\u0627\u062a \u0627\u0644\u0645\u0631\u0627\u0641\u0642\u0629 \u0627\u0644\u0645\u0639\u062a\u0645\u062f\u064a\u0646 \u0644\u0644\u0634\u062d\u0646\u0627\u062a \u0627\u0644\u062b\u0642\u064a\u0644\u0629 \u0641\u064a 57 \u062f\u0648\u0644\u0629.',
      keywords: '\u0633\u064a\u0627\u0631\u0629 \u0645\u0631\u0627\u0641\u0642\u0629,\u0634\u062d\u0646 \u062b\u0642\u064a\u0644,\u0646\u0642\u0644',
    },
    zh: {
      name: 'Haul Command',
      subtitle: '\u91cd\u578b\u8d27\u7269\u62a4\u536b\u5e02\u573a',
      description: '\u572857\u4e2a\u56fd\u5bb6\u5bfb\u627e\u7ecf\u8fc7\u8ba4\u8bc1\u7684\u62a4\u536b\u8f66\u8f86\u8fd0\u8425\u5546\u3002',
      keywords: '\u62a4\u536b\u8f66,\u91cd\u578b\u8d27\u7269,\u8fd0\u8f93,\u7269\u6d41',
    },
    hi: {
      name: 'Haul Command',
      subtitle: '\u092d\u093e\u0930\u0940 \u092e\u093e\u0932 \u090f\u0938\u094d\u0915\u0949\u0930\u094d\u091f \u092e\u093e\u0930\u094d\u0915\u0947\u091f',
      description: '57 \u0926\u0947\u0936\u094b\u0902 \u092e\u0947\u0902 \u0938\u0924\u094d\u092f\u093e\u092a\u093f\u0924 \u092a\u093e\u092f\u0932\u091f \u0915\u093e\u0930 \u0911\u092a\u0930\u0947\u091f\u0930\u094b\u0902 \u0915\u094b \u0916\u094b\u091c\u0947\u0902\u0964',
      keywords: '\u092a\u093e\u092f\u0932\u091f \u0915\u093e\u0930,\u092d\u093e\u0930\u0940 \u092e\u093e\u0932,\u092a\u0930\u093f\u0935\u0939\u0928',
    },
    ru: {
      name: 'Haul Command',
      subtitle: '\u0420\u044b\u043d\u043e\u043a \u0441\u043e\u043f\u0440\u043e\u0432\u043e\u0436\u0434\u0435\u043d\u0438\u044f \u0433\u0440\u0443\u0437\u043e\u0432',
      description: '\u041d\u0430\u0439\u0434\u0438\u0442\u0435 \u043f\u0440\u043e\u0432\u0435\u0440\u0435\u043d\u043d\u044b\u0445 \u043e\u043f\u0435\u0440\u0430\u0442\u043e\u0440\u043e\u0432 \u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u0435\u0439 \u0441\u043e\u043f\u0440\u043e\u0432\u043e\u0436\u0434\u0435\u043d\u0438\u044f \u0432 57 \u0441\u0442\u0440\u0430\u043d\u0430\u0445.',
      keywords: '\u0441\u043e\u043f\u0440\u043e\u0432\u043e\u0436\u0434\u0435\u043d\u0438\u0435,\u0442\u044f\u0436\u0435\u043b\u044b\u0439 \u0433\u0440\u0443\u0437,\u043f\u0435\u0440\u0435\u0432\u043e\u0437\u043a\u0430',
    },
    tr: {
      name: 'Haul Command',
      subtitle: 'A\u011f\u0131r Y\u00fck Eskort Pazar\u0131',
      description: '57 \u00fclkede do\u011frulanm\u0131\u015f pilot ara\u00e7 operat\u00f6rlerini bulun.',
      keywords: 'pilot ara\u00e7,a\u011f\u0131r y\u00fck,ta\u015f\u0131mac\u0131l\u0131k',
    },
  },

  storeLinks: {
    ios: 'https://apps.apple.com/app/haul-command/id[TBD]',
    android: 'https://play.google.com/store/apps/details?id=com.haulcommand.app',
  },
} as const;
