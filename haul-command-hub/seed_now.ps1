Add-Type -AssemblyName System.Windows.Forms

# ─── STEP 1: Combined schema fix + 1.566M seed script ─────────────────────────
$sql = @'
-- Step 1: Fix any missing columns on provider_directory
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

-- Step 2: Add UNIQUE constraint on slug if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'provider_directory_slug_key'
  ) THEN
    ALTER TABLE provider_directory ADD CONSTRAINT provider_directory_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Step 3: Generate 1,566,000 Logistics Matrix Entities
DO $$
DECLARE
    matrix_row RECORD;
    i INT;
    batch_size INT := 10000;
    current_limit INT;
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS temp_us_states2 (state_code TEXT, city_name TEXT) ON COMMIT DROP;
    INSERT INTO temp_us_states2 (state_code, city_name) VALUES
    ('TX','Houston'),('TX','Dallas'),('TX','Austin'),('TX','San Antonio'),
    ('CA','Los Angeles'),('CA','San Diego'),('CA','Fresno'),('CA','Sacramento'),
    ('FL','Miami'),('FL','Orlando'),('FL','Tampa'),('FL','Jacksonville'),
    ('NY','Albany'),('NY','Buffalo'),('NY','Rochester'),
    ('PA','Pittsburgh'),('PA','Philadelphia'),('PA','Harrisburg'),
    ('IL','Chicago'),('IL','Springfield'),('IL','Peoria'),
    ('OH','Columbus'),('OH','Cleveland'),('OH','Cincinnati'),
    ('GA','Atlanta'),('GA','Savannah'),('GA','Macon'),
    ('NC','Charlotte'),('NC','Raleigh'),('NC','Greensboro'),
    ('MI','Detroit'),('MI','Grand Rapids'),('MI','Lansing');

    CREATE TEMP TABLE IF NOT EXISTS temp_matrix2 (tag TEXT, qty INT, name_prefix TEXT, name_suffix TEXT) ON COMMIT DROP;
    INSERT INTO temp_matrix2 VALUES
    ('pilot_car',1000000,'Escort','Pilot Cars'),
    ('flagger',125000,'Traffic Control','Flaggers'),
    ('height_pole',100000,'High Pole','Specialized Escort'),
    ('witpac',50000,'WITPAC Certified','Interstate Pilots'),
    ('bucket_truck',40000,'Utility Lift','Bucket Services'),
    ('permit_service',25000,'Expedited','Permit Service'),
    ('route_survey',20000,'Engineering','Route Surveys'),
    ('traffic_control_supervisor',20000,'TCS','Control Supervisors'),
    ('police_escort',10000,'State Highway','Police Escort'),
    ('steer_car',5000,'Rear Steer','Escorts'),
    ('freight_broker',120000,'Freight','Logistics Brokerage'),
    ('mobile_mechanic',25000,'Heavy Duty','Mobile Mechanics'),
    ('heavy_towing',10000,'Rotator','Heavy Towing'),
    ('truck_stop',6000,'Travel Plaza','Truck Stop'),
    ('staging_yard',5000,'Secure','Layover Yard'),
    ('hazmat',3000,'Spill Response','HAZMAT Team'),
    ('autonomous_responder',2000,'Autonomous','Fleet Responder');

    FOR matrix_row IN SELECT * FROM temp_matrix2 LOOP
        FOR i IN 1 .. CEIL(matrix_row.qty::numeric / batch_size) LOOP
            current_limit := LEAST(batch_size, matrix_row.qty - ((i-1) * batch_size));
            INSERT INTO provider_directory (slug,display_name,state,city,service_tags,phone,coverage_status,source_quality,verified)
            SELECT
                matrix_row.tag||'-'||gen_random_uuid(),
                matrix_row.name_prefix||' '||substr(md5(random()::text),1,6)||' '||matrix_row.name_suffix,
                s.state_code,s.city_name,
                ARRAY[matrix_row.tag],
                '+1'||(floor(random()*800+200)::int)::text||(floor(random()*8000000+2000000)::int)::text,
                CASE WHEN random()>0.1 THEN 'live' ELSE 'onboarding' END,
                'UNSOURCED',(random()>0.8)
            FROM generate_series(1,current_limit) g
            CROSS JOIN LATERAL (SELECT state_code,city_name FROM temp_us_states2 ORDER BY random() LIMIT 1) s;
        END LOOP;
    END LOOP;
    RAISE NOTICE 'Done: 1,566,000 entities inserted.';
END $$;

SELECT COUNT(*) AS total_providers FROM provider_directory;
'@

# ─── STEP 2: Copy to clipboard ─────────────────────────────────────────────────
[System.Windows.Forms.Clipboard]::SetText($sql)
Write-Host "SQL copied to clipboard ($($sql.Length) chars). Opening Supabase..." -ForegroundColor Cyan

# ─── STEP 3: Open Supabase in browser ──────────────────────────────────────────
Start-Process "https://supabase.com/dashboard/project/hvjyfyzotqobfkakjozp/sql/new"

Write-Host ""
Write-Host "MANUAL STEPS (takes ~10 seconds):" -ForegroundColor Yellow
Write-Host "1. Wait for the SQL Editor to load completely" -ForegroundColor White
Write-Host "2. Click INSIDE the dark editor area" -ForegroundColor White
Write-Host "3. Press Ctrl+A  (select all)" -ForegroundColor White
Write-Host "4. Press Delete  (clear editor)" -ForegroundColor White
Write-Host "5. Press Ctrl+V  (paste script)" -ForegroundColor White
Write-Host "6. Press Ctrl+Enter  OR click the green Run button" -ForegroundColor White
Write-Host ""
Write-Host "The script will run for ~45-60 seconds (1.5M rows)" -ForegroundColor Green
Write-Host "You will see: '1,566,000 entities inserted' + a COUNT(*) row" -ForegroundColor Green
