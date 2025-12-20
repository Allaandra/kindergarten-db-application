const { executeQuery } = require('../dao/dbContext');
const { mapUserDTO, mapListDTO } = require('../dto/mappers');

const getChildren = async (req, res) => {
    const { auth } = req.body;
    
    // Мы добавляем поле relatives_json, чтобы фронтенд мог заполнить форму редактирования
    const sql = `
        SELECT 
            c.id, c.last_name, c.first_name, c.patronymic, c.birthday_date, c.group_id,
            g.name AS group_name,
            
            -- Красивая строка для таблицы: "Мама (Иванова), Папа (Петров)"
            (
                SELECT STRING_AGG(CONCAT(r.last_name, ' ', SUBSTRING(r.first_name, 1, 1), '.', ' (', cr.relation_type, ')'), ', ')
                FROM child_relative cr
                JOIN relative r ON cr.relative_id = r.id
                WHERE cr.child_id = c.id
            ) AS parent_name,

            -- ВАЖНО: Сырой массив JSON для формы редактирования: [{ relativeId: 1, type: 'Мати' }]
            (
                SELECT COALESCE(json_agg(json_build_object('relativeId', cr.relative_id, 'type', cr.relation_type)), '[]')
                FROM child_relative cr
                WHERE cr.child_id = c.id
            ) AS relatives

        FROM child c
        LEFT JOIN kindergarten_group g ON c.group_id = g.id
        ORDER BY c.id
    `;

    try {
        const rows = await executeQuery(auth, sql);
        res.json({ rows }); 
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createChild = async (req, res) => {
    const { auth, data } = req.body;
    const groupId = (data.groupId && data.groupId !== "") ? data.groupId : null;
    
    // Очищаем массив: берем только тех, у кого реально выбран relativeId
    const relatives = (data.relatives || []).filter(r => r.relativeId && r.relativeId !== "");

    // --- ПЕРЕВІРКА: ЧИ Є БАТЬКИ? ---
    if (relatives.length === 0) {
        return res.status(400).json({ error: 'Помилка: У дитини має бути хоча б один опікун/родич!' });
    }

    try {
        // 1. Створюємо дитину (тільки якщо перевірка пройшла)
        const sqlChild = `
            INSERT INTO child (first_name, last_name, patronymic, birthday_date, group_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `;
        const childResult = await executeQuery(auth, sqlChild, [
            data.firstName, data.lastName, data.patronymic, data.birthDate, groupId
        ]);
        const newChildId = childResult[0].id;

        // 2. Додаємо зв'язки
        for (const rel of relatives) {
            await executeQuery(auth, 
                "INSERT INTO child_relative (child_id, relative_id, relation_type) VALUES ($1, $2, $3)", 
                [newChildId, rel.relativeId, rel.type]
            );
        }

        res.json({ status: 'success', message: 'Дитину створено!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- ВОТ ТУТ МЫ ЧИНИМ ОБНОВЛЕНИЕ ---
const updateChild = async (req, res) => {
    const { auth, id, data } = req.body;
    const groupId = (data.groupId && data.groupId !== "") ? data.groupId : null;
    const relatives = data.relatives || [];

    try {
        // 1. Обновляем самого ребенка
        const sql = `
            UPDATE child
            SET first_name = $1, last_name = $2, patronymic = $3, 
                birthday_date = $4, group_id = $5
            WHERE id = $6
        `;
        await executeQuery(auth, sql, [
            data.firstName, data.lastName, data.patronymic,
            data.birthDate, groupId, id
        ]);

        // 2. Обновляем связи (Самый простой способ: Удалить все старые -> Записать новые)
        
        // А) Удаляем старые связи для этого ребенка
        await executeQuery(auth, "DELETE FROM child_relative WHERE child_id = $1", [id]);

        // Б) Записываем новые (те, что пришли с формы)
        for (const rel of relatives) {
            // Пропускаем пустые строки или если не выбрали родича
            if (!rel.relativeId) continue;

            await executeQuery(auth, 
                "INSERT INTO child_relative (child_id, relative_id, relation_type) VALUES ($1, $2, $3)", 
                [id, rel.relativeId, rel.type]
            );
        }

        res.json({ status: 'success', message: 'Дані та родичів оновлено' });
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