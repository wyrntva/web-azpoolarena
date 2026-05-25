const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
async function run() {
  try {
    const res = await pool.query('SELECT allowed_late_minutes FROM attendance_settings WHERE is_active = true LIMIT 1');
    const allowed = res.rows.length > 0 ? res.rows[0].allowed_late_minutes : 5;
    await pool.query('UPDATE work_schedules SET allowed_late_minutes = $1', [allowed]);
    
    await pool.query(`
      UPDATE attendances 
      SET status = 'present'
      WHERE status = 'late' 
        AND EXTRACT(EPOCH FROM (check_in_time::time - (SELECT start_time FROM work_schedules WHERE work_schedules.id = attendances.work_schedule_id LIMIT 1)::time))/60 <= $1
    `, [allowed]);

    const delRes = await pool.query(`
      DELETE FROM penalties 
      WHERE notes LIKE '%(Tự động)%' 
        AND amount > 0 
        AND user_id IN (
          SELECT user_id FROM attendances WHERE status = 'present' AND date = penalties.date
        )
    `);
    console.log('✅ Local DB fixed! Removed ' + delRes.rowCount + ' invalid penalties.');
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
