// utils/mappers.js

// 1. DTO для пользователя
// Теперь мы не угадываем роль, а принимаем её как аргумент (source of truth)
const mapUserDTO = (username, role) => {
    return {
        username: username,
        role: role || 'guest', // Если роль не пришла, пишем guest
        loginTime: new Date().toISOString()
    };
};

// 2. DTO для списков
// Это нужно, чтобы фронтенд всегда получал структуру { rows: [...], count: 5 }
const mapListDTO = (dataArray) => {
    return {
        rows: dataArray,        // Важно: твой фронтенд ждет поле "rows"!
        count: dataArray.length,
        timestamp: new Date().toISOString()
    };
};

module.exports = { mapUserDTO, mapListDTO };