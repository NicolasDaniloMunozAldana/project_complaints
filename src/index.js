// Importación de dependencias principales
let express = require("express");
let app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
require('dotenv').config(); // Carga variables desde .env
const path = require('path');
const axios = require('axios');

// Configuración de la base de datos
const knex = require('./config/db');
app.locals.knex = knex;

// Configuración del motor de vistas y carpeta de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares personalizados
const emailNotifications = require('./middlewares/emailNotifications');
app.use(emailNotifications);

// Rutas
const homeRoutes = require('./routes/homeRoutes');
const complaintsRoutes = require('./routes/complaintsRoutes');

app.use('/', homeRoutes);
app.use('/complaints', complaintsRoutes);

// Ruta para verificar el token de Google reCAPTCHA (v2)
app.post('/verify-captcha', async (req, res) => {
    try {
        const token = req.body.token;
        if (!token) {
            return res.status(400).json({ success: false, error: 'Token no enviado' });
        }
        const secretKey = process.env.RECAPTCHA_SECRET;
        const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
            params: {
                secret: secretKey,
                response: token,
                remoteip: req.ip
            }
        });
        const data = response.data;
        console.log('Respuesta de Google reCAPTCHA v2:', data);
        if (data.success) {
            res.json({ success: true, message: 'Verificación exitosa' });
        } else {
            res.json({
                success: false,
                error: 'Verificación fallida',
                'error-codes': data['error-codes']
            });
        }
    } catch (err) {
        console.error('Error en verify-captcha:', err);
        res.status(500).json({ success: false, error: 'Error interno en verify-captcha' });
    }
});

// Exportar la app (para testing con Jest o supertest)
module.exports = app;

// Si se ejecuta directamente, iniciar el servidor
if (require.main === module) {
    const PORT = process.env.PORT || 3030;
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

