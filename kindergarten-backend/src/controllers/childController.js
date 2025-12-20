const { executeQuery } = require('../dao/dbContext');
const { mapUserDTO, mapListDTO } = require('../dto/mappers');

const getChildren = async (req, res) => {
    const { auth } = req.body;
    
    // Запит залишаємо той самий, щоб таблиця не ламалася.
    // Просто у нових дітей поля parent_name та parent_phone будуть NULL.
    const sql = `
        SELECT 
            c.id,
            c.last_name,
            c.first_name,
            c.patronymic,
            c.birthday_date,
            c.group_id,
            g.name AS group_name,
            
            -- Підзапити залишаємо, вони просто повернуть NULL, якщо батьків немає
            (SELECT CONCAT(r.last_name, ' ', r.first_name, ' ', r.patronymic)
             FROM child_relative cr
             JOIN relative r ON cr.relative_id = r.id
             WHERE cr.child_id = c.id
             LIMIT 1) AS parent_name,

            (SELECT r.phone
             FROM child_relative cr
             JOIN relative r ON cr.relative_id = r.id
             WHERE cr.child_id = c.id
             LIMIT 1) AS parent_phone

        FROM child c
        LEFT JOIN kindergarten_group g ON c.group_id = g.id
        ORDER BY c.id
    `;

    try {
        const rows = await executeQuery(auth, sql);
        res.json(mapListDTO(rows));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- СТВОРЕННЯ ДИТИНИ (ТІЛЬКИ ДИТИНА) ---
const createChild = async (req, res) => {
    const { auth, data } = req.body;

    // Якщо група не вибрана -> NULL
    const groupId = (data.groupId && data.groupId !== "") ? data.groupId : null;

    // SQL запит тільки в таблицю child
    const sql = `
        INSERT INTO child (first_name, last_name, patronymic, birthday_date, group_id)
        VALUES ($1, $2, $3, $4, $5)
    `;

    try {
        await executeQuery(auth, sql, [
            data.firstName,
            data.lastName,
            data.patronymic || null,
            data.birthDate,
            groupId
        ]);
        
        res.json({ status: 'success', message: 'Дитину успішно створено!' });
    } catch (err) {
        console.error("Create child error:", err);
        res.status(500).json({ error: "Помилка бази даних: " + err.message });
    }
};

// --- ОНОВЛЕННЯ ДИТИНИ ---
const updateChild = async (req, res) => {
    const { auth, id, data } = req.body;
    const groupId = (data.groupId && data.groupId !== "") ? data.groupId : null;

    const sql = `
        UPDATE child
        SET first_name = $1, last_name = $2, patronymic = $3, 
            birthday_date = $4, group_id = $5
        WHERE id = $6
    `;

    try {
        await executeQuery(auth, sql, [
            data.firstName, data.lastName, data.patronymic,
            data.birthDate, groupId, id
        ]);
        res.json({ status: 'success', message: 'Дані дитини оновлено' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteChild = async (req, res) => {
    const { auth, id } = req.body;
    try {
        await executeQuery(auth, "DELETE FROM child WHERE id = $1", [id]);
        res.json({ status: 'success', message: 'Запис видалено' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getChildren,
    createChild,
    updateChild,
    deleteChild
};