const pg = require('pg');
const { Client } = pg;

async function main() {
    const client = new Client({
        connectionString: 'postgresql://postgres:ysH63sy6tn02@192.168.1.188:5432/azpoolarena'
    });
    await client.connect();
    
    const tourRes = await client.query('SELECT id, name, tournament_type, number_of_players, status FROM tournaments WHERE id = 5');
    console.log("Tournament 5 Info:");
    console.log(tourRes.rows);
    
    const roundRes = await client.query('SELECT DISTINCT round, bracket FROM tournament_matches WHERE tournament_id = 5 ORDER BY bracket, round');
    console.log("\nTournament 5 Unique Rounds and Brackets:");
    console.log(roundRes.rows);
    
    await client.end();
}

main().catch(console.error);
