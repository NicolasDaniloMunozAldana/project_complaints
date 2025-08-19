# Project Complaints

Sistema web para la gestión y consulta de quejas dirigidas a entidades públicas, desarrollado con Node.js, Express, EJS y MySQL.

## Características principales
- Registro y consulta de quejas.
- Visualización de estadísticas por entidad pública.
- Protección de vistas con Google reCAPTCHA.
- Interfaz moderna con Bootstrap 5 y DataTables.

## Estructura del proyecto
```
project_complaints/
├── Dockerfile
├── package.json
├── package-lock.json
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
```

## Instalación y ejecución

1. **Clona el repositorio y entra a la carpeta:**
   ```sh
   git clone https://github.com/NicolasDaniloMunozAldana/project_complaints.git
   cd project_complaints
   ```

2. **Instala las dependencias:**
   ```sh
   npm install
   ```

3. **Configura la base de datos:**
   - Crea una base de datos MySQL llamada `dbcomplaints`.
   - Ejecuta el script `sources/dbcomplaints.sql` para crear las tablas y datos iniciales.

4. **Configura las variables de entorno (opcional):**
   - Puedes crear un archivo `.env` para personalizar la conexión a la base de datos.

5. **Inicia la aplicación:**
   ```sh
   npm start
   ```
   Por defecto, la app corre en [http://localhost:3030](http://localhost:3030)

## Uso
- Accede a `/home` para ver las entidades públicas.
- Accede a `/complaints` para consultar las quejas (requiere reCAPTCHA).
- Accede a `/complaints/stats` para ver estadísticas de quejas por entidad.

## Pruebas
Para ejecutar los tests:
```sh
npm test
```

## Docker
Puedes construir y correr la app con Docker:
```sh
docker build -t project_complaints .
docker run -p 8080:8080 project_complaints
```

## Tecnologías utilizadas
- Node.js
- Express
- EJS
- MySQL
- Bootstrap 5
- DataTables
- Google reCAPTCHA

## Autores
- Luis Enrique Hernández Valbuena 
- Kevin Johann Jimenez Poveda 
- Nicolas Danilo Muñoz 
