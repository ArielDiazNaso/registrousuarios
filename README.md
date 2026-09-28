# 🔐 UserHub · Sistema de Gestión de Usuarios (React + SQL)

Sistema completo de gestión y autenticación de usuarios con **dos variantes arquitectónicas de navegación** que comparten la misma lógica central, hooks, servicios y base de datos SQL normalizada hasta la **Tercera Forma Normal (3NF)**.

> ✅ **Checklist de Calidad Cumplido:** Build sin errores · Diagnósticos 0 warnings · Persistencia en localStorage · Dark Mode fluido · Validaciones estrictas · Código modular y documentado.

---

## 🏗️ Arquitectura del Proyecto

```
                        ┌───────────────────────────┐
                        │     App (entry point)     │
                        │  ThemeProvider            │
                        │    └─ AuthProvider        │
                        │         └─ ToastProvider  │
                        └─────────────┬─────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            HOME (Selector)   ╔══ SISTEMA A ══╗   ╔══ SISTEMA B ══╗
                              ║  React Router ║   ║   useState    ║
                              ║  v6+         ║   ║  condicional  ║
                              ╚══════╤═══════╝   ╚══════╤════════╝
                                     │                   │
                              ┌──────┴───────────────────┴──────┐
                              │          Shared Layer           │
                              │  Layout · Views · UI atoms      │
                              │  Forms · useFormValidation      │
                              │  AuthContext · authService      │
                              │  useFetch · useAuth · useTheme  │
                              └──────────────┬──────────────────┘
                                             │
                                 ┌───────────┴───────────┐
                                 │  Axios / Fetch API    │
                                 │  (mock mode + real)   │
                                 └───────────┬───────────┘
                                             │
                                   ┌─────────┴─────────┐
                                   │   PostgreSQL DB   │
                                   │   (11 tablas 3NF) │
                                   └───────────────────┘
```

---

## 🧰 Stack Tecnológico

| Categoría | Tecnología |
|---|---|
| **Framework** | React 18 + Vite 5 (ESM) |
| **Navegación A** | `react-router-dom` v6+ · `ProtectedRoute` HOC · Nested Routes |
| **Navegación B** | `useState` + renderizado condicional · stack de history |
| **Estado Global** | `React Context` x3: `AuthContext`, `ThemeContext`, `ToastContext` |
| **Custom Hooks** | `useAuth`, `useTheme`, `useToast`, `useFetch`, `useFormValidation` |
| **HTTP Client** | `axios` con interceptors (request auth / response 401 refresh) |
| **Validación** | Hook personalizado `useFormValidation` con reglas por campo |
| **Persistencia** | `localStorage` (token, usuario, tema, vista actual) |
| **BDD** | PostgreSQL compatible · Script DDL `schema.sql` (11 tablas + vistas + triggers + seed) |
| **Estilos** | CSS puro modular · Mobile-first · CSS Variables para theming · `prefers-reduced-motion` |
| **Diseño** | Atomic Design · Atoms / Molecules / Organisms / Pages |

---

## 🧭 Sistema A: React Router (Production-Ready)

Ubicación: `src/router/AppRouter.jsx` + `src/router/ProtectedRoute.jsx`

### Rutas configuradas

| Ruta | Acceso | Componente | Descripción |
|---|---|---|---|
| `/` | Público | Redirect | Redirige a `/dashboard` o `/login` según estado |
| `/login` | Público / No-auth | `LoginPage` | Formulario login. Si ya estás autenticado → `/dashboard` |
| `/register` | Público / No-auth | `RegisterPage` | Formulario registro |
| `/dashboard` | 🔒 Protegida | `Dashboard` | Vista principal con estadísticas y feed |
| `/profile` | 🔒 Protegida | `Profile` | Datos personales + cambio de contraseña |
| `/users` | 🔒 Protegida | `UsersPage` | Tabla de usuarios, búsqueda y filtros |
| `/settings` | 🔒 Protegida | `SettingsPage` | Tema, notificaciones, admin-only, danger zone |
| `*` | Público | `NotFound` | 404 personalizado con botón volver |

### Protección de Rutas (`ProtectedRoute`)

```jsx
// HOC que usa Outlet para rutas hijas anidadas
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/profile"   element={<Profile />} />
</Route>

// O wrapper con children
<ProtectedRoute>
  <SensitiveComponent />
</ProtectedRoute>
```

- Muestra `Spinner` durante la hidratación del token.
- Redirige a `/login` preservando `state.from` para retorno post-login.
- Valida `isAuthenticated` y `loading` del `AuthContext`.

---

## 🎛️ Sistema B: Navegación por useState (State-Driven)

Ubicación: `src/components/StateSystem.jsx`

### Funcionamiento

```javascript
const VIEWS = {
  LOGIN: 'login', REGISTER: 'register',
  DASHBOARD: 'dashboard', PROFILE: 'profile',
  USERS: 'users', SETTINGS: 'settings', NOT_FOUND: 'not_found'
};

const [currentView, setCurrentView] = useState('login');
const [viewHistory, setViewHistory] = useState([]); // stack back navegable
```

### Guardias condicionales (equivalente a ProtectedRoute)

```javascript
useEffect(() => {
  if (loading) return;
  // 1. Si no estás autenticado y la vista requiere auth → login
  if (!isAuthenticated && !AUTH_VIEWS.has(currentView)) {
    setCurrentView(VIEWS.LOGIN);
  }
  // 2. Si estás autenticado y entras a login/register → dashboard
  else if (isAuthenticated && AUTH_VIEWS.has(currentView)) {
    setCurrentView(VIEWS.DASHBOARD);
  }
}, [isAuthenticated, loading, currentView]);
```

### Ventajas

- ✅ Control 100% explícito del árbol — sin routing sorpresivo.
- ✅ Pila `viewHistory` navegable (método `goBack()`).
- ✅ Persistencia de la última vista en `localStorage` ('app_view').
- ✅ Sin dependencias externas → bundle más ligero.
- ✅ Ideal para SPAs cerradas, electron apps o kioscos.

---

## 🗄️ Modelo de Datos SQL (3NF)

Script DDL completo: `schema.sql` (PostgreSQL). **11 tablas + 1 vista + 5 triggers + seed data**.

### Diagrama ER (Mermaid)

```mermaid
erDiagram
    ACCOUNT_STATUSES ||--o{ USERS : "status_id"
    ACCOUNT_STATUSES ||--o{ ACCOUNT_STATUS_HISTORY : "old/new"
    ROLES ||--o{ USER_ROLES : "role_id"
    ROLES ||--o{ ROLE_PERMISSIONS : "role_id"
    USERS ||--o{ USER_ROLES : "user_id"
    USERS ||--|| USER_PROFILES : "1:1 separado 3NF"
    USERS ||--o{ USER_SESSIONS : "user_id"
    USERS ||--o{ ACCOUNT_STATUS_HISTORY : "user_id"
    USERS ||--o{ USER_AUDIT_LOGS : "user_id"
    USERS ||--o{ USER_AUDIT_LOGS : "affected_user_id"
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : "permission_id"
    AUDIT_ACTIONS ||--o{ USER_AUDIT_LOGS : "action_id"
    USER_SESSIONS ||--o{ USER_AUDIT_LOGS : "session_id"

    ACCOUNT_STATUSES {
        serial status_id PK
        varchar status_code UK
        varchar status_name
    }
    USERS {
        serial user_id PK
        varchar email UK "CHECK regex email"
        varchar username UK
        varchar password_hash "NUNCA texto plano"
        int failed_login_attempts
        boolean email_verified
        int status_id FK
        timestamps created_at updated_at
    }
    USER_PROFILES {
        serial profile_id PK
        int user_id FK UK "1:1 - 3NF separation"
        varchar first_name
        varchar last_name
        varchar phone_number CHECK
        date date_of_birth
        varchar timezone locale
        text biography
    }
    ROLES {
        serial role_id PK
        varchar role_code UK "SUPER_ADMIN ADMIN MANAGER USER GUEST"
        boolean is_assignable
    }
    PERMISSIONS {
        serial permission_id PK
        varchar permission_code UK "users.read users.create..."
        varchar module
    }
    USER_ROLES {
        serial user_role_id PK
        int user_id FK
        int role_id FK
        "UQ(user_id,role_id)"
    }
    ROLE_PERMISSIONS {
        serial role_permission_id PK
        int role_id FK
        int permission_id FK
    }
    USER_SESSIONS {
        serial session_id PK
        int user_id FK
        varchar session_token UK
        varchar refresh_token
        inet ip_address
        timestamp expires_at
        boolean is_active
    }
    ACCOUNT_STATUS_HISTORY {
        serial history_id PK
        int user_id FK
        int old_status_id FK
        int new_status_id FK
        timestamp changed_at
        int changed_by FK
    }
    AUDIT_ACTIONS {
        serial action_id PK
        varchar action_code UK
        varchar category
    }
    USER_AUDIT_LOGS {
        bigserial audit_id PK
        int user_id FK
        int action_id FK
        int session_id FK
        jsonb old_data new_data
        inet ip_address
        timestamp occurred_at
    }
```

### Cumplimiento de Formas Normales

| FN | Cumplimiento |
|---|---|
| **1NF** | Valores atómicos en todas las columnas. Sin arrays multivalor en campos escalares. PK única por tabla (`serial`). |
| **2NF** | Ningún atributo no-clave depende de una porción de la PK (todas las PKs son simples o las N:M tienen claves independientes + `UNIQUE(compound)`). |
| **3NF** | Sin dependencias transitivas: `roles`, `permissions`, `account_statuses`, `audit_actions` son tablas independientes. Datos de perfil (`user_profiles`) separados de credenciales (`users`). Históricos y auditoría en tablas propias. |

### Seguridad en BBDD

- ✅ `password_hash` (BCrypt recomendado) + `password_salt` — **nunca** texto plano.
- ✅ `CHECK` constraints: regex email, longitud username, teléfono, hash no vacío.
- ✅ `FOREIGN KEY` con políticas `ON DELETE` correctas (usuarios → CASCADE, roles/estados → RESTRICT/SET NULL).
- ✅ `UNIQUE` en email, username, tokens, códigos de estado/rol/permiso.
- ✅ **Consultas parametrizadas**: `authService` usa `axios` que envía datos en body JSON (equivalente a prepared statements). Jamás concatenes strings en SQL.
- ✅ Índices en columnas de búsqueda (`email`, `username`, `status_id`, `created_at`, `occurred_at`…).
- ✅ Trigger automático `updated_at` en tablas editables.
- ✅ Vista denormalizada `v_user_role_permissions` para consultas rápidas de autorización.

### Datos Semilla

- 5 estados de cuenta: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `BANNED`, `PENDING`.
- 5 roles: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `USER`, `GUEST`.
- 11 permisos: `users.*`, `roles.*`, `profile.*`, `system.settings`, `audit.read`, `sessions.manage`.
- 11 acciones de auditoría: login, logout, register, password_reset, status_change, etc.
- Permisos pre-asignados por rol (SUPER_ADMIN = todos, ADMIN = casi todos, etc.).

---

## 📁 Estructura del Proyecto (Clean Architecture)

```
R4/
├── schema.sql                      # DDL SQL normalizado 3NF + seed data
├── package.json                    # Vite + React 18 + Router + Axios
├── vite.config.js                  # Puerto 3000
├── index.html
└── src/
    ├── main.jsx                    # Entry point · StrictMode
    ├── App.jsx                     # Selector Sistema A/B + Providers
    │
    ├── styles/
    │   └── index.css               # ~1000 líneas · CSS vars · Dark Mode · Responsive
    │
    ├── services/                   # ← Capa servicios (API / Business)
    │   └── authService.js          # login register logout getCurrentUser
    │                               # Axios instance · Interceptors 401 refresh
    │                               # Manejo estructurado de errores HTTP
    │
    ├── hooks/                      # ← Custom hooks (Reutilizables)
    │   ├── useAuth.js              # Wrapper tipado de AuthContext
    │   ├── useTheme.js             # Wrapper tipado de ThemeContext
    │   ├── useToast.js             # Wrapper tipado de ToastContext
    │   ├── useFetch.js             # GET/POST con auto-auth + loading/error
    │   └── useFormValidation.js   # Validación cliente · reglas por campo
    │
    ├── context/                    # ← Estado Global (React Context)
    │   ├── AuthContext.jsx         # user/token/isAuth · login/logout/register
    │   │                           # persistencia + chequeo expiración token
    │   ├── ThemeContext.jsx        # light/dark · system preference detect
    │   └── ToastContext.jsx        # Portal toasts · 5 posiciones · 4 tipos
    │
    ├── router/                     # ← SISTEMA A · React Router v6
    │   ├── AppRouter.jsx           # Routes + Layout + redirects
    │   └── ProtectedRoute.jsx      # HOC para rutas privadas + Outlet
    │
    ├── components/
    │   ├── StateSystem.jsx         # ← SISTEMA B · useState routing + guards
    │   │
    │   ├── layout/
    │   │   └── Layout.jsx          # Header + Sidebar responsive + Content
    │   │
    │   ├── ui/                     # ← Atomic Design · Átomos
    │   │   ├── Button.jsx          # 8 variantes · 4 tamaños · loading state
    │   │   ├── Input.jsx           # prefix/suffix · error states · a11y
    │   │   ├── PasswordInput.jsx   # toggle show/hide built-in
    │   │   ├── Select.jsx          # custom caret · a11y
    │   │   ├── Card.jsx            # + StatCard para métricas
    │   │   ├── Spinner.jsx         # + Skeleton + SkeletonCard
    │   │   ├── Modal.jsx           # Portal · ESC key · backdrop click
    │   │   ├── Toast.jsx           # ToastContainer portal por posición
    │   │   └── ThemeToggle.jsx     # Botón cambiar tema claro/oscuro
    │   │
    │   └── forms/                  # ← Molecular (Forms + validación)
    │       ├── LoginForm.jsx       # email pattern + min length password
    │       └── RegisterForm.jsx    # + username, confirm password, terms,
    │                               #   strength meter 5 segmentos
    │
    └── views/                      # ← Organisms / Pages
        ├── HomePage.jsx            # Selector de sistema A o B
        ├── LoginPage.jsx           # Auth split layout + Card
        ├── RegisterPage.jsx
        ├── Dashboard.jsx           # 4 stat cards + activity feed + my-account
        ├── Profile.jsx             # Datos personales + change password (2 forms)
        ├── UsersPage.jsx           # Data table search + filters + badges
        ├── SettingsPage.jsx        # Appearance + notifs + admin + danger
        └── NotFound.jsx            # 404 branded
```

---

## 🚀 Instalación y Ejecución

### Requisitos
- Node.js ≥ 18 (probado con v24.15)
- npm ≥ 9 (probado con v11.12)
- (Opcional) PostgreSQL ≥ 14 para correr `schema.sql`

### Comandos

```bash
# 1. Instalar dependencias
npm install

# 2. Desarrollo (http://localhost:3000)
npm run dev

# 3. Build producción → /dist
npm run build

# 4. Preview build local
npm run preview

# 5. (Futuro) Lint ESLint
npm run lint
```

### Variables de Entorno

Crea `.env.local` en la raíz:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Si no se define, se usa `http://localhost:8080/api` por defecto y el `authService` entra en **modo demo** (mock de respuestas sin necesidad de backend).

### Credenciales de Demo (modo mock)

> 💡 La capa API funciona en modo simulación. Cualquier combinación de email + contraseña ≥ 6 caracteres funciona.  
> Recomendado: `demo@example.com` / `Demo1234`

Para probar error de registro duplicado usa: `existente@test.com` o username `existente`.

---

## 🔐 Seguridad Frontend

| Medida | Implementación |
|---|---|
| **Nunca guardar contraseña en cliente** | ✅ Solo `password_hash` existe en BBDD. En localStorage solo se guarda `token`, `refresh_token`, `expiresAt` y `user` (sin credenciales). |
| **Protección de Rutas** | ✅ `ProtectedRoute` (Router) + Guards condicionales `useEffect` (State). |
| **Refresh Automático** | ✅ Interceptor response 401 → pide refresh → reintenta la petición original. |
| **Expiración de Token** | ✅ `setInterval` en AuthContext revisa cada 60s; si expiró → logout. |
| **Sincronización entre pestañas** | ✅ `storage` event listener: si se borra auth_token en otra pestaña → logout global. |
| **Accesibilidad (a11y)** | ✅ `aria-invalid`, `role="alert"`, `aria-labelledby`, `prefers-reduced-motion`, focus visibles, `Navigate` + redirect semántico. |

---

## 🧪 Hooks: API Reference

### `useFormValidation(initialValues, schema, onSubmit)`

```javascript
const schema = {
  email: {
    required: true, requiredMessage: 'Requerido',
    pattern: /regex/, patternMessage: 'Formato inválido',
    minLength: 3, maxLength: 50,
    custom: (value, allValues) => true || 'Mensaje error'
  }
};

const { values, errors, touched, isSubmitting,
        handleChange, handleBlur, handleSubmit,
        setFieldValue, resetForm, setValues }
  = useFormValidation({ email: '' }, schema, async (values) => { /* submit */ });
```

### `useAuth()`

```javascript
const { user, token, isAuthenticated, loading, error,
        login, register, logout, updateUser,
        hasPermission('profile.update'),
        hasRole('ADMIN'), clearError } = useAuth();
```

### `useTheme()`

```javascript
const { theme, isDark, isLight, mounted,
        toggleTheme, setTheme('light'|'dark'), resetToSystem } = useTheme();
```

### `useToast()`

```javascript
toast.success('Hecho!', { title: 'OK', duration: 4000 });
toast.error('Falló.', { position: 'top-right' });
toast.warning('Aviso');
toast.info('Info');
toast.dismiss(id);
toast.dismissAll();
```

---

## 🎨 Dark Mode (Claro / Oscuro)

Implementado con **CSS Variables** (`:root[data-theme='dark']`):

- Detección automática de preferencia del sistema al primer render (`matchMedia`).
- Persistencia de la elección del usuario en `localStorage` clave `app_theme`.
- `ThemeProvider` escucha cambios dinámicos del SO si el usuario no eligió manualmente.
- `ThemeToggle` atómico disponible en cualquier sitio vía `useTheme()`.
- Switcher global inferior para cambiar de sistema A/B en caliente.

---

## 📱 Diseño Responsive (Mobile-First)

| Breakpoint | Comportamiento |
|---|---|
| **< 640px** (móvil) | Sidebar oculto dentro de drawer con backdrop · Stats y formularios 1 columna. |
| **640px - 1024px** (tablet) | Stats 2 columnas · Forms 2 columnas · Sidebar visible permanente. |
| **≥ 1024px** (desktop) | Auth split layout (hero + card) · Dashboard en 3:2 · Grid 2/3 columnas features. |
| **≥ 1280px** (xl) | Dashboard grid fine-tuning 3fr 2fr + max width 1400px. |

---

## 🎯 Roadmap / Mejoras Futuras

- [ ] Integración real con Express + PostgreSQL (implementar endpoints).
- [ ] Rate limiting en login (reutilizar `failed_login_attempts` y `account_statuses = SUSPENDED`).
- [ ] Verificación real de email con links JWT.
- [ ] `react-query` o SWR para caché y revalidación de `useFetch`.
- [ ] Migración TypeScript de todo el proyecto (ya soportado en Vite).
- [ ] Tests unitarios (Vitest) + E2E (Playwright).

---

## 🧑‍💻 Contribución / Licencia

Proyecto educativo/demo. Estructura pensada como template base para sistemas SaaS.
Usa bajo tu propia responsabilidad. Reporta issues en el repo correspondiente.

---

> **Recordatorio de seguridad en Producción**  
> Sustituye el modo mock de `authService` por endpoints reales con **cookies HttpOnly** para el refresh token. Desactiva `register` abierto si el sistema es interno. Añade CSRF tokens + rate limiting + CSP headers en Vite/Nginx.
