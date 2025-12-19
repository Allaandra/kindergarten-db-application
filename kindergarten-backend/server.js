require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Импортируем контроллеры
const controller = require('./src/controllers/mainController');

const app = express();
app.use(cors());
app.use(express.json());

// Логирование для красоты
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// === МАРШРУТЫ ===
app.post('/api/login', controller.login);

app.post('/api/groups', controller.getGroups);
app.post('/api/groups/create', controller.createGroup);
app.post('/api/groups/delete', controller.deleteGroup);
app.post('/api/groups/update', controller.updateGroup);

app.post('/api/employees', controller.getEmployees);
app.post('/api/employees/create', controller.createEmployee);
app.post('/api/employees/delete', controller.deleteEmployee);
app.post('/api/employees/update', controller.updateEmployee);

app.post('/api/children', controller.getChildren);
//app.post('/api/children/create', controller.createChild);
//app.post('/api/children/delete', controller.deleteChild);
//app.post('/api/children/update', controller.updateChild);

app.post('/api/positions', controller.getPositions);
app.post('/api/educators', controller.getEducators);

// Запуск
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Architecture: MVC (Controllers + DAO + DTO)`);
});