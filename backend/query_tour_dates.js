const pg = require('pg');
pg.types.setTypeParser(1114, (stringValue) => stringValue);

const { Client } = pg;

async function main() {
    const client = new Client({
        connectionString: 'postgresql://postgres:ysH63sy6tn02@192.168.1.188:5432/azpoolarena'
    });
    await client.connect();
    
    // Check all tournaments dates
    const tourRes = await client.query('SELECT id, name, start_date, status FROM tournaments ORDER BY id');
    console.log("Tournaments Date Columns:");
    console.log(tourRes.rows);
    
    // Check some matches for tournament 5
    const matchRes = await client.query('SELECT id, match_no, match_time, status FROM tournament_matches WHERE tournament_id = 5 ORDER BY match_no LIMIT 10');
    console.log("\nTournament 5 Matches:");
    console.log(matchRes.rows);
    
    await client.end();
}

main().catch(console.error);
