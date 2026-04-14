/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.haulcommand.com',
  generateRobotsTxt: false, // robots.ts already handles this
  sitemapSize: 7000,        // Split below Google's 50K cap
  changefreq: 'weekly',
  priority: 0.7,
  output: 'export',
  exclude: [
    '/api/*',
    '/auth/*',
    '/admin/*',
    '/dashboard/*',
    '/dev/*',
    '/route-check',
    '/app/*',
  ],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://www.haulcommand.com/sitemap.xml', // Dynamic Supabase pages
    ],
    policies: [
      { userAgent: '*', allow: '/' },
      {
        userAgent: '*',
        disallow: ['/api/', '/auth/', '/admin/', '/dashboard/', '/app/', '/dev/'],
      },
    ],
  },
  transform: async (config, path) => {
    // Priority overrides for money/SEO pages
    const priorityMap: Record<string, number> = {
      '/training':   0.95,
      '/directory':  0.95,
      '/loads':      0.90,
      '/permits':    0.90,
      '/leaderboards': 0.85,
      '/corridors':  0.85,
      '/tools':      0.80,
      '/blog':       0.75,
    };

    const changefreqMap: Record<string, string> = {
      '/loads':   'hourly',
      '/leaderboards': 'hourly',
      '/training': 'daily',
      '/directory': 'daily',
    };

    const matchedPriority = Object.entries(priorityMap).find(([key]) => path.startsWith(key));
    const matchedFreq     = Object.entries(changefreqMap).find(([key]) => path.startsWith(key));

    return {
      loc: path,
      changefreq: matchedFreq ? matchedFreq[1] : config.changefreq,
      priority:   matchedPriority ? matchedPriority[1] : config.priority,
      lastmod:    new Date().toISOString(),
    };
  },
};
