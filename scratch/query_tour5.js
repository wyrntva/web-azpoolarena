const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: 'postgresql://postgres:ysH63sy6tn02@192.168.1.188:5432/azpoolarena'
    });
    await client.connect();
    
    // Find tournament ID 5
    const tourRes = await client.query('SELECT * FROM tournaments WHERE id = 5');
    console.log("Tournament 5 Details:");
    console.log(tourRes.rows);
    
    // Find registrations for tournament 5
    const regPlayers = await client.query(`
        SELECT tr.user_id, u.full_name, u.phone 
        FROM tournament_registrations tr 
        JOIN users u ON tr.user_id = u.id 
        WHERE tr.tournament_id = 5
    `);
    console.log("\nRegistered Players in Tournament 5:");
    console.log(regPlayers.rows.map(r => `${r.user_id}: ${r.full_name} (${r.phone})`));

    // Let's also look for all users whose names might match F, G, H, I
    const usersRes = await client.query(`
        SELECT id, full_name, phone 
        FROM users 
        WHERE full_name ILIKE '%f%' 
           OR full_name ILIKE '%g%' 
           OR full_name ILIKE '%h%' 
           OR full_name ILIKE '%i%'
    `);
    console.log("\nUsers matching F, G, H, I:");
    console.log(usersRes.rows.map(u => `${u.id}: ${u.full_name}`));

    // Check all tournaments
    const allTours = await client.query('SELECT id, name, number_of_players, status FROM tournaments ORDER BY id DESC');
    console.log("\nAll Tournaments:");
    console.log(allTours.rows);

    await client.end();
}

main().catch(console.error);
