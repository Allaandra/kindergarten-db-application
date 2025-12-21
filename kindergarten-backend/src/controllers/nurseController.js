const { executeQuery } = require('../dao/dbContext');

// 1. Отримати список дітей (для вибору)
const getChildren = async (req, res) => {
    const { auth } = req.body;
    try {
        const rows = await executeQuery(auth, "SELECT id, first_name, last_name FROM child ORDER BY last_name");
        res.json({ rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 2. Отримати типи записів (довідник)
const getMedicalTypes = async (req, res) => {
    const { auth } = req.body;
    try {
        const rows = await executeQuery(auth, "SELECT * FROM medical_type ORDER BY name");
        res.json({ rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 3. Отримати всі мед. записи (з іменами дітей і типами)
const getMedicalRecords = async (req, res) => {
    const { auth } = req.body;
    try {
        const sql = `
            SELECT 
                mr.id,
                c.first_name || ' ' || c.last_name AS child_name,
                mt.name AS type_name,
                mr.description,
                to_char(mr.record_date, 'YYYY-MM-DD') as record_date
            FROM medical_record mr
            JOIN child c ON mr.child_id = c.id
            JOIN medical_type mt ON mr.type_id = mt.id
            ORDER BY mr.record_date DESC
        `;
        const rows = await executeQuery(auth, sql);
        res.json({ rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 4. Додати запис
const addMedicalRecord = async (req, res) => {
    const { auth, childId, typeId, description } = req.body;
    try {
        await executeQuery(auth, 
            "INSERT INTO medical_record (child_id, type_id, description) VALUES ($1, $2, $3)", 
            [childId, typeId, description]
        );
        res.json({ status: 'success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 5. Видалити запис
const deleteMedicalRecord = async (req, res) => {
    const { auth, id } = req.body;
    try {
        await executeQuery(auth, "DELETE FROM medical_record WHERE id = $1", [id]);
        res.json({ status: 'success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getChildren, getMedicalTypes, getMedicalRecords, addMedicalRecord, deleteMedicalRecord };