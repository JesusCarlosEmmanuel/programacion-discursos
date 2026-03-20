<div align="center">
  <img src="icons/icon-512x512.png" alt="Logo" width="120" height="120">
  <h1>Programación Discursantes Pro (PWA) 🎙️</h1>
  <p><b>Plataforma de Gestión y Programación de Oradores con Arquitectura Local-First y Sincronización en la Nube</b></p>

  <p>
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  </p>
</div>

---

## 🚀 Sobre el Proyecto

**Programación Discursantes Pro** es una aplicación multiplataforma progresiva (PWA) diseñada para resolver la logística compleja y programación multidireccional de oradores en organizaciones. 

El sistema fue desarrollado desde cero con un enfoque en **Rendimiento Extremo (Zero-bundle), Disponibilidad Offline (Local-First)** y **Experiencia de Usuario (UX/UI)** moderna basada en *Glassmorphism* y Neumorfismo.

Esta plataforma no solo gestiona bases de datos organizacionales e itinerarios, sino que integra motores de reconciliación de datos (OCR), sincronización en tiempo real (Firebase Firestore) y pasarelas de comunicación directa (API de WhatsApp).

## 🧠 Arquitectura Técnica e Innovación

El proyecto se construyó sin utilizar frameworks pesados (como React o Angular) para demostrar un dominio profundo del DOM, APIs del navegador y patrones de diseño en Vanilla JavaScript (ES6+).

### 1. Sistema "Local-First" + "Cloud Sync" (Base de Datos Dual)
La aplicación fue diseñada para funcionar al **100% sin internet**. Todos los datos se gestionan a través de una capa de Contexto (`State.js`) inyectada en IndexedDB/LocalStorage.
- **Modo Seguro:** Cuando un usuario autenticado está en línea, un Web Worker silencioso sincroniza las mutaciones de estado hacia una arquitectura **Serverless (Google Firebase Firestore)** mediante un algoritmo de *Debounce*, garantizando que los datos persistan en múltiples dispositivos de forma instantánea.

### 2. Motor OCR Integrado (Inteligencia Artificial)
Implementación de procesamiento de imágenes y lectura de documentos PDF del lado del cliente utilizando **Tesseract.js** y **PDF.js**. 
- Permite la ingesta masiva de datos mediante el escaneo de itinerarios impresos. Un parser inteligente propio (`parseEngine`) extrae fechas, nombres, horarios y congregaciones mediante Expresiones Regulares (RegEx) avanzadas.

### 3. Progressive Web App (PWA) Nativa
- **Service Workers (`sw.js`):** Interceptores de red (Estrategia *Cache-First* y *Network-Fallback*) que permiten la instalación de la aplicación como software nativo en iOS, Android, Windows y macOS.
- **Manifest.json:** Configuración *Standalone* precisa.

### 4. Automatización de Comunicaciones
Módulo `NotificationService` capaz de compilar payloads dinámicos y convertirlos en Deep-Links de WhatsApp. Permite notificar asíncronamente a oradores u otras áreas sobre confirmaciones, cancelaciones y alertas (ej. *Gap Alerts* a 10 días).

---

## 🌟 Características Destacadas

*   ⚡ **Single Page Application (SPA):** Enrutador (`router.js`) personalizado, transiciones suaves y cero recargas de página.
*   🎨 **UI/UX Premium:** Interfaz de usuario "Modo Oscuro" con tarjetas de cristal (*Glassmorphism*), diseño responsivo (CSS Grid/Flexbox) adaptativo desde dispositivos móviles hasta pantallas de monitorización grandes.
*   🔒 **Autenticación Multi-tenant:** Integración OAuth 2.0 mediante Google Firebase. Reglas estrictas de Firestore impiden que los usuarios lean o escriban en los nodos de otros inquilinos (Seguridad granular de nivel comercial).
*   📊 **Generación de Reportes Dinámicos:** Exportación asíncrona a nivel cliente en formatos PDF, CSV, Excel (SheetJS) y JSON puros para portabilidad de datos (*Data Portability*).
*   🛡️ **Sistema Forense de Errores:** Lógica para prevenir colisiones de programación (oradores duplicados en el mismo mes), protección de pérdida de estado (borradores temporales) e interfaz de limpieza de caché (*Hard Reset*).

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología Utilizada |
| :--- | :--- |
| **Frontend / Lógica** | JavaScript (ES6+ Variables, Promesas, Async/Await, Módulos) |
| **Estilos & Diseño** | CSS3 Vanilla (Variables Root, Glassmorphism, Interacciones Fluidas) |
| **Backend / DB** | Firebase Authentication (OAuth), Cloud Firestore (NoSQL) |
| **Herramientas & API** | Tesseract.js (OCR), PDF.js, SheetJS, html2canvas, jsPDF, Lucide Icons |
| **Deployment** | GitHub Pages (CI/CD nativo), Firebase Security Rules |

---

## 👨‍💻 Autor y Desarrollador

**Jesús Emmanuel Jiménez Carlos**
*Software Engineer | Full-Stack Developer*

Proactivo y orientado a resultados, especializado en la creación de herramientas digitales que resuelven problemas reales del entorno B2B (Business-to-Business) y B2C. Pasión por la optimización de código, escalabilidad y arquitecturas sin servidor (Serverless).

🔗 **Contacto:** [jesusjimenez.computerengineer@gmail.com] 
*(www.linkedin.com/in/jesús-emmanuel-jiménez-carlos-358a20170)*

---
*Si eres un reclutador o cliente, te invito a probar la versión en vivo o a revisar el código fuente. Este proyecto refleja estándares de organización, modularización y solución de problemas arquitectónicos aplicables a grandes plataformas empresariales.*
