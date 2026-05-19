const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://poolarena:ysH63sy6@localhost:5432/poolarena'
});
async function run() {
  const res = await pool.query('SELECT allowed_late_minutes FROM hr_attendance_settings WHERE is_active = true LIMIT 1');
  const allowed = res.rows.length > 0 ? res.rows[0].allowed_late_minutes : 5;
  await pool.query('UPDATE hr_work_schedules SET allowed_late_minutes = $1', [allowed]);
  console.log('Updated schedules to allowed_late = ' + allowed);
  
  // Also reset attendances that were incorrectly marked as LATE
  const updatedAtt = await pool.query(`
    UPDATE hr_attendances 
    SET status = 'PRESENT'
    WHERE status = 'LATE' 
      AND EXTRACT(EPOCH FROM (check_in_time::time - (SELECT start_time FROM hr_work_schedules WHERE hr_work_schedules.id = hr_attendances.work_schedule_id LIMIT 1)::time))/60 <= $1
  `, [allowed]);
  console.log('Reset attendances: ' + updatedAtt.rowCount);

  // Delete automatic penalties for LATE that are actually PRESENT
  await pool.query(`
    DELETE FROM hr_penalties 
    WHERE notes LIKE '%(Tự động)%' 
      AND amount > 0 
      AND user_id IN (
        SELECT user_id FROM hr_attendances WHERE status = 'PRESENT' AND date = hr_penalties.date
      )
  `);

  pool.end();
}
run();
