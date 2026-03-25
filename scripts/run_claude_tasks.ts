import 'dotenv/config';
import {
    runCSeo01_CityPageContentAudit,
    runCSeo02_RegulatoryPageCheck,
    runCSeo03_AiSearchAnswerQuality,
    runCSeo04_LongTailCorridorPages,
    runCSeo05_IndustryVerticalPages,
    runCSeo06_OperatorAcquisition,
    runCSeo07_SchemaQualityReview,
    runCSeo08_AiEntityEstablishment,
    runCSeo09_MultilingualAudit,
    runCSeo10_MoneyLeftStrategicReview
} from '../lib/seo-engine/claude-tasks';

async function main() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' HAUL COMMAND — SEO + CONTENT SCALE EXECUTION ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('WEEK 2 — CONTENT (Claude) Sprint Initialized...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const coreCountries = ['US', 'GB'];
    const nonEnglishMarkets = ['DE', 'NL', 'BR'];

    console.log('[Day 1-2] Running C-SEO-08 Entity Definition Pages...');
    await runCSeo08_AiEntityEstablishment();

    console.log('\n[C-SEO-07] Running Schema validation...');
    await runCSeo07_SchemaQualityReview();

    console.log('\n[Day 3] Running C-SEO-02 Regulatory Pages for Tier A...');
    for (const c of coreCountries) await runCSeo02_RegulatoryPageCheck(c);

    console.log('\n[C-SEO-03] AI Search Optimization Direct Answers...');
    for (const c of coreCountries) await runCSeo03_AiSearchAnswerQuality(c);

    console.log('\n[Day 5] Running C-SEO-01 High-Quality City Content Generation...');
    await runCSeo01_CityPageContentAudit();

    console.log('\n[Day 6] Running C-SEO-05 Industry Vertical Authority Pages...');
    await runCSeo05_IndustryVerticalPages();
    
    console.log('\n[Day 6.5] Generating Long Tail Corridor Overviews (C-SEO-04)...');
    await runCSeo04_LongTailCorridorPages();
    
    console.log('\n[Day 6.6] Operator Acquisition Recruiting (C-SEO-06)...');
    await runCSeo06_OperatorAcquisition();

    console.log('\n[Week 3/Day 7] Running C-SEO-09 Multilingual Quality Audits...');
    for (const c of nonEnglishMarkets) await runCSeo09_MultilingualAudit(c);

    console.log('\n[Day 7] Running C-SEO-10 Executive Strategic Review...');
    await runCSeo10_MoneyLeftStrategicReview();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('WEEK 2 SPRINTS COMPLETE. RESULTS WRITTEN TO CLOUD DB.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
