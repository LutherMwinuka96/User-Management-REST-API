require('dotenv').config();
const express = require('express');
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const pool = require('./config/db');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: 'User Management REST API is running', status: 'success' });
});

app.use('/api/users', userRoutes);
app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  pool.getConnection()
    .then((connection) => {
      connection.release();
      app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
    })
    .catch((error) => {
      console.error('Could not connect to MySQL. Check the database service and DB_* environment variables.', error);
      process.exitCode = 1;
    });
}

module.exports = app;
