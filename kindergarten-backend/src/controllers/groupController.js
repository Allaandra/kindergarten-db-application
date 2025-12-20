const { executeQuery } = require('../dao/dbContext');
const { mapUserDTO, mapListDTO } = require('../dto/mappers');

const getGroups = async (req, res) => {
    const { auth } = req.body;
    
    const sql = `
        SELECT 
            g.id, 
            g.name, 
            g.age_category, 
            g.max_capacity, -- Оставляем для редактирования (чтобы в форме было число 20)
            g.educator_id,  -- Оставляем для связей
            
            -- НОВОЕ: Считаем детей и клеим строку "5 / 20"
            CONCAT(
                (SELECT COUNT(*) FROM child c WHERE c.group_id = g.id), 
                ' / ', 
                g.max_capacity
            ) AS occupancy, -- Назовем это поле "occupancy" (Заполненность)

            -- Имя воспитателя (как делали раньше)
            CASE 
                WHEN e.id IS NOT NULL THEN CONCAT(e.last_name, ' ', e.first_name, ' ', e.patronymic)
                ELSE NULL 
            END AS educator_name
            
        FROM kindergarten_group g
        LEFT JOIN employee e ON g.educator_id = e.id
        ORDER BY g.id
    `;

    try {
        const rows = await executeQuery(auth, sql);
        res.json(mapListDTO(rows));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createGroup = async (req, res) => {
    const { auth, data } = req.body;

    // Очистка educatorId: если пустая строка или "null" -> ставим реальный null
    const educatorId = (data.educatorId && data.educatorId !== "null") ? data.educatorId : null;

    const sql = `
        INSERT INTO kindergarten_group (name, age_category, max_capacity, educator_id) 
        VALUES ($1, $2, $3, $4)
    `;

    try {
        await executeQuery(auth, sql, [
            data.name, 
            data.ageCategory, 
            data.maxCapacity, 
            educatorId
        ]);
        
        res.json({ status: 'success', message: 'Групу успішно створено!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

const updateGroup = async (req, res) => {
    const { auth, id, data } = req.body;

    const educatorId = (data.educatorId && data.educatorId !== "null") ? data.educatorId : null;

    const sql = `
        UPDATE kindergarten_group 
        SET name = $1, age_category = $2, max_capacity = $3, educator_id = $4
        WHERE id = $5
    `;

    try {
        await executeQuery(auth, sql, [
            data.name, 
            data.ageCategory, 
            data.maxCapacity, 
            educatorId,
            id
        ]);
        
        res.json({ status: 'success', message: 'Групу оновлено' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteGroup = async (req, res) => {
    const { auth, id } = req.body;
    const sql = "DELETE FROM kindergarten_group WHERE id = $1";

    try {
        await executeQuery(auth, sql, [id]);
        res.json({ status: 'success', message: 'Групу видалено' });
    } catch (err) {
        // Ошибка 23503: Нарушение внешнего ключа (в группе есть дети)
        if (err.code === '23503') {
            res.status(400).json({ error: 'Не можна видалити цю групу: в ній ще є діти!' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
};

const getEducators = async (req, res) => {
    const { auth } = req.body;
    
    // Вибираємо тільки тих, у кого роль 'role_educator'
    const sql = `
        SELECT e.id, e.first_name, e.last_name, e.patronymic
        FROM employee e
        JOIN position p ON e.position_id = p.id
        WHERE p.db_role_name = 'role_educator'
        ORDER BY e.last_name
    `;

    try {
        const rows = await executeQuery(auth, sql);
        res.json(mapListDTO(rows)); // Використовуємо наш красивий маппер
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    getEducators
};