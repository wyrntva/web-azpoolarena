const { Client } = require('pg');
const c = new Client({ host:'192.168.1.188', port:5432, user:'postgres', password:'ysH63sy6tn02', database:'azpoolarena' });
c.connect().then(async () => {
  const t = await c.query("SELECT id, registration_end_date, start_date, status FROM tournaments WHERE id = 6");
  console.log('Tournament 6:');
  console.table(t.rows);
  console.log('Now (UTC):', new Date().toISOString());
  console.log('Registration ended?', new Date() >= new Date(t.rows[0].registration_end_date));

  const r = await c.query(
    "SELECT match_no, player1_id, player2_id, table_no, status, round FROM tournament_matches WHERE tournament_id = 6 AND round = 1 ORDER BY match_no"
  );
  console.log('\nRound 1 matches:');
  console.table(r.rows);
  await c.end();
});
