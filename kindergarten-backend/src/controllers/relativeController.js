const { executeQuery } = require('../dao/dbContext');
const { mapUserDTO, mapListDTO } = require('../dto/mappers');


const getRelatives = async (req, res) => {
    const { auth } = req.body;
    const sql = "SELECT * FROM relative ORDER BY id";
    try {
        const rows = await executeQuery(auth, sql);
        res.json(mapListDTO(rows));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createRelative = async (req, res) => {
    // ... твій код створення (залишається як був, він вже правильний) ...
    // (Я його не дублюю, щоб не займати місце, якщо треба - скажи)
    const { auth, data } = req.body;

    try {
        await executeQuery(auth, `CREATE USER "${data.dbUsername}" WITH PASSWORD '${data.password}'`);
        await executeQuery(auth, `GRANT role_parent TO "${data.dbUsername}"`);

        const sql = `
            INSERT INTO relative (first_name, last_name, patronymic, phone, address, db_username)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await executeQuery(auth, sql, [
            data.firstName, data.lastName, data.patronymic,
            data.phone, data.address, data.dbUsername
        ]);

        res.json({ status: 'success', message: 'Родича створено!' });
    } catch (err) {
        if (err.code === '23505') {
            res.status(400).json({ error: 'Логін або телефон вже зайняті!' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
};

// --- ОНОВЛЕННЯ РОДИЧА (З ПЕРЕЙМЕНУВАННЯМ) ---
const updateRelative = async (req, res) => {
    const { auth, id, data } = req.body;

    try {
        // 1. Дізнаємося СТАРИЙ логін
        const findOldSql = "SELECT db_username FROM relative WHERE id = $1";
        const oldResult = await executeQuery(auth, findOldSql, [id]);
        
        if (oldResult.length === 0) {
            return res.status(404).json({ error: 'Родича не знайдено' });
        }

        const oldUsername = oldResult[0].db_username;
        const newUsername = data.dbUsername;

        // 2. Якщо логін змінився — перейменовуємо в Postgres
        if (oldUsername && newUsername && oldUsername !== newUsername) {
            await executeQuery(auth, `ALTER USER "${oldUsername}" RENAME TO "${newUsername}"`);
        }

        // 3. Якщо є новий пароль — оновлюємо
        if (data.password && data.password.trim() !== "") {
            await executeQuery(auth, `ALTER USER "${newUsername}" WITH PASSWORD '${data.password}'`);
        }

        // 4. Оновлюємо таблицю relative
        const sql = `
            UPDATE relative
            SET first_name = $1, last_name = $2, patronymic = $3, 
                phone = $4, address = $5, db_username = $6
            WHERE id = $7
        `;

        await executeQuery(auth, sql, [
            data.firstName, 
            data.lastName, 
            data.patronymic,
            data.phone, 
            data.address, 
            newUsername, // Новий логін
            id
        ]);

        res.json({ status: 'success', message: 'Дані батьків оновлено' });

    } catch (err) {
        if (err.code === '42710' || err.code === '23505') { 
            res.status(400).json({ error: 'Цей логін вже зайнятий!' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
};

const deleteRelative = async (req, res) => {
    const { auth, id } = req.body;
    try {
        // 1. ПЕРЕВІРКА: Чи стане якась дитина "сиротою"?
        // Цей запит шукає дітей, у яких цей родич є ЄДИНИМ прив'язаним
        const checkSql = `
            SELECT c.first_name, c.last_name
            FROM child_relative cr
            JOIN child c ON cr.child_id = c.id
            WHERE cr.child_id IN (
                -- Знаходимо всіх дітей цього родича
                SELECT child_id FROM child_relative WHERE relative_id = $1
            )
            GROUP BY c.id, c.first_name, c.last_name
            HAVING COUNT(cr.relative_id) = 1 -- Якщо у дитини всього 1 родич (і це наш)
        `;

        const orphans = await executeQuery(auth, checkSql, [id]);

        if (orphans.length > 0) {
            const childNames = orphans.map(o => `${o.first_name} ${o.last_name}`).join(', ');
            return res.status(400).json({ 
                error: `Неможливо видалити! Цей родич є єдиним опікуном для: ${childNames}.` 
            });
        }

        // 2. Якщо перевірка пройшла успішно — продовжуємо видалення
        const userRes = await executeQuery(auth, "SELECT db_username FROM relative WHERE id = $1", [id]);
        const dbUsername = userRes[0]?.db_username;

        // Спочатку видаляємо зв'язки (хоча каскадне видалення в БД зробило б це саме, але для надійності)
        await executeQuery(auth, "DELETE FROM child_relative WHERE relative_id = $1", [id]);

        // Видаляємо самого родича
        await executeQuery(auth, "DELETE FROM relative WHERE id = $1", [id]);

        // Видаляємо системного користувача (логін)
        if (dbUsername) {
            await executeQuery(auth, `DROP USER IF EXISTS "${dbUsername}"`);
        }

        res.json({ status: 'success', message: 'Родича видалено' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getRelatives,
    createRelative,
    updateRelative,
    deleteRelative
};