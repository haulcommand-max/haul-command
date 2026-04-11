export interface NavLink {
  label: string;
  href: string;
  icon?: string;
}

export interface DesktopNavGroup {
  label: string;
  destinations: NavLink[];
}

export interface FooterColumn {
  heading: string;
  links: NavLink[];
}

export interface ShellIAConfig {
  desktopNavGroups: {
    [key: string]: DesktopNavGroup;
  };
  mobileMenuSections: {
    order: string[];
    quickActions: NavLink[];
  };
  footer: {
    desktopColumns: FooterColumn[];
  };
}
