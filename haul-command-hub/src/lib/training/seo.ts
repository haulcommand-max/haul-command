/**
 * Haul Command — Training SEO
 * Metadata generators and structured data for all training pages.
 */
import type { TrainingCatalogItem, TrainingModule, TrainingLevel } from './types';
import { BADGE_META } from './types';

const SITE = 'https://haulcommand.com';

// ─── Training hub metadata ───────────────────────────────────
export function trainingHubMeta() {
  return {
    title: 'Training & Certification | Haul Command',
    description:
      'Get certified on Haul Command. Earn badges, improve your directory rank, unlock broker trust, and grow your heavy haul business. Road Ready, Certified, Elite, and AV-Ready pathways.',
    alternates: { canonical: `${SITE}/training` },
    openGraph: {
      title: 'Training & Certification | Haul Command',
      description: 'Earn badges, improve rank, and increase broker confidence with Haul Command Training.',
      url: `${SITE}/training`,
    },
  };
}

// ─── Module page metadata ────────────────────────────────────
export function trainingModuleMeta(module: TrainingModule) {
  return {
    title: `${module.title} | Training | Haul Command`,
    description:
      module.summary ??
      `Learn ${module.title} with Haul Command training. ${module.hours} hours. Part of the heavy haul escort certification pathway.`,
    alternates: { canonical: `${SITE}/training/modules/${module.slug}` },
    openGraph: {
      title: `${module.title} | Haul Command Training`,
      description: module.summary ?? `${module.title} — ${module.hours}h training module.`,
    },
  };
}

// ─── Level page metadata ─────────────────────────────────────
export function trainingLevelMeta(level: TrainingLevel) {
  const meta = BADGE_META[level.badge_slug];
  return {
    title: `${level.level_name} Certification | Haul Command`,
    description:
      level.description ??
      `Earn the ${level.level_name} badge on Haul Command. ${meta?.description ?? ''} Improve your directory rank and unlock broker trust.`,
    alternates: { canonical: `${SITE}/training/levels/${level.level_slug}` },
    openGraph: {
      title: `${level.level_name} Certification | Haul Command`,
      description: level.description ?? `${level.level_name} — Haul Command certification.`,
    },
  };
}

// ─── Country training page metadata ─────────────────────────
export function trainingCountryMeta(countryCode: string, countryName: string) {
  return {
    title: `Heavy Haul Training in ${countryName} | Haul Command`,
    description: `Haul Command training requirements and fit for ${countryName}. Get certified, earn badges, and improve broker confidence for operations in ${countryName}.`,
    alternates: { canonical: `${SITE}/training/countries/${countryCode.toLowerCase()}` },
  };
}

// ─── State training page metadata ────────────────────────────
export function trainingStateMeta(stateCode: string, stateName: string) {
  return {
    title: `Pilot Car Training in ${stateName} | Haul Command`,
    description: `State-specific training and certification for heavy haul escort operators in ${stateName}. Understand local requirements and get certified on Haul Command.`,
    alternates: { canonical: `${SITE}/training/states/${stateCode.toLowerCase()}` },
  };
}

// ─── Role training page metadata ─────────────────────────────
export function trainingRoleMeta(roleSlug: string, roleLabel: string) {
  return {
    title: `Training for ${roleLabel} | Haul Command`,
    description: `Haul Command training pathways for ${roleLabel}. Earn the right credentials, improve your profile rank, and win more business.`,
    alternates: { canonical: `${SITE}/training/roles/${roleSlug}` },
  };
}

// ─── Reciprocity page metadata ────────────────────────────────
export function trainingReciprocityMeta(geoSlug: string) {
  return {
    title: `Training Reciprocity & Cross-Jurisdiction Fit | ${geoSlug.toUpperCase()} | Haul Command`,
    description: `How Haul Command training applies across jurisdictions for ${geoSlug.toUpperCase()}. Understand transferability, known fit, and partial recognition.`,
    alternates: { canonical: `${SITE}/training/reciprocity/${geoSlug.toLowerCase()}` },
  };
}

// ─── Enterprise page metadata ────────────────────────────────
export function trainingEnterpriseMeta() {
  return {
    title: 'Enterprise & Team Training | Haul Command',
    description:
      'Multi-seat training plans for brokers, carriers, and dispatch operations. Company dashboards, roster tracking, completion exports, and badge verification API.',
    alternates: { canonical: `${SITE}/training/enterprise` },
  };
}

// ─── JSON-LD: Training Course structured data ────────────────
export function trainingCourseJsonLd(
  catalog: TrainingCatalogItem,
  level: TrainingLevel,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `${level.level_name} — Haul Command Training`,
    description: level.description ?? `Haul Command ${level.level_name} certification pathway.`,
    provider: {
      '@type': 'Organization',
      name: 'Haul Command',
      url: SITE,
    },
    url: `${SITE}/training/levels/${level.level_slug}`,
    timeRequired: `PT${catalog.hours_total}H`,
    educationalCredentialAwarded: `Haul Command ${level.level_name} Badge (on-platform credential)`,
    offers: catalog.pricing_json?.one_time
      ? {
          '@type': 'Offer',
          price: catalog.pricing_json.one_time,
          priceCurrency: (catalog.pricing_json.currency ?? 'USD').toUpperCase(),
        }
      : undefined,
  };
}

// ─── FAQ schema for training hub ─────────────────────────────
export function trainingHubFaqJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What does a Haul Command training badge mean?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Haul Command badges are on-platform credentials awarded for completing training modules on Haul Command. They indicate skill development and training completion within the platform and improve your directory rank, broker trust score, and filter eligibility. They do not constitute legal licensing unless otherwise stated.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does training improve my directory rank?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Completing training earns you a badge that contributes to your overall profile rank on Haul Command. Higher-tier badges (Certified, Elite) contribute more rank weight, making you more visible in directory search, broker tools, and local results.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can brokers see my training status?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Certified and Elite badges are visible to brokers in search results and on your profile. Brokers can also filter for certified providers when searching for escort operators.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do badges expire?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Elite and higher-tier badges require annual refresh to maintain full rank effects. Expired badges lose their rank contribution. You will receive renewal reminders.',
        },
      },
    ],
  };
}
