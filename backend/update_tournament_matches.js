const pg = require('pg');

async function main() {
    const client = new pg.Client({
        connectionString: 'postgresql://postgres:ysH63sy6tn02@192.168.1.188:5432/azpoolarena'
    });
    await client.connect();
    
    console.log("Updating Tournament 5 match times...");
    
    // Get the current start date of the tournament
    const tourRes = await client.query('SELECT start_date FROM tournaments WHERE id = 5');
    const start_date = tourRes.rows[0].start_date;
    console.log(`Tournament 5 new start date: ${start_date}`);
    
    if (!start_date) {
        console.error("Tournament start date is not configured.");
        await client.end();
        return;
    }
    
    // Update all non-null match times to the tournament's start date
    // Note: In 24-player double elimination, only Winners Round 1 matches with both players are scheduled.
    const matchUpdate = await client.query(`
        UPDATE tournament_matches
        SET match_time = $1
        WHERE tournament_id = 5 
          AND match_time IS NOT NULL
    `, [start_date]);
    
    console.log(`✅ Updated ${matchUpdate.rowCount} matches to ${start_date}.`);
    
    await client.end();
    console.log("Match times update completed successfully.");
}

main().catch(console.error);
