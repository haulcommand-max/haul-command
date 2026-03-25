import 'dotenv/config';
import { 
    runGReg01_RegulatoryAudit, 
    runGReg02_CityNodes, 
    runGSeo01_KeywordTaxonomy,
    runGSeo02_CityPageStructures,
    runGSeo03_AiSearchAudit,
    runGSeo04_MoneyLeftOnTable,
    runGSeo05_SchemaGenerator,
    runGAuditFinal
} from '../lib/seo-engine/gemini-tasks';

async function main() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' HAUL COMMAND — SEO + REGULATORY AUDIT EXECUTION ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('WEEK 1 — DATA (Gemini) Sprint Initialized...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const coreCountries = [{ code: 'US', tier: 'A' }, { code: 'GB', tier: 'A' }];

    console.log('[Day 1] Running G-REG-01 Complete Audit...');
    await runGReg01_RegulatoryAudit();

    console.log('\n[Day 2] Running G-REG-02 City Nodes...');
    for (const c of coreCountries) await runGReg02_CityNodes(c.code, c.tier);

    console.log('\n[Day 3] Running G-SEO-01 Taxonomy Generation...');
    for (const c of coreCountries) await runGSeo01_KeywordTaxonomy(c.code);

    console.log('\n[Day 4] Running G-SEO-02 City Page Structuring...');
    await runGSeo02_CityPageStructures();

    console.log('\n[Day 5] Running G-SEO-03 AI Search Audit...');
    for (const c of coreCountries) await runGSeo03_AiSearchAudit(c.code);

    console.log('\n[Day 6] Running G-SEO-04 Money Left on Table...');
    await runGSeo04_MoneyLeftOnTable();

    console.log('\n[Day 7] Running G-SEO-05 Schemas & Final Scorecard...');
    await runGSeo05_SchemaGenerator();
    await runGAuditFinal();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('WEEK 1 SPRINTS COMPLETE. RESULTS WRITTEN TO CLOUD DB.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
