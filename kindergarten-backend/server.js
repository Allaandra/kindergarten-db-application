require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Логирование для красоты
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/groups', require('./src/routes/groupRoutes'));
app.use('/api/employees', require('./src/routes/employeeRoutes'));
app.use('/api/children', require('./src/routes/childRoutes'));
app.use('/api/relatives', require('./src/routes/relativeRoutes'));
app.use('/api/schedule', require('./src/routes/scheduleRoutes'));

app.use('/api/educator', require('./src/routes/educatorRoutes'));

// Запуск
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Architecture: MVC (Controllers + DAO + DTO)`);
});