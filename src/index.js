// Importación de dependencias principales
let express = require("express");
let app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
require('dotenv').config(); // Carga variables desde .env
const path = require('path');


// (Knex removed, now using Sequelize models directly in repositories/services)

// Configuración del motor de vistas y carpeta de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares personalizados
const emailNotifications = require('./middlewares/emailNotifications');
app.use(emailNotifications);

// Rutas
const homeRoutes = require('./routes/homeRoutes');
const complaintsRoutes = require('./routes/complaintsRoutes');
const authRoutes = require('./routes/authRoutes');
const loginRoutes = require('./routes/loginRoutes');

app.use('/', homeRoutes);
app.use('/complaints', complaintsRoutes);
app.use('/auth', authRoutes);
app.use('/', loginRoutes);


// Importar constantes
const { DEFAULT_PORT } = require('./config/constants');

// Exportar la app (para testing con Jest o supertest)
module.exports = app;

// Si se ejecuta directamente, iniciar el servidor
if (require.main === module) {
    const PORT = process.env.PORT || DEFAULT_PORT;
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

