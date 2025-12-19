const { Client } = require('pg');

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
};

// Универсальная функция для выполнения SQL от имени конкретного пользователя
async function executeQuery(auth, sql, params = []) {
    if (!auth || !auth.username) {
        throw new Error('Не вказані дані для авторизації (auth)');
    }

    const client = new Client({
        ...dbConfig,
        user: auth.username,
        password: auth.password
    });

    try {
        await client.connect();
        const result = await client.query(sql, params);
        return result.rows; 
    } catch (err) {
        console.error(`Database Error (${auth.username}):`, err.message);
        throw err; // Прокидываем ошибку дальше в контроллер
    } finally {
        await client.end();
    }
}

module.exports = { executeQuery };