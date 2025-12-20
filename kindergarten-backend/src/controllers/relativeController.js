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

// controllers/mainController.js

// --- СТВОРЕННЯ РОДИЧА (РУЧНИЙ ЛОГІН) ---
const createRelative = async (req, res) => {
    const { auth, data } = req.body;

    try {
        // 1. Створюємо користувача PostgreSQL (Role Parent)
        // Тепер беремо логін і пароль, які ввів Адмін руками!
        await executeQuery(auth, `CREATE USER "${data.dbUsername}" WITH PASSWORD '${data.password}'`);
        await executeQuery(auth, `GRANT role_parent TO "${data.dbUsername}"`);

        // 2. Записуємо в таблицю relative
        const sql = `
            INSERT INTO relative (first_name, last_name, patronymic, phone, address, db_username)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;

        // Очистка полів (як у співробітників)
        const cleanAddress = (data.address && data.address.trim() !== "") ? data.address : null;
        const cleanPatronymic = (data.patronymic && data.patronymic.trim() !== "") ? data.patronymic : null;

        await executeQuery(auth, sql, [
            data.firstName, 
            data.lastName, 
            cleanPatronymic,
            data.phone, 
            cleanAddress, 
            data.dbUsername // Записуємо той логін, що ввели
        ]);

        res.json({ status: 'success', message: 'Родича та доступ створено!' });

    } catch (err) {
        // Ловимо дублікати логінів або телефонів
        if (err.code === '23505') {
            res.status(400).json({ error: 'Користувач з таким логіном або телефоном вже існує!' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
};

// --- ОНОВЛЕННЯ РОДИЧА ---
const updateRelative = async (req, res) => {
    const { auth, id, data } = req.body;

    try {
        // 1. Якщо прийшов новий пароль - міняємо його в системі
        if (data.password && data.password.trim() !== "") {
            // Важливо: тут використовуємо data.dbUsername, вважаючи, що адмін не змінював сам логін, а тільки пароль
            await executeQuery(auth, `ALTER USER "${data.dbUsername}" WITH PASSWORD '${data.password}'`);
        }

        // 2. Оновлюємо таблицю
        const sql = `
            UPDATE relative
            SET first_name = $1, last_name = $2, patronymic = $3, 
                phone = $4, address = $5, db_username = $6
            WHERE id = $7
        `;

        const cleanAddress = (data.address && data.address.trim() !== "") ? data.address : null;
        const cleanPatronymic = (data.patronymic && data.patronymic.trim() !== "") ? data.patronymic : null;

        await executeQuery(auth, sql, [
            data.firstName, 
            data.lastName, 
            cleanPatronymic,
            data.phone, 
            cleanAddress, 
            data.dbUsername, // Дозволяємо оновити логін в таблиці (хоча системний юзер залишиться зі старим іменем, якщо не робити RENAME)
            id
        ]);

        res.json({ status: 'success', message: 'Дані оновлено' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteRelative = async (req, res) => {
    const { auth, id } = req.body;
    try {
        // Знаходимо логін перед видаленням
        const userRes = await executeQuery(auth, "SELECT db_username FROM relative WHERE id = $1", [id]);
        const dbUsername = userRes[0]?.db_username;

        // Видаляємо з таблиці (каскад видалить зв'язки з дітьми)
        await executeQuery(auth, "DELETE FROM relative WHERE id = $1", [id]);

        // Видаляємо системного юзера
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