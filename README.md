Project Complaints
Este proyecto es una aplicación web para la gestión y visualización de quejas, desarrollada como parte de un curso de Ingeniería de Software.

Características principales
Listado de quejas
Estadísticas de quejas
Página de inicio
Backend con Express y Knex
Base de datos MySQL
Vistas con EJS
Pruebas con Jest y Supertest
Estructura del proyecto
project_complaints/
├── package.json
├── package-lock.json
├── .env
├── .gitignore
├── sources/
│   ├── dbcomplaints.sql
│   └── images/
├── src/
│   └── index.js
├── test/
│   └── app.test.js
├── views/
│   ├── complaints_list.ejs
│   ├── complaints_stats.ejs
│   └── home.ejs
└── .github/
    └── workflows/
Instalación
Clona el repositorio.
Instala las dependencias:
npm install
Configura el archivo .env con tus credenciales de base de datos MySQL.
Importa el archivo sources/dbcomplaints.sql en tu base de datos.
Uso
Para iniciar el servidor:

node src/index.js
Pruebas
Para ejecutar las pruebas:

npm test
Dependencias principales
express
knex
mysql2
ejs
axios
dotenv
Autor
Luis Enrique Hernández Valbuena
Kevin Johann Jimenez Poveda
Nicolas Danilo Muñoz
