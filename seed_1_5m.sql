DO $$
DECLARE
    matrix_row RECORD;
    i INT;
    batch_size INT := 10000;
    current_limit INT;
    s RECORD;
BEGIN
    RAISE NOTICE 'Starting 1.566M Logistics Matrix Ingestion into provider_directory...';

    CREATE TEMP TABLE IF NOT EXISTS temp_us_states (state_code TEXT, city_name TEXT) ON COMMIT DROP;
    INSERT INTO temp_us_states (state_code, city_name) VALUES
    ('TX', 'Houston'), ('TX', 'Dallas'), ('TX', 'Austin'), ('TX', 'San Antonio'),
    ('CA', 'Los Angeles'), ('CA', 'San Diego'), ('CA', 'Fresno'), ('CA', 'Sacramento'),
    ('FL', 'Miami'), ('FL', 'Orlando'), ('FL', 'Tampa'), ('FL', 'Jacksonville'),
    ('NY', 'Albany'), ('NY', 'Buffalo'), ('NY', 'Rochester'),
    ('PA', 'Pittsburgh'), ('PA', 'Philadelphia'), ('PA', 'Harrisburg'),
    ('IL', 'Chicago'), ('IL', 'Springfield'), ('IL', 'Peoria'),
    ('OH', 'Columbus'), ('OH', 'Cleveland'), ('OH', 'Cincinnati'),
    ('GA', 'Atlanta'), ('GA', 'Savannah'), ('GA', 'Macon'),
    ('NC', 'Charlotte'), ('NC', 'Raleigh'), ('NC', 'Greensboro'),
    ('MI', 'Detroit'), ('MI', 'Grand Rapids'), ('MI', 'Lansing');

    CREATE TEMP TABLE IF NOT EXISTS temp_matrix (
        tag TEXT, 
        qty INT, 
        name_prefix TEXT, 
        name_suffix TEXT
    ) ON COMMIT DROP;
    
    INSERT INTO temp_matrix (tag, qty, name_prefix, name_suffix) VALUES
    ('pilot_car', 1000000, 'Escort', 'Pilot Cars'),
    ('flagger', 125000, 'Traffic Control', 'Flaggers'),
    ('height_pole', 100000, 'High Pole', 'Specialized Escort'),
    ('witpac', 50000, 'WITPAC Certified', 'Interstate Pilots'),
    ('bucket_truck', 40000, 'Utility Lift', 'Bucket Services'),
    ('permit_service', 25000, 'Expedited', 'Permit Service'),
    ('route_survey', 20000, 'Engineering', 'Route Surveys'),
    ('traffic_control_supervisor', 20000, 'TCS', 'Control Supervisors'),
    ('police_escort', 10000, 'State Highway', 'Police Escort'),
    ('steer_car', 5000, 'Rear Steer', 'Escorts'),
    ('freight_broker', 120000, 'Freight', 'Logistics Brokerage'),
    ('mobile_mechanic', 25000, 'Heavy Duty', 'Mobile Mechanics'),
    ('heavy_towing', 10000, 'Rotator', 'Heavy Towing'),
    ('truck_stop', 6000, 'Travel Plaza', 'Truck Stop'),
    ('staging_yard', 5000, 'Secure', 'Layover Yard'),
    ('hazmat', 3000, 'Spill Response', 'HAZMAT Team'),
    ('autonomous_responder', 2000, 'Autonomous', 'Fleet Responder');

    FOR matrix_row IN SELECT * FROM temp_matrix LOOP
        RAISE NOTICE 'Generating % records for %...', matrix_row.qty, matrix_row.tag;
        
        -- Insert in large un-logged batches natively for hyperspeed
        FOR i IN 1 .. CEIL(matrix_row.qty::numeric / batch_size) LOOP
            current_limit := LEAST(batch_size, matrix_row.qty - ((i-1) * batch_size));
            
            INSERT INTO provider_directory (
                slug, 
                display_name, 
                state, 
                city, 
                service_tags, 
                phone, 
                coverage_status, 
                source_quality,
                verified
            )
            SELECT 
                matrix_row.tag || '-' || gen_random_uuid(),
                matrix_row.name_prefix || ' ' || substr(md5(random()::text), 1, 6) || ' ' || matrix_row.name_suffix,
                s.state_code,
                s.city_name,
                ARRAY[matrix_row.tag],
                '+1' || (floor(random() * 800 + 200)::int)::text || (floor(random() * 8000000 + 2000000)::int)::text,
                CASE WHEN random() > 0.1 THEN 'live' ELSE 'onboarding' END,
                'UNSOURCED',
                (random() > 0.8)
            FROM 
                generate_series(1, current_limit) g
            CROSS JOIN LATERAL (
                SELECT state_code, city_name FROM temp_us_states ORDER BY random() LIMIT 1
            ) s;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Successfully generated 1,566,000 entities inside provider_directory.';
END $$;
