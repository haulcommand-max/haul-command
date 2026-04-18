import { HcSpacing, HcRadius, HcSurface, HcBorder } from './content-system.types';

export const ContentSystemTokens = {
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '40px',
        '5xl': '48px',
        '6xl': '64px',
        '7xl': '80px',
        semantics: {
            inset_compact: '12px',
            inset_standard: '16px',
            inset_roomy: '24px',
            inset_premium: '32px',
            gap_tight: '8px',
            gap_standard: '16px',
            gap_roomy: '24px',
            gap_premium: '32px',
            section_y_mobile: '48px',
            section_y_tablet: '64px',
            section_y_desktop: '80px',
        }
    },
    radius: {
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '28px',
        pill: '9999px',
        semantics: {
            button: '16px',
            input: '16px',
            chip: '9999px',
            card: '24px',
            panel: '28px',
            modal: '28px',
            image: '24px',
            rail_module: '24px',
        }
    },
    border: {
        semantics: {
            subtle: 'rgba(255, 255, 255, 0.08)',
            standard: 'rgba(255, 255, 255, 0.10)',
            emphasis: 'rgba(255, 255, 255, 0.14)',
            strong: 'rgba(255, 255, 255, 0.18)',
        }
    },
    surface: {
        semantics: {
            surface_0: '#0B0B0C', // base canvas
            surface_1: '#111214', // primary panel
            surface_2: '#16181B', // raised panel
            surface_3: '#1E2028', // featured
            surface_glass: 'rgba(17, 18, 20, 0.80)', // glass backdrop
        }
    }
};

// Layout mappings for canonical containers
export const ContentLayout = {
    maxWidths: {
        page_standard: 'max-w-[1280px]',
        page_wide: 'max-w-[1400px]',
        content_reading: 'max-w-[780px]',
        content_reading_wide: 'max-w-[820px]',
        hero_copy: 'max-w-[720px]',
    },
    containers: {
        page_x_pad: 'px-4 sm:px-6 lg:px-8',
        section_y_pad: 'py-12 lg:py-20',
        section_compact_pad: 'py-8 lg:py-12',
    }
}
