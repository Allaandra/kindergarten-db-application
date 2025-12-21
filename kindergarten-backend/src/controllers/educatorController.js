const { executeQuery } = require('../dao/dbContext');

// 1. Отримати ВСІ групи цього вихователя
const getMyGroups = async (req, res) => {
    const { auth } = req.body;
    try {
        const sql = `
            SELECT g.id, g.name, g.age_category, g.child_count, g.max_capacity
            FROM kindergarten_group g
            JOIN employee e ON g.educator_id = e.id
            WHERE e.db_username = $1
            ORDER BY g.name
        `;
        const groups = await executeQuery(auth, sql, [auth.username]);
        
        const nameSql = `SELECT first_name, last_name FROM employee WHERE db_username = $1`;
        const userRes = await executeQuery(auth, nameSql, [auth.username]);
        
        res.json({ 
            groups: groups,
            fullName: userRes.length > 0 ? `${userRes[0].first_name} ${userRes[0].last_name}` : auth.username
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Отримати дітей КОНКРЕТНОЇ групи + їхній статус + БАТЬКІВ
const getGroupChildren = async (req, res) => {
    const { auth, groupId } = req.body;
    try {
        const sql = `
            SELECT 
                c.id, c.first_name, c.last_name, 
                a.status AS current_status, 
                a.reason AS current_reason,
                (
                    SELECT json_agg(json_build_object(
                        'type', cr.relation_type,
                        'name', r.first_name || ' ' || r.last_name || ' ' || r.patronymic,
                        'phone', r.phone,
                        'address', r.address
                    ))
                    FROM child_relative cr
                    JOIN relative r ON cr.relative_id = r.id
                    WHERE cr.child_id = c.id
                ) AS relatives
            FROM child c
            LEFT JOIN attendance a ON c.id = a.child_id AND a.date = CURRENT_DATE
            WHERE c.group_id = $1
            ORDER BY c.last_name
        `;
        const children = await executeQuery(auth, sql, [groupId]);
        res.json({ children });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Зберегти табель
const saveAttendance = async (req, res) => {
    const { auth, attendanceData } = req.body; 
    try {
        for (const item of attendanceData) {
            const sql = `
                INSERT INTO attendance (child_id, date, status, reason)
                VALUES ($1, CURRENT_DATE, $2, $3)
                ON CONFLICT (child_id, date) 
                DO UPDATE SET status = EXCLUDED.status, reason = EXCLUDED.reason
            `;
            await executeQuery(auth, sql, [item.childId, item.status, item.reason]);
        }
        res.json({ status: 'success', message: 'Дані збережено!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. Отримати розклад (ОСЬ ВІН, ВІН МАЄ БУТИ ТУТ!)
const getSchedule = async (req, res) => {
    const { auth } = req.body;
    try {
        const sql = `
            SELECT s.day_of_week, s.time_start, a.name as activity_name, g.name as group_name
            FROM schedule s
            JOIN activity a ON s.activity_id = a.id
            JOIN kindergarten_group g ON s.group_id = g.id
            JOIN employee e ON g.educator_id = e.id
            WHERE e.db_username = $1
            ORDER BY 
                CASE 
                    WHEN s.day_of_week = 'Понеділок' THEN 1
                    WHEN s.day_of_week = 'Вівторок' THEN 2
                    WHEN s.day_of_week = 'Середа' THEN 3
                    WHEN s.day_of_week = 'Четвер' THEN 4
                    WHEN s.day_of_week = 'П''ятниця' THEN 5
                END,
                s.time_start
        `;
        const schedule = await executeQuery(auth, sql, [auth.username]);
        res.json({ schedule });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 👇 ПЕРЕВІР, ЩО ТУТ Є getSchedule
module.exports = { getMyGroups, getGroupChildren, saveAttendance, getSchedule };