const { executeQuery } = require('../dao/dbContext');

// 1. Отримати список своїх дітей
const getMyChildren = async (req, res) => {
    const { auth } = req.body;
    try {
        const sql = `
            SELECT 
                c.id, c.first_name, c.last_name, 
                g.id as group_id, g.name as group_name,
                e.first_name || ' ' || e.last_name as educator_name,
                e.phone as educator_phone
            FROM child c
            JOIN child_relative cr ON c.id = cr.child_id
            JOIN relative r ON cr.relative_id = r.id
            JOIN kindergarten_group g ON c.group_id = g.id
            LEFT JOIN employee e ON g.educator_id = e.id
            WHERE r.db_username = $1
        `;
        const rows = await executeQuery(auth, sql, [auth.username]);
        res.json({ rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 2. Отримати повну інфу про дитину (Табель, Мед, Меню, Розклад)
const getChildDetails = async (req, res) => {
    const { auth, childId, groupId } = req.body;
    try {
        // А. Мед. картка
        const medical = await executeQuery(auth, `
            SELECT mt.name as type, mr.description, to_char(mr.record_date, 'YYYY-MM-DD') as date
            FROM medical_record mr
            JOIN medical_type mt ON mr.type_id = mt.id
            WHERE mr.child_id = $1 ORDER BY mr.record_date DESC
        `, [childId]);

        // Б. Відвідуваність (останні 10 записів)
        const attendance = await executeQuery(auth, `
            SELECT status, reason, to_char(date, 'YYYY-MM-DD') as date
            FROM attendance WHERE child_id = $1 ORDER BY date DESC LIMIT 10
        `, [childId]);

        // В. Меню (на сьогодні, для групи дитини)
        const menu = await executeQuery(auth, `
            SELECT 
                d1.name as b, d2.name as l, d3.name as s, d4.name as d
            FROM menu m
            LEFT JOIN dish d1 ON m.breakfast_dish_id = d1.id
            LEFT JOIN dish d2 ON m.lunch_dish_id = d2.id
            LEFT JOIN dish d3 ON m.snack_dish_id = d3.id
            LEFT JOIN dish d4 ON m.dinner_dish_id = d4.id
            WHERE m.group_id = $1 AND m.date = CURRENT_DATE
        `, [groupId]);

        // Г. Розклад (для групи дитини)
        const schedule = await executeQuery(auth, `
            SELECT s.day_of_week, s.time_start, a.name as activity
            FROM schedule s
            JOIN activity a ON s.activity_id = a.id
            WHERE s.group_id = $1
            ORDER BY s.time_start
        `, [groupId]);

        res.json({ medical, attendance, menu: menu[0] || null, schedule });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getMyChildren, getChildDetails };