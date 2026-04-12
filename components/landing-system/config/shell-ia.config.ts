export const SHELL_IA_CONFIG = {
  desktopNavGroups: {
    discover: {
      label: "Discover",
      destinations: [
        { label: "Oversize Load Board", href: "/loads" },
        { label: "Pilot Car Directory", href: "/directory" },
        { label: "Available Now", href: "/available-now" },
        { label: "Service Categories", href: "/services" }
      ]
    },
    intelligence: {
      label: "Intelligence",
      destinations: [
        { label: "All Tools", href: "/tools" },
        { label: "Regulations", href: "/regulations" },
        { label: "HC Glossary", href: "/glossary" },
        { label: "Resource Hub", href: "/resources" },
        { label: "Blog", href: "/blog" }
      ]
    },
    markets: {
      label: "Markets",
      destinations: [
        { label: "Top Markets", href: "/directory/us" },
        { label: "Featured Corridors", href: "/corridors" },
        { label: "Port Hubs", href: "/ports" },
        { label: "Pilot Car Rates", href: "/rates" }
      ]
    },
    trustAndGrowth: {
      label: "Trust & Growth",
      destinations: [
        { label: "Claim Listing", href: "/claim" },
        { label: "Report Cards", href: "/trust" },
        { label: "Advertise", href: "/advertise" },
        { label: "Data Marketplace", href: "/data" }
      ]
    },
    appBridge: {
      label: "App",
      destinations: [
        { label: "Sign In", href: "/sign-in" },
        { label: "Get the App", href: "/download" }
      ]
    }
  },

  mobileMenuSections: {
    order: ["quickActions", "discover", "intelligence", "markets", "trustAndGrowth", "appBridge"],
    quickActions: [
      { label: "Find Operators", href: "/directory" },
      { label: "Post Load", href: "/loads/post" },
      { label: "Browse Tools", href: "/tools" },
      { label: "See Regulations", href: "/regulations" },
      { label: "Claim Listing", href: "/claim" }
    ]
  },

  footer: {
    desktopColumns: [
      {
        heading: "Company",
        links: [
          { label: "About Us", href: "/about" },
          { label: "Contact", href: "/contact" },
          { label: "Careers", href: "/careers" },
          { label: "Privacy Policy", href: "/privacy" },
          { label: "Terms of Service", href: "/terms" }
        ]
      },
      {
        heading: "Product",
        links: [
          { label: "Directory", href: "/directory" },
          { label: "Load Board", href: "/loads" },
          { label: "Tools", href: "/tools" },
          { label: "Sign In", href: "/sign-in" },
          { label: "Claim Listing", href: "/claim" }
        ]
      },
      {
        heading: "Major Corridors",
        links: [
          { label: "I-10 Freight Corridor", href: "/corridors/i-10" },
          { label: "I-80 Transport Route", href: "/corridors/i-80" },
          { label: "I-40 Logistics Hub", href: "/corridors/i-40" },
          { label: "I-95 Eastern Network", href: "/corridors/i-95" }
        ]
      },
      {
        heading: "Port & Metro Hubs",
        links: [
          { label: "Houston Port Access", href: "/directory/tx/houston" },
          { label: "Miami Freight Terminals", href: "/directory/fl/miami" },
          { label: "LA/Long Beach Ports", href: "/directory/ca/los-angeles" },
          { label: "Dallas Logistics Hub", href: "/directory/tx/dallas" }
        ]
      },
      {
        heading: "Services",
        links: [
          { label: "All Services", href: "/services" },
          { label: "High Pole Cars", href: "/services/high-pole" },
          { label: "Route Surveys", href: "/services/route-survey" }
        ]
      },
      {
        heading: "Knowledge Base",
        links: [
          { label: "Regulations", href: "/regulations" },
          { label: "Glossary", href: "/glossary" },
          { label: "Resources", href: "/resources" },
          { label: "Blog", href: "/blog" }
        ]
      }
    ]
  }
};
