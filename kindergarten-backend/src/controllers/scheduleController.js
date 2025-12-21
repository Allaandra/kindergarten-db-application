const { executeQuery } = require('../dao/dbContext');

// 1. Отримати весь розклад (з назвами груп і занять)
const getSchedule = async (req, res) => {
    const { auth } = req.body;
    try {
        const sql = `
            SELECT 
                s.id,
                g.name AS group_name,
                a.name AS activity_name,
                s.day_of_week,
                to_char(s.time_start, 'HH24:MI') as time_start -- Форматуємо час без секунд
            FROM schedule s
            JOIN kindergarten_group g ON s.group_id = g.id
            JOIN activity a ON s.activity_id = a.id
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
        const rows = await executeQuery(auth, sql);
        res.json({ rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Отримати список занять (для випадаючого списку)
const getActivities = async (req, res) => {
    const { auth } = req.body;
    try {
        const rows = await executeQuery(auth, "SELECT * FROM activity ORDER BY name");
        res.json({ rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Додати урок
const addScheduleItem = async (req, res) => {
    const { auth, groupId, activityId, day, time } = req.body;
    try {
        const sql = `
            INSERT INTO schedule (group_id, activity_id, day_of_week, time_start)
            VALUES ($1, $2, $3, $4)
        `;
        await executeQuery(auth, sql, [groupId, activityId, day, time]);
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. Видалити урок
const deleteScheduleItem = async (req, res) => {
    const { auth, id } = req.body;
    try {
        await executeQuery(auth, "DELETE FROM schedule WHERE id = $1", [id]);
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getSchedule, getActivities, addScheduleItem, deleteScheduleItem };