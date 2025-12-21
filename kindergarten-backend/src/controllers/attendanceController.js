const { executeQuery } = require('../dao/dbContext');

const getAttendanceByDate = async (req, res) => {
    const { auth, date, groupId } = req.body;
    try {
        let groupFilter = "";
        let params = [date]; 

        if (groupId) {
            groupFilter = "AND c.group_id = $2";
            params.push(groupId);
        }

        const sql = `
            SELECT 
                c.id,
                c.first_name || ' ' || c.last_name AS full_name,
                g.name AS group_name,
                -- 👇 ОСЬ ТУТ БУЛА ПОМИЛКА. МИ ДОДАЛИ ::text
                COALESCE(a.status::text, 'Не відмічено') AS status, 
                COALESCE(a.reason, '') AS reason
            FROM child c
            JOIN kindergarten_group g ON c.group_id = g.id
            LEFT JOIN attendance a ON c.id = a.child_id AND a.date = $1
            WHERE 1=1 ${groupFilter}
            ORDER BY g.name, c.last_name
        `;

        const rows = await executeQuery(auth, sql, params);
        res.json({ rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAttendanceByDate };