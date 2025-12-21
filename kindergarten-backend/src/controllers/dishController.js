const { executeQuery } = require('../dao/dbContext');

const getDishes = async (req, res) => {
    const { auth } = req.body;
    try {
        const rows = await executeQuery(auth, "SELECT * FROM dish ORDER BY name");
        res.json({ rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const addDish = async (req, res) => {
    const { auth, name, calories } = req.body;
    try {
        await executeQuery(auth, "INSERT INTO dish (name, calories) VALUES ($1, $2)", [name, calories]);
        res.json({ status: 'success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteDish = async (req, res) => {
    const { auth, id } = req.body;
    try {
        await executeQuery(auth, "DELETE FROM dish WHERE id = $1", [id]);
        res.json({ status: 'success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getDishes, addDish, deleteDish };