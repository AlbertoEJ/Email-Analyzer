# Email Security Analyzer

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma&logoColor=white)
![Gmail API](https://img.shields.io/badge/Gmail_API-v1-EA4335?logo=gmail&logoColor=white)

Aplicacion full-stack para el analisis de seguridad de correos electronicos via Gmail. Utiliza multiples motores de analisis (headers, URLs, contenido con LLM, archivos adjuntos) para detectar phishing, ingenieria social y otras amenazas.

Proyecto de tesis - Universidad

## Arquitectura

```
email-analyzer/
├── backend/          # API REST (Express + Prisma + SQLite)
│   ├── src/
│   │   ├── config/         # Variables de entorno, base de datos
│   │   ├── controllers/    # Endpoints (emails, dashboard, reports, auth)
│   │   ├── middleware/     # Auth, error handling, rate limiting
│   │   ├── routes/         # Definicion de rutas
│   │   ├── services/       # Logica de negocio
│   │   │   ├── analyzer.service.ts           # Orquestador principal
│   │   │   ├── header-analyzer.service.ts    # SPF/DKIM/DMARC
│   │   │   ├── url-analyzer.service.ts       # Safe Browsing + VirusTotal
│   │   │   ├── content-analyzer.service.ts   # LLM via OpenRouter
│   │   │   ├── attachment-analyzer.service.ts # Analisis de adjuntos
│   │   │   ├── threat-scorer.service.ts      # Score compuesto
│   │   │   ├── scan-progress.service.ts      # Progreso en tiempo real
│   │   │   ├── gmail.service.ts              # Gmail API client
│   │   │   └── scheduler.service.ts          # Escaneos automaticos (cron)
│   │   └── utils/          # Parser de emails, logger
│   └── prisma/             # Schema y migraciones
└── frontend/         # SPA (React + Vite + Tailwind)
    └── src/
        ├── api/            # Cliente HTTP (Axios)
        ├── components/     # Componentes UI
        │   ├── layout/     # Sidebar, Header (responsive)
        │   ├── dashboard/  # Cards, graficos (Recharts)
        │   ├── emails/     # Lista, detalle, filtros, progreso
        │   └── analysis/   # Vistas de cada tipo de analisis
        ├── hooks/          # React Query hooks
        ├── pages/          # Paginas principales
        └── context/        # AuthContext (Google OAuth)
```

## Funcionalidades

### Analisis de seguridad multi-capa
- **Headers (SPF/DKIM/DMARC)** - Validacion de autenticacion del remitente
- **URLs** - Verificacion contra Google Safe Browsing y VirusTotal
- **Contenido (LLM)** - Deteccion de phishing e ingenieria social con IA
- **Adjuntos** - Analisis de tipos sospechosos y hashes con VirusTotal

### Score de amenaza compuesto
Cada email recibe un score de 0-100 basado en pesos ponderados:
| Componente | Peso |
|------------|------|
| Headers    | 20%  |
| URLs       | 30%  |
| Contenido  | 30%  |
| Adjuntos   | 20%  |

Niveles: `safe` (0-15) | `low` (16-35) | `medium` (36-55) | `high` (56-75) | `critical` (76-100)

### Escaneo con progreso en tiempo real
- El scan se ejecuta en background (no bloquea la UI)
- Polling cada 1s muestra: barra de progreso, email actual, reintentos, amenazas encontradas
- Retry automatico con exponential backoff para errores 429/502/503

### Dashboard interactivo
- Cards de resumen (total emails, amenazas, score promedio, ultimo scan)
- Grafico de tendencias de amenazas (30 dias)
- Distribucion por nivel de amenaza (pie chart)

### UI responsive
- Desktop: sidebar fija + tabla de emails
- Mobile: hamburger menu + tarjetas de emails

### Otras funcionalidades
- Autenticacion via Google OAuth 2.0
- Escaneos automaticos programados (cron configurable)
- Exportacion de reportes JSON
- Filtrado y busqueda de emails
- Paginacion

## Requisitos previos

- **Node.js** >= 18
- **npm** >= 9
- Cuenta de Google Cloud con Gmail API habilitada
- Credenciales OAuth 2.0 configuradas

### API Keys (opcionales pero recomendadas)
| Servicio | Para que |
|----------|----------|
| [Google Safe Browsing](https://developers.google.com/safe-browsing) | Verificacion de URLs maliciosas |
| [VirusTotal](https://www.virustotal.com/gui/my-apikey) | Analisis de URLs y hashes de adjuntos |
| [OpenRouter](https://openrouter.ai/keys) | Analisis de contenido con LLM |

## Instalacion

```bash
# Clonar repositorio
git clone https://github.com/<tu-usuario>/email-analyzer.git
cd email-analyzer

# Instalar dependencias (monorepo con workspaces)
npm install

# Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus credenciales (ver seccion siguiente)

# Crear base de datos y aplicar migraciones
npm run db:migrate

# Iniciar en desarrollo (backend + frontend simultaneos)
npm run dev
```

El backend corre en `http://localhost:3001` y el frontend en `http://localhost:5173`.

## Variables de entorno

Crear `backend/.env` con:

```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Google OAuth 2.0 (REQUERIDO)
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/callback

# Clave de encriptacion para tokens OAuth (64 caracteres hex)
# Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=tu-clave-de-64-caracteres-hex

# Google Safe Browsing API (opcional)
SAFE_BROWSING_API_KEY=

# VirusTotal API (opcional)
VIRUSTOTAL_API_KEY=

# OpenRouter - Analisis de contenido con LLM (opcional)
OPENROUTER_API_KEY=
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free

# Escaneo automatico (cron, default: cada 6 horas)
SCAN_CRON=0 */6 * * *
```

## Scripts disponibles

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Inicia backend y frontend en modo desarrollo |
| `npm run dev:backend` | Solo el backend |
| `npm run dev:frontend` | Solo el frontend |
| `npm run build` | Build de produccion |
| `npm run db:migrate` | Ejecutar migraciones de Prisma |
| `npm run db:generate` | Regenerar cliente de Prisma |

## Stack tecnologico

### Backend
- **Express** - Servidor HTTP
- **Prisma** - ORM con SQLite
- **googleapis** - Cliente oficial de Gmail API
- **OpenAI SDK** - Comunicacion con OpenRouter (LLM)
- **Zod** - Validacion de variables de entorno
- **Pino** - Logger estructurado
- **node-cron** - Escaneos programados
- **Cheerio** - Parsing de HTML en emails
- **Helmet** - Headers de seguridad
- **express-rate-limit** - Proteccion contra abuso

### Frontend
- **React 19** - UI library
- **Vite** - Bundler y dev server
- **Tailwind CSS** - Estilos utility-first
- **TanStack React Query** - Manejo de estado del servidor
- **React Router** - Navegacion SPA
- **Recharts** - Graficos interactivos
- **Lucide React** - Iconos
- **Axios** - Cliente HTTP
- **date-fns** - Formateo de fechas

## Configuracion de Google Cloud

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un proyecto nuevo
3. Habilitar la **Gmail API**
4. Configurar **OAuth consent screen** (tipo: External)
   - Agregar scope: `https://www.googleapis.com/auth/gmail.readonly`
5. Crear **credenciales OAuth 2.0** (tipo: Web Application)
   - Authorized redirect URI: `http://localhost:3001/api/auth/callback`
6. Copiar Client ID y Client Secret al `.env`

## Licencia

Este proyecto esta licenciado bajo [AGPL-3.0](LICENSE).
