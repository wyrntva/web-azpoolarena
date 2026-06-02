const { Client } = require('pg');
const c = new Client({ host:'192.168.1.188', port:5432, user:'postgres', password:'ysH63sy6tn02', database:'azpoolarena' });
c.connect().then(async () => {
  // Reset all upcoming matches for tournament 6 back to pending
  const r = await c.query(
    "UPDATE tournament_matches SET status = 'pending' WHERE tournament_id = 6 AND status = 'upcoming' RETURNING match_no, status"
  );
  console.log('Reset matches:', r.rows);
  await c.end();
});
