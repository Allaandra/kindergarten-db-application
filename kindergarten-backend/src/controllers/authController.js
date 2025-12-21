const { executeQuery } = require('../dao/dbContext');
const { mapUserDTO } = require('../dto/mappers');

const login = async (req, res) => {
    const { username, password } = req.body;
    // Використовуємо передані дані для тимчасової авторизації
    const tempAuth = { username, password };

    try {
        // 1. ПЕРЕВІРКА ПАРОЛЯ (PostgreSQL сам перевірить, чи правильний пароль)
        await executeQuery(tempAuth, "SELECT 1");

        // 2. Якщо пароль підійшов, визначаємо роль
        let role = null;

        if (username === 'admin_user') {
            role = 'role_admin';
        } else {
            // А. Шукаємо серед СПІВРОБІТНИКІВ
            const empSql = `
                SELECT p.db_role_name 
                FROM employee e
                JOIN position p ON e.position_id = p.id
                WHERE e.db_username = $1
            `;
            const empResult = await executeQuery(tempAuth, empSql, [username]);
            
            if (empResult.length > 0) {
                role = empResult[0].db_role_name;
            } else {
                // Б. Якщо не співробітник -> Шукаємо серед БАТЬКІВ (relative)
                // 👇 ЦЕ МИ ДОДАЛИ 👇
                const parentSql = `SELECT id FROM relative WHERE db_username = $1`;
                const parentResult = await executeQuery(tempAuth, parentSql, [username]);

                if (parentResult.length > 0) {
                    role = 'role_parent'; // Присвоюємо роль батька
                }
            }
        }

        // Якщо роль так і не знайшли (юзер є в БД, але немає в таблицях employee/relative)
        if (!role) {
            return res.status(403).json({ error: "Користувач не має прив'язки до ролі" });
        }

        // 3. Відправляємо відповідь через твій DTO (як і було раніше)
        res.json({ user: mapUserDTO(username, role) });

    } catch (err) {
        console.error("Login attempt failed:", err.message);
        // Якщо Postgres відхилив підключення — значить пароль невірний
        res.status(401).json({ error: "Невірний логін або пароль" });
    }
};

module.exports = { login };