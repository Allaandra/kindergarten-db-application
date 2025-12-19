const { executeQuery } = require('../dao/dbContext');
const { mapUserDTO, mapListDTO } = require('../dto/mappers');

// ==========================================
// 1. АВТОРИЗАЦИЯ
// ==========================================

const login = async (req, res) => {
    const { username, password } = req.body;
    // Используем переданные данные для временной авторизации
    const tempAuth = { username, password };

    try {
        // 1. Проверяем, подходит ли пароль (выполняем простейший запрос)
        await executeQuery(tempAuth, "SELECT 1");

        // 2. Если пароль подошел, определяем роль
        let role = null;

        if (username === 'admin_user') {
            role = 'role_admin';
        } else {
            // Ищем роль сотрудника через его должность
            const sql = `
                SELECT p.db_role_name 
                FROM employee e
                JOIN position p ON e.position_id = p.id
                WHERE e.db_username = $1
            `;
            const result = await executeQuery(tempAuth, sql, [username]);
            
            if (result.length > 0) {
                role = result[0].db_role_name;
            }
        }

        // 3. Отправляем ответ через DTO (структурированный объект)
        res.json({ user: mapUserDTO(username, role) });

    } catch (err) {
        console.error("Login attempt failed:", err.message);
        res.status(401).json({ error: "Невірний логін або пароль" });
    }
};


// Оновлений контролер ГРУП
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

// ==========================================
// 3. СОТРУДНИКИ
// ==========================================

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

// ==========================================
// 4. ДЕТИ
// ==========================================

// --- ДІТИ (БЕЗ VIEW, ПРЯМИЙ ЗАПИТ) ---

const getChildren = async (req, res) => {
    const { auth } = req.body;
    
    // Запит залишаємо той самий, щоб таблиця не ламалася.
    // Просто у нових дітей поля parent_name та parent_phone будуть NULL.
    const sql = `
        SELECT 
            c.id,
            c.first_name,
            c.last_name,
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
        ORDER BY c.last_name
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


// --- СПЕЦІАЛЬНИЙ ЗАПИТ ДЛЯ СПИСКІВ ---

// Отримати тільки вихователів (для випадаючого списку в групах)
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

// Экспорт всех функций
module.exports = { 
    login, 
    getGroups, createGroup, updateGroup, deleteGroup,
    getEmployees, createEmployee, updateEmployee, getPositions, deleteEmployee,
    getChildren, createChild, updateChild, deleteChild,
    getEducators
};