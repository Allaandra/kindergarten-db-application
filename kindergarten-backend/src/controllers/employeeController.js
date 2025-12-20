const { executeQuery } = require('../dao/dbContext');
const { mapUserDTO, mapListDTO } = require('../dto/mappers');

const getEmployees = async (req, res) => {
    const { auth } = req.body;

    const sql = `
        SELECT 
            e.id, 
            e.last_name,
            e.first_name, 
            e.patronymic,             
            e.phone, 
            p.name AS position_name,   
            e.address,
            e.position_id,             
            e.db_username              
        FROM employee e
        LEFT JOIN position p ON e.position_id = p.id
        ORDER BY e.id
    `;
    
    try {
        const rows = await executeQuery(auth, sql);
        res.json(mapListDTO(rows)); // Используем DTO
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getPositions = async (req, res) => {
    const { auth } = req.body;
    const sql = "SELECT * FROM position ORDER BY id";
    try {
        const rows = await executeQuery(auth, sql);
        res.json(mapListDTO(rows)); // Используем DTO
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createEmployee = async (req, res) => {
    const { auth, data } = req.body;

    try {
        // 1. Узнаем системную роль для этой должности
        const roleQuery = "SELECT db_role_name FROM position WHERE id = $1";
        const roleResult = await executeQuery(auth, roleQuery, [data.positionId]);
        const dbRole = roleResult[0]?.db_role_name;

        // 2. Создаем пользователя PostgreSQL
        // ВНИМАНИЕ: Используем двойные кавычки "${...}" для безопасности имен
        if (dbRole) {
            if (dbRole === 'role_admin') {
                // Админ получает право CREATEROLE
                await executeQuery(auth, `CREATE USER "${data.dbUsername}" WITH PASSWORD '${data.password}' CREATEROLE`);
            } else {
                // Остальные - обычные права
                await executeQuery(auth, `CREATE USER "${data.dbUsername}" WITH PASSWORD '${data.password}'`);
            }
            // Выдаем роль
            await executeQuery(auth, `GRANT ${dbRole} TO "${data.dbUsername}"`);
        } else {
             // Если роль не назначена (например, тех. персонал)
             await executeQuery(auth, `CREATE USER "${data.dbUsername}" WITH PASSWORD '${data.password}'`);
        }

        // 3. Создаем запись в таблице employee
        const insertSql = `
            INSERT INTO employee (
                first_name, last_name, patronymic, phone, address, position_id, db_username
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        const cleanAddress = (data.address && data.address.trim() !== "") ? data.address : null;
        const cleanPatronymic = (data.patronymic && data.patronymic.trim() !== "") ? data.patronymic : null;
        await executeQuery(auth, insertSql, [
            data.firstName, 
            data.lastName, 
            cleanPatronymic,
            data.phone, 
            cleanAddress,
            data.positionId, 
            data.dbUsername
        ]);
        
        res.json({ status: 'success', message: 'Співробітника створено!' });

    } catch (err) {
        // Обработка дубликатов (код 23505)
        if (err.code === '23505') {
            res.status(400).json({ error: 'Користувач з таким логіном або телефоном вже існує!' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
};

const updateEmployee = async (req, res) => {
    const { auth, id, data } = req.body;

    try {
        // 1. Если пришел пароль - меняем его в БД
        if (data.password && data.password.trim() !== "") {
             await executeQuery(auth, `ALTER USER "${data.dbUsername}" WITH PASSWORD '${data.password}'`);
        }

        // 2. Обновляем данные сотрудника
        const sql = `
            UPDATE employee 
            SET first_name = $1, last_name = $2, patronymic = $3, 
                phone = $4, address = $5, position_id = $6, db_username = $7
            WHERE id = $8
        `;

        const cleanAddress = (data.address && data.address.trim() !== "") ? data.address : null;
        const cleanPatronymic = (data.patronymic && data.patronymic.trim() !== "") ? data.patronymic : null;
        await executeQuery(auth, insertSql, [
            data.firstName, 
            data.lastName, 
            cleanPatronymic,
            data.phone, 
            cleanAddress,
            data.positionId, 
            data.dbUsername
        ]);
        
        res.json({ status: 'success', message: 'Дані оновлено' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// --- ВИДАЛЕННЯ СПІВРОБІТНИКА ---
const deleteEmployee = async (req, res) => {
    const { auth, id } = req.body;

    try {
        // 1. Спочатку дізнаємося логін, щоб "добити" системного юзера
        const findSql = "SELECT db_username FROM employee WHERE id = $1";
        const result = await executeQuery(auth, findSql, [id]);

        if (result.length === 0) {
            return res.status(404).json({ error: 'Співробітника не знайдено' });
        }

        const dbUser = result[0].db_username;

        // 2. Видаляємо з таблиці.
        // Завдяки ON DELETE SET NULL, якщо цей вихователь вів групу,
        // у групи поле educator_id саме стане NULL. Помилки не буде!
        const deleteSql = "DELETE FROM employee WHERE id = $1";
        await executeQuery(auth, deleteSql, [id]);

        // 3. Видаляємо системного користувача (щоб не міг увійти)
        if (dbUser) {
            await executeQuery(auth, `DROP USER IF EXISTS "${dbUser}"`);
        }

        res.json({ status: 'success', message: 'Співробітника видалено, зв\'язки розірвано автоматично.' });

    } catch (err) {
        // Тепер ця помилка вилетить, тільки якщо є ІНШІ таблиці (не Групи),
        // де стоїть сувора заборона (RESTRICT).
        if (err.code === '23503') {
            res.status(400).json({ error: 'Неможливо видалити: є пов\'язані дані, які база не може очистити автоматично.' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = {
    getEmployees,
    getPositions,
    createEmployee,
    updateEmployee,
    deleteEmployee
};