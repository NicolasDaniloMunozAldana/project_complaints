# 📌 Project Complaints

**Project Complaints** es una aplicación web para la **gestión y visualización de quejas**, desarrollada como parte de un curso de **Ingeniería de Software**.  
Permite listar, analizar estadísticas y gestionar quejas de manera eficiente, con un backend robusto y vistas dinámicas.

---

## 🚀 Características principales

✅ Listado de quejas  
📊 Estadísticas de quejas  
🏠 Página de inicio  
🖥️ Backend con **Express** y **Knex**  
🗄️ Base de datos **MySQL**  
🎨 Vistas con **EJS**  
🧪 Pruebas automatizadas con **Jest** y **Supertest**  

---

## 📂 Estructura del proyecto

```bash
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
🔧 Instalación

Clona el repositorio

git clone <URL-del-repositorio>
cd project_complaints


Instala las dependencias

npm install


Configura el archivo .env con tus credenciales de base de datos MySQL.

Importa la base de datos

mysql -u <usuario> -p <nombre_base_datos> < sources/dbcomplaints.sql

▶️ Uso

Para iniciar el servidor:

node src/index.js


El servidor quedará corriendo en:

http://localhost:3000

🧪 Pruebas

Para ejecutar las pruebas automatizadas:

npm test

📦 Dependencias principales

express

knex

mysql2

ejs

axios

dotenv

👨‍💻 Autores

Luis Enrique Hernández Valbuena

Kevin Johann Jimenez Poveda

Nicolas Danilo Muñoz
