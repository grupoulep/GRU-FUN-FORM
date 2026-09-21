# Sistema de Encuestas IULEP

Plataforma institucional de gestión y aplicación de encuestas del **Instituto Universitario Latinoamericano de Posgrado (IULEP)** con integración en la nube con Firebase Firestore y sincronización en tiempo real.

## 🚀 Requisitos previos

- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada, 20 LTS preferente)
- [npm](https://www.npmjs.com/) (incluido con Node.js)

## 📦 Instalación y ejecución local

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd <NOMBRE_DEL_REPOSITORIO>
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación se abrirá en [http://localhost:3000](http://localhost:3000).

4. **Compilar para producción:**
   ```bash
   npm run build
   ```
   Los archivos estáticos optimizados se generarán en la carpeta `dist/`.

5. **Previsualizar la compilación de producción:**
   ```bash
   npm run preview
   ```

6. **Verificar tipos y código (Lint):**
   ```bash
   npm run lint
   ```

## ⚙️ Configuración y Despliegue en GitHub

El repositorio incluye flujos automatizados de **GitHub Actions**:
- `.github/workflows/ci.yml`: Valida automáticamente que el código compile y pase las revisiones de TypeScript en cada `push` o `pull request`.
- `.github/workflows/deploy.yml`: Despliega automáticamente la aplicación en **GitHub Pages** al hacer push a la rama `main` o `master`.

### Para activar GitHub Pages en el repositorio:
1. Ve a tu repositorio en GitHub.
2. Ingresa a **Settings** > **Pages**.
3. En la sección **Build and deployment** > **Source**, selecciona **GitHub Actions**.
4. En cada push a `main`, la aplicación se compilará y desplegará automáticamente.
