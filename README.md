# Daily To-Do

Una aplicación de lista de tareas diarias construida con React + Vite + TypeScript y Supabase como backend.

## ✨ Características

- 🔐 **Autenticación completa** (registro, login, logout) con Supabase Auth
- 📝 **CRUD de tareas**: crear, marcar como completada, eliminar
- 📅 **Lista diaria**: muestra solo las tareas del día actual (zona horaria America/Lima)
- 📆 **Historial**: selector de fecha para ver tareas de días anteriores
- 🔒 **Seguridad**: Row Level Security (RLS) en la base de datos
- 📱 **Diseño responsivo** con Tailwind CSS

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite + TypeScript |
| Estilos | Tailwind CSS |
| Routing | react-router-dom v6 |
| Backend/Auth | Supabase (Auth + PostgreSQL) |
| Deploy | Cloudflare Pages |

## 📋 Requisitos

- Node.js 18+ 
- Cuenta en [Supabase](https://supabase.com) (gratis)
- Cuenta en [Cloudflare Pages](https://pages.cloudflare.com) (opcional, para deploy)

## 🚀 Instalación

### 1. Clonar y configurar el proyecto

```bash
# Clonar o descargar el proyecto
cd todo

# Instalar dependencias
npm install
```

### 2. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta/inicia sesión
2. Crea un nuevo proyecto (elige un nombre y contraseña)
3. Espera a que el proyecto se inicialice (~2 minutos)
4. Ve a **Project Settings** → **API**
5. Copia:
   - `Project URL` (ej: `https://xxxxx.supabase.co`)
   - `anon public` key

### 3. Configurar variables de entorno

```bash
# Copia el archivo de ejemplo
cp .env.example .env
```

Edita `.env` con tus valores:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 4. Ejecutar el schema SQL en Supabase

1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Crea un nuevo query
3. Copia y pega el contenido de `supabase/schema.sql`
4. Ejecuta el script (botón "Run")

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📦 Build para producción

```bash
npm run build
```

Los archivos de producción se generarán en la carpeta `dist/`.

## ☁️ Deploy en Cloudflare Pages

### Opción A: Desde GitHub

1. Sube el proyecto a un repositorio de GitHub
2. Ve a [Cloudflare Pages](https://pages.cloudflare.com)
3. Crea un nuevo proyecto → Conecta tu repositorio
4. Configura:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. En **Environment variables**, agrega:
   - `VITE_SUPABASE_URL`: tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY`: tu anon key
6. Deploy!

### Opción B: Deploy directo

```bash
# Instalar Wrangler CLI
npm install -g wrangler

# Login en Cloudflare
wrangler login

# Build y deploy
npm run build
wrangler pages deploy dist
```

## 🔧 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Genera build de producción |
| `npm run preview` | Preview del build de producción |
| `npm run lint` | Ejecuta ESLint |

## 📁 Estructura del proyecto

```
todo/
├── .env.example          # Template de variables de entorno
├── index.html            # HTML principal
├── package.json          # Dependencias y scripts
├── tailwind.config.js    # Configuración de Tailwind
├── vite.config.ts        # Configuración de Vite
├── supabase/
│   └── schema.sql        # Schema SQL con RLS
└── src/
    ├── main.tsx          # Entry point
    ├── App.tsx           # Router y providers
    ├── index.css         # Estilos globales
    ├── lib/
    │   ├── supabaseClient.ts  # Cliente Supabase
    │   └── todayLima.ts       # Utilidades de fecha
    ├── types/
    │   └── todo.ts       # Tipos TypeScript
    ├── context/
    │   └── AuthContext.tsx    # Contexto de autenticación
    ├── components/
    │   ├── Navbar.tsx         # Barra de navegación
    │   ├── ProtectedRoute.tsx # Ruta protegida
    │   ├── TodoForm.tsx       # Formulario de tarea
    │   └── TodoItem.tsx       # Item de tarea
    └── pages/
        ├── LoginPage.tsx      # Página de login/registro
        └── TodosPage.tsx      # Página principal de tareas
```

## 🔐 Seguridad

La base de datos implementa Row Level Security (RLS) con las siguientes políticas:

- **SELECT**: Solo puedes ver tus propias tareas
- **INSERT**: Solo puedes crear tareas para ti mismo
- **UPDATE**: Solo puedes actualizar tus propias tareas
- **DELETE**: Solo puedes eliminar tus propias tareas

## 🌎 Zona horaria

La aplicación usa la zona horaria **America/Lima** para determinar "hoy". Esto significa que:

- Las tareas creadas se marcan con la fecha actual en Lima
- El filtro de "hoy" muestra tareas de la fecha actual en Lima

## 📝 Licencia

MIT
