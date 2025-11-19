# Facturador AI

Sistema de facturación, inventario y gestión empresarial potenciado por Inteligencia Artificial (Google Gemini), React y Firebase. Diseñado para optimizar los procesos de pequeñas y medianas empresas.

## 🚀 Características Principales

### 🧠 Inteligencia Artificial (Gemini 2.5)
- **Generador de Descripciones:** Crea descripciones de productos atractivas y profesionales automáticamente.
- **Business Insights:** Analiza tus facturas y niveles de inventario para ofrecer consejos estratégicos sobre ventas y reabastecimiento.

### 🧾 Facturación y POS
- Interfaz de facturación intuitiva tipo POS.
- Manejo multimonda (Colones y Dólares) con conversión automática según tipo de cambio.
- Generación de documentos con formato de impresión profesional.
- Simulación de estados de Hacienda (Aceptado, Rechazado, Procesando).
- Cálculo automático de impuestos (IVA).

### 📦 Gestión de Inventario
- Control de stock en tiempo real con deducción automática al facturar.
- Cálculo de márgenes de ganancia (Costo vs Precio Venta).
- Alertas visuales de stock bajo.
- Búsqueda rápida por SKU o nombre.

### 👥 Clientes y Hacienda
- Directorio de clientes con validación de cédulas.
- **Integración API Hacienda:** Consulta automática de datos de contribuyentes (Nombre, Tipo de Cédula, Actividad Económica) mediante API pública.

### 📊 Reportes y Gastos
- Dashboard con gráficos interactivos (Ventas vs Gastos, Flujo de Caja).
- Registro de gastos operativos y costo de ventas automático.
- Reporte de productos más vendidos y utilidad neta.

## 🛠 Tecnologías Utilizadas

- **Frontend:** React 18, TypeScript, Vite.
- **Estilos:** Tailwind CSS, Lucide React (Iconos).
- **Gráficos:** Recharts.
- **Backend / Persistencia:** Firebase (Firestore Database, Authentication).
- **IA:** Google GenAI SDK (Gemini 2.5 Flash).

## ⚙️ Configuración e Instalación

### Prerrequisitos
- Node.js (v18 o superior)
- Una cuenta de Google Cloud (para Gemini API Key)
- Un proyecto en Firebase

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/facturador-ai.git
cd facturador-ai
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configuración de Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto con las siguientes claves:

```env
# Google Gemini AI
API_KEY=tu_api_key_de_google_ai_studio

# Firebase Configuration (Obtener de la consola de Firebase)
FIREBASE_API_KEY=tu_api_key_de_firebase
```

> **Nota:** El archivo `services/firebase.ts` y `vite.config.ts` están configurados para leer estas variables. Asegúrate de que tu proyecto de Firebase tenga habilitado **Authentication** (Email/Password) y **Firestore Database**.

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

### 5. Construir para producción
```bash
npm run build
```

## 📂 Estructura del Proyecto

```
/src
  /components    # Componentes de UI (Dashboard, Facturación, Inventario, etc.)
  /contexts      # Contexto de Autenticación (Firebase Auth)
  /services      # Lógica de negocio (Gemini AI, Firebase Storage, Hacienda API)
  /types         # Definiciones de tipos TypeScript (Interfaces)
  App.tsx        # Enrutamiento principal
  index.tsx      # Punto de entrada
```

## 🛡️ Notas sobre Facturación Electrónica
Este proyecto está configurado por defecto en modo **Sandbox (Pruebas)**.
- No envía documentos reales a Hacienda Producción.
- Simula la firma de XML y la respuesta de la administración tributaria.
- Los certificados .p12 cargados en la configuración son simulados y no se almacenan en el servidor por seguridad en esta demo.

## 📄 Licencia
Este proyecto está bajo la licencia MIT. Siéntete libre de usarlo y modificarlo para tu negocio.
