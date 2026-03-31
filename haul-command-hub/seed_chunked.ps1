Add-Type -AssemblyName System.Windows.Forms

# ─── Schema fix ONLY (runs in <2s) ─────────────────────────
$sql = @'
ALTER TABLE provider_directory
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS lat NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS lng NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS service_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS coverage_status TEXT DEFAULT 'coming_soon',
  ADD COLUMN IF NOT EXISTS source_quality TEXT DEFAULT 'UNSOURCED',
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_directory_slug_key') THEN
    ALTER TABLE provider_directory ADD CONSTRAINT provider_directory_slug_key UNIQUE (slug);
  END IF;
END $$;

SELECT 'Schema fix complete' AS status;
'@

[System.Windows.Forms.Clipboard]::SetText($sql)
Write-Host "STEP 1 copied ($($sql.Length) chars) - Schema fix" -ForegroundColor Cyan
Write-Host "Paste into SQL Editor (Ctrl+A, Delete, Ctrl+V, Ctrl+Enter)" -ForegroundColor Yellow
Write-Host "Press ENTER here when done..." -ForegroundColor Green
Read-Host

# ─── Batch 1: pilot_car 500k ──────────────────────────────
$sql = @'
DO $$
DECLARE i INT; batch_size INT := 10000; current_limit INT;
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS t_states (sc TEXT, cn TEXT) ON COMMIT DROP;
    INSERT INTO t_states VALUES ('TX','Houston'),('TX','Dallas'),('TX','Austin'),('TX','San Antonio'),('CA','Los Angeles'),('CA','San Diego'),('CA','Fresno'),('CA','Sacramento'),('FL','Miami'),('FL','Orlando'),('FL','Tampa'),('FL','Jacksonville'),('NY','Albany'),('NY','Buffalo'),('NY','Rochester'),('PA','Pittsburgh'),('PA','Philadelphia'),('PA','Harrisburg'),('IL','Chicago'),('IL','Springfield'),('IL','Peoria'),('OH','Columbus'),('OH','Cleveland'),('OH','Cincinnati'),('GA','Atlanta'),('GA','Savannah'),('GA','Macon'),('NC','Charlotte'),('NC','Raleigh'),('NC','Greensboro'),('MI','Detroit'),('MI','Grand Rapids'),('MI','Lansing');
    FOR i IN 1..50 LOOP
        INSERT INTO provider_directory(slug,display_name,state,city,service_tags,phone,coverage_status,source_quality,verified)
        SELECT 'pilot_car-'||gen_random_uuid(),'Escort '||substr(md5(random()::text),1,6)||' Pilot Cars',s.sc,s.cn,ARRAY['pilot_car'],'+1'||(floor(random()*800+200)::int)::text||(floor(random()*8000000+2000000)::int)::text,CASE WHEN random()>0.1 THEN 'live' ELSE 'onboarding' END,'UNSOURCED',(random()>0.8)
        FROM generate_series(1,batch_size) g CROSS JOIN LATERAL (SELECT sc,cn FROM t_states ORDER BY random() LIMIT 1) s;
    END LOOP;
    RAISE NOTICE 'Batch 1 done: 500k pilot_car';
END $$;
SELECT COUNT(*) AS total FROM provider_directory;
'@

[System.Windows.Forms.Clipboard]::SetText($sql)
Write-Host "`nSTEP 2 copied ($($sql.Length) chars) - 500k pilot_car" -ForegroundColor Cyan
Write-Host "Paste into SQL Editor (Ctrl+A, Delete, Ctrl+V, Ctrl+Enter)" -ForegroundColor Yellow
Write-Host "WAIT ~30s for it to finish, then press ENTER here..." -ForegroundColor Green
Read-Host

# ─── Batch 2: pilot_car remaining 500k ────────────────────
$sql = @'
DO $$
DECLARE i INT; batch_size INT := 10000;
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS t_states (sc TEXT, cn TEXT) ON COMMIT DROP;
    INSERT INTO t_states VALUES ('TX','Houston'),('TX','Dallas'),('TX','Austin'),('TX','San Antonio'),('CA','Los Angeles'),('CA','San Diego'),('CA','Fresno'),('CA','Sacramento'),('FL','Miami'),('FL','Orlando'),('FL','Tampa'),('FL','Jacksonville'),('NY','Albany'),('NY','Buffalo'),('NY','Rochester'),('PA','Pittsburgh'),('PA','Philadelphia'),('PA','Harrisburg'),('IL','Chicago'),('IL','Springfield'),('IL','Peoria'),('OH','Columbus'),('OH','Cleveland'),('OH','Cincinnati'),('GA','Atlanta'),('GA','Savannah'),('GA','Macon'),('NC','Charlotte'),('NC','Raleigh'),('NC','Greensboro'),('MI','Detroit'),('MI','Grand Rapids'),('MI','Lansing');
    FOR i IN 1..50 LOOP
        INSERT INTO provider_directory(slug,display_name,state,city,service_tags,phone,coverage_status,source_quality,verified)
        SELECT 'pilot_car-'||gen_random_uuid(),'Escort '||substr(md5(random()::text),1,6)||' Pilot Cars',s.sc,s.cn,ARRAY['pilot_car'],'+1'||(floor(random()*800+200)::int)::text||(floor(random()*8000000+2000000)::int)::text,CASE WHEN random()>0.1 THEN 'live' ELSE 'onboarding' END,'UNSOURCED',(random()>0.8)
        FROM generate_series(1,batch_size) g CROSS JOIN LATERAL (SELECT sc,cn FROM t_states ORDER BY random() LIMIT 1) s;
    END LOOP;
    RAISE NOTICE 'Batch 2 done: 500k more pilot_car (total 1M)';
END $$;
SELECT COUNT(*) AS total FROM provider_directory;
'@

[System.Windows.Forms.Clipboard]::SetText($sql)
Write-Host "`nSTEP 3 copied ($($sql.Length) chars) - 500k more pilot_car" -ForegroundColor Cyan
Write-Host "Paste into SQL Editor (Ctrl+A, Delete, Ctrl+V, Ctrl+Enter)" -ForegroundColor Yellow
Write-Host "WAIT ~30s for it to finish, then press ENTER here..." -ForegroundColor Green
Read-Host

# ─── Batch 3: All remaining 566k entities ─────────────────
$sql = @'
DO $$
DECLARE mr RECORD; i INT; batch_size INT := 10000; cl INT;
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS t_states (sc TEXT, cn TEXT) ON COMMIT DROP;
    INSERT INTO t_states VALUES ('TX','Houston'),('TX','Dallas'),('TX','Austin'),('TX','San Antonio'),('CA','Los Angeles'),('CA','San Diego'),('CA','Fresno'),('CA','Sacramento'),('FL','Miami'),('FL','Orlando'),('FL','Tampa'),('FL','Jacksonville'),('NY','Albany'),('NY','Buffalo'),('NY','Rochester'),('PA','Pittsburgh'),('PA','Philadelphia'),('PA','Harrisburg'),('IL','Chicago'),('IL','Springfield'),('IL','Peoria'),('OH','Columbus'),('OH','Cleveland'),('OH','Cincinnati'),('GA','Atlanta'),('GA','Savannah'),('GA','Macon'),('NC','Charlotte'),('NC','Raleigh'),('NC','Greensboro'),('MI','Detroit'),('MI','Grand Rapids'),('MI','Lansing');
    CREATE TEMP TABLE IF NOT EXISTS t_mx (tag TEXT,qty INT,pfx TEXT,sfx TEXT) ON COMMIT DROP;
    INSERT INTO t_mx VALUES
    ('flagger',125000,'Traffic Control','Flaggers'),('height_pole',100000,'High Pole','Specialized Escort'),('witpac',50000,'WITPAC Certified','Interstate Pilots'),('bucket_truck',40000,'Utility Lift','Bucket Services'),('permit_service',25000,'Expedited','Permit Service'),('route_survey',20000,'Engineering','Route Surveys'),('traffic_control_supervisor',20000,'TCS','Control Supervisors'),('police_escort',10000,'State Highway','Police Escort'),('steer_car',5000,'Rear Steer','Escorts'),('freight_broker',120000,'Freight','Logistics Brokerage'),('mobile_mechanic',25000,'Heavy Duty','Mobile Mechanics'),('heavy_towing',10000,'Rotator','Heavy Towing'),('truck_stop',6000,'Travel Plaza','Truck Stop'),('staging_yard',5000,'Secure','Layover Yard'),('hazmat',3000,'Spill Response','HAZMAT Team'),('autonomous_responder',2000,'Autonomous','Fleet Responder');
    FOR mr IN SELECT * FROM t_mx LOOP
        FOR i IN 1..CEIL(mr.qty::numeric/batch_size) LOOP
            cl := LEAST(batch_size, mr.qty - ((i-1)*batch_size));
            INSERT INTO provider_directory(slug,display_name,state,city,service_tags,phone,coverage_status,source_quality,verified)
            SELECT mr.tag||'-'||gen_random_uuid(),mr.pfx||' '||substr(md5(random()::text),1,6)||' '||mr.sfx,s.sc,s.cn,ARRAY[mr.tag],'+1'||(floor(random()*800+200)::int)::text||(floor(random()*8000000+2000000)::int)::text,CASE WHEN random()>0.1 THEN 'live' ELSE 'onboarding' END,'UNSOURCED',(random()>0.8)
            FROM generate_series(1,cl) g CROSS JOIN LATERAL (SELECT sc,cn FROM t_states ORDER BY random() LIMIT 1) s;
        END LOOP;
    END LOOP;
    RAISE NOTICE 'Batch 3 done: 566k remaining entities';
END $$;
SELECT COUNT(*) AS total FROM provider_directory;
'@

[System.Windows.Forms.Clipboard]::SetText($sql)
Write-Host "`nSTEP 4 copied ($($sql.Length) chars) - 566k remaining entities" -ForegroundColor Cyan
Write-Host "Paste into SQL Editor (Ctrl+A, Delete, Ctrl+V, Ctrl+Enter)" -ForegroundColor Yellow
Write-Host "WAIT ~30s for it to finish, then press ENTER here..." -ForegroundColor Green
Read-Host

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "ALL 1,566,000 ENTITIES SEEDED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
