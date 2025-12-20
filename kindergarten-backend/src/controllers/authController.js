const { executeQuery } = require('../dao/dbContext');
const { mapUserDTO, mapListDTO } = require('../dto/mappers');

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

module.exports = {login};