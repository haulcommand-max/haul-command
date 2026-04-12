const env=require('dotenv').config({path:'.env.local'}).parsed;
const {Client}=require('pg');
const c=new Client({connectionString: env.SUPABASE_DB_POOLER_URL});
(async () => {
    await c.connect();
    const images = [
        'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=400&q=80',
        'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?w=400&q=80',
        'https://images.unsplash.com/photo-1596489370617-64906f3ce631?w=400&q=80',
        'https://images.unsplash.com/photo-1591873041926-7ad399990885?w=400&q=80'
    ];
    let res = await c.query('SELECT id FROM house_ads WHERE image_url IS NULL');
    for (let i = 0; i < res.rows.length; i++) {
        let img = images[i % images.length];
        await c.query('UPDATE house_ads SET image_url = $1 WHERE id = $2', [img, res.rows[i].id]);
    }
    console.log(`Updated ${res.rows.length} house ads.`);
    await c.end();
})();
