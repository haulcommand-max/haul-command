-- ================================================================
-- SEED: 50 content topics for the automated content machine
-- ================================================================

INSERT INTO content_topics (topic, keyword, content_type, target_audience, country_code, priority) VALUES

-- AV TOPICS (Priority 1)
('Do autonomous trucks need pilot cars? Texas law explained', 'do autonomous trucks need pilot cars', 'blog_article', 'av_company', NULL, 1),
('Aurora Innovation truck escort requirements — what operators need to know', 'Aurora truck escort requirements', 'blog_article', 'av_company', NULL, 1),
('How to become an AV-Ready certified escort operator', 'AV ready escort certification', 'blog_article', 'escort_operator', NULL, 1),
('Autonomous trucking corridors in Texas — escort operator guide', 'autonomous trucking Texas escort', 'blog_article', 'escort_operator', 'us', 1),
('Kodiak Robotics Permian Basin — escort requirements for oilfield AV routes', 'Kodiak Robotics escort requirements', 'blog_article', 'av_company', NULL, 2),
('Waabi autonomous trucks — what brokers and escorts need to know in 2026', 'Waabi trucks escort 2026', 'blog_article', 'broker', NULL, 2),
('What happens when an autonomous truck breaks down with no driver', 'autonomous truck breakdown escort protocol', 'blog_article', 'av_company', NULL, 2),
('Gatik autonomous trucks — short-haul escort requirements explained', 'Gatik autonomous truck escort', 'blog_article', 'av_company', NULL, 2),
('AV corridor escort compliance — what every logistics manager needs on file', 'AV corridor escort compliance', 'blog_article', 'av_company', NULL, 3),
('How escort operators adapt to autonomous freight: the 2026 playbook', 'escort operator autonomous freight', 'blog_article', 'escort_operator', NULL, 3),

-- OILFIELD TOPICS (Priority 1)
('Oilfield escort services in the Permian Basin — complete guide', 'oilfield escort Permian Basin', 'blog_article', 'broker', 'us', 1),
('How to move a drilling rig in Texas — escort and permit guide', 'move drilling rig Texas escort', 'blog_article', 'broker', 'us', 1),
('Fracking equipment transport — escort requirements Texas Oklahoma', 'fracking equipment transport escort', 'blog_article', 'broker', 'us', 1),
('Pilot cars for oilfield loads — what West Texas operators need to know', 'pilot car oilfield West Texas', 'blog_article', 'escort_operator', 'us', 1),
('Permian Basin escort operators — how to get more oilfield work', 'Permian Basin escort operator work', 'blog_article', 'escort_operator', 'us', 2),
('Oilfield equipment transport in the Eagle Ford Shale — escort guide', 'Eagle Ford escort oilfield', 'blog_article', 'broker', 'us', 2),
('How many pilot cars does a rig move need in Texas', 'pilot cars rig move Texas', 'blog_article', 'broker', 'us', 2),
('Bakken Formation escort operations — North Dakota oversize guide', 'Bakken formation escort North Dakota', 'blog_article', 'escort_operator', 'us', 3),

-- REGULATION TOPICS
('Pilot car requirements in Texas — complete 2026 guide', 'pilot car requirements Texas 2026', 'blog_article', 'general_public', 'us', 1),
('How much does a pilot car cost in Texas', 'pilot car cost Texas', 'blog_article', 'broker', 'us', 1),
('Pilot car escort requirements Australia — state by state guide', 'pilot car requirements Australia', 'blog_article', 'general_public', 'au', 1),
('Abnormal load escort requirements UK — STGO explained', 'abnormal load escort UK STGO', 'blog_article', 'general_public', 'gb', 1),
('Oversize load escort requirements Canada — province by province', 'oversize load escort Canada', 'blog_article', 'general_public', 'ca', 1),
('How to get an oversize load permit in Texas in 2026', 'oversize load permit Texas', 'blog_article', 'broker', 'us', 1),
('California oversize load permit guide — Caltrans requirements', 'California oversize load permit', 'blog_article', 'broker', 'us', 2),
('Florida oversize load rules — FDOT escort requirements', 'Florida oversize load escort requirements', 'blog_article', 'broker', 'us', 2),
('How much does a pilot car cost — 2026 national rate guide', 'how much does a pilot car cost', 'blog_article', 'general_public', NULL, 1),
('UAE oversized transport escort requirements — complete guide', 'UAE oversized transport escort', 'blog_article', 'general_public', 'ae', 2),
('Germany Schwertransport escort rules — BASt regulations explained', 'Germany Schwertransport escort rules', 'blog_article', 'general_public', 'de', 2),
('Brazil ANTT oversize transport escort requirements', 'Brazil oversize transport escort ANTT', 'blog_article', 'general_public', 'br', 2),

-- LINKEDIN POSTS
('AV companies are deploying. Escort operators need to adapt.', NULL, 'linkedin_post', 'av_company', NULL, 1),
('The Permian Basin drills 500+ new wells a month. Who is escorting the equipment?', NULL, 'linkedin_post', 'oilfield_company', NULL, 1),
('A drilling rig move in Texas involves 47 individual escort jobs. Here is why.', NULL, 'linkedin_post', 'broker', NULL, 1),
('47 minutes. That is how fast Haul Command fills an escort slot.', NULL, 'linkedin_post', 'av_company', NULL, 1),
('The escort operator shortage is real. Here is what the data shows.', NULL, 'linkedin_post', 'general_public', NULL, 2),
('Why autonomous trucks still need human escorts in 2026', NULL, 'linkedin_post', 'av_company', NULL, 1),
('What 7,745 escort operators taught us about corridor demand', NULL, 'linkedin_post', 'general_public', NULL, 2),
('Escrow-only payments: why we built it that way', NULL, 'linkedin_post', 'broker', NULL, 2),

-- YOUTUBE SCRIPTS
('Do autonomous trucks need pilot cars? The answer might surprise you.', 'do autonomous trucks need pilot cars', 'youtube_script', 'av_company', NULL, 1),
('How to get oilfield escort work in the Permian Basin', 'oilfield escort work Permian Basin', 'youtube_script', 'escort_operator', NULL, 1),
('Pilot car regulations in Texas — everything you need to know in 6 minutes', 'pilot car regulations Texas', 'youtube_script', 'escort_operator', NULL, 1),
('What happens on an oversize load move — a day in the life of a pilot car operator', 'pilot car operator day in the life', 'youtube_script', 'general_public', NULL, 2),
('How much does a pilot car cost? 2026 rate breakdown', 'pilot car cost 2026', 'youtube_script', 'broker', NULL, 1),
('How to become a pilot car operator — state certification guide', 'how to become pilot car operator', 'youtube_script', 'escort_operator', NULL, 1),

ON CONFLICT DO NOTHING;
