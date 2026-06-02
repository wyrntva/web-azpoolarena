const pg = require('pg');

async function main() {
    const client = new pg.Client({
        connectionString: 'postgresql://postgres:ysH63sy6tn02@192.168.1.188:5432/azpoolarena'
    });
    await client.connect();
    
    console.log("Starting database repair for Tournament 5...");
    
    // Check values before repair
    const beforeTour = await client.query('SELECT start_date, registration_start_date, registration_end_date FROM tournaments WHERE id = 5');
    console.log("Before repair (tournaments):", beforeTour.rows[0]);
    
    // 1. Shift tournament dates back by 7 hours
    await client.query(`
        UPDATE tournaments 
        SET start_date = start_date - INTERVAL '7 hours',
            registration_start_date = registration_start_date - INTERVAL '7 hours',
            registration_end_date = registration_end_date - INTERVAL '7 hours'
        WHERE id = 5
    `);
    console.log("✅ Updated Tournament 5 dates.");
    
    // 2. Shift match times back by 7 hours
    const matchUpdate = await client.query(`
        UPDATE tournament_matches
        SET match_time = match_time - INTERVAL '7 hours'
        WHERE tournament_id = 5 AND match_time IS NOT NULL
    `);
    console.log(`✅ Updated ${matchUpdate.rowCount} matches for Tournament 5.`);
    
    // Check values after repair
    const afterTour = await client.query('SELECT start_date, registration_start_date, registration_end_date FROM tournaments WHERE id = 5');
    console.log("After repair (tournaments):", afterTour.rows[0]);
    
    await client.end();
    console.log("Database repair completed successfully.");
}

main().catch(console.error);
