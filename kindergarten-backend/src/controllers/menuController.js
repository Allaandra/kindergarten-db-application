const { executeQuery } = require('../dao/dbContext');

const getMenu = async (req, res) => {
    const { auth } = req.body;
    try {
        const sql = `
            SELECT 
                m.id,
                m.date,
                g.name AS group_name,
                d1.name AS breakfast,
                d2.name AS lunch,
                d3.name AS snack,
                d4.name AS dinner
            FROM menu m
            JOIN kindergarten_group g ON m.group_id = g.id
            LEFT JOIN dish d1 ON m.breakfast_dish_id = d1.id
            LEFT JOIN dish d2 ON m.lunch_dish_id = d2.id
            LEFT JOIN dish d3 ON m.snack_dish_id = d3.id
            LEFT JOIN dish d4 ON m.dinner_dish_id = d4.id
            ORDER BY m.date DESC, g.name
        `;
        const rows = await executeQuery(auth, sql);
        
        // Форматуємо дату
        const formatted = rows.map(r => ({
            ...r,
            date: r.date.toISOString().split('T')[0] // Тільки YYYY-MM-DD
        }));

        res.json({ rows: formatted });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const addMenu = async (req, res) => {
    const { auth, date, groupId, breakfastId, lunchId, snackId, dinnerId } = req.body;
    try {
        const sql = `
            INSERT INTO menu (date, group_id, breakfast_dish_id, lunch_dish_id, snack_dish_id, dinner_dish_id)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await executeQuery(auth, sql, [date, groupId, breakfastId, lunchId, snackId, dinnerId]);
        res.json({ status: 'success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteMenu = async (req, res) => {
    const { auth, id } = req.body;
    try {
        await executeQuery(auth, "DELETE FROM menu WHERE id = $1", [id]);
        res.json({ status: 'success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getMenu, addMenu, deleteMenu };