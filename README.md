# Programación Discursantes (Speaker Scheduler PWA) 🎙️

**Programación Discursantes** es una poderosa *Progressive Web App* (PWA) diseñada profesionalmente para gestionar, visualizar y automatizar la programación de discursos bíblicos entre congregaciones ("Vienen" y "Van").

Combina un diseño moderno con *Glassmorphism*, modo oscuro inmersivo y una arquitectura descentralizada en el navegador (Local Storage) para ofrecer velocidad extrema y disponibilidad 100% offline.

## 🌟 Características Principales

- **Gestión Bi-Direccional:** Control avanzado de oradores asignados a la congregación local (Vienen) y aquellos enviados a apoyar otras congregaciones (Van).
- **Directorio de Maestros:** Base de datos relacional de congregaciones, direcciones, horarios de reuniones y contactos de coordinadores.
- **Autocompletado Inteligente:** Búsqueda en tiempo real mediante *Datalist* y autocompletado de domicilios, horarios y días.
- **Borradores Automáticos:** Los formularios guardan temporalmente tu progreso si haces clic fuera de la ventana por accidente.
- **Notificaciones WhatsApp Multi-Objetivo:** Envío de notificaciones y recordatorios a 10 días, pre-formateadas directamente a WhatsApp para Discursantes, Coordinadores Locales y Coordinadores Anfitriones/Origen.
- **Informes Dinámicos:** Genera reportes tabulares en imagen y texto plano para enviar el cronograma mensual a supervisores por WhatsApp.
- **Prevención de Errores Avanzada:** El sistema alerta proactivamente si se asigna un bosquejo que ya fue impartido en los últimos 3 meses, o si se detecta un fin de semana libre en los próximos 30 días sin discursante asignado.
- **Calendario Visual Mensual:** Vista rápida en bloques mensuales (verde = asignado, rojo = vacío). 

## 📲 Walkthrough y Uso

1. **Instalación PWA**: Abre la URL en Chrome, Safari o tu dispositivo móvil y selecciona "Instalar" o "Agregar a Pantalla de Inicio".
2. **Ajustes y Mi Congregación**: Ve al apartado de **Ajustes** y configura el nombre, domicilio y horario de "Mi Congregación". Esto sirve como origen de datos para las notificaciones.
3. **Poblando el Directorio**: Ingresa al apartado **Congr.** para registrar las congregaciones. Puedes importar via CSV desde Excel para mayor rapidez.
4. **Agendando Discursos**: Entra a **Van** (Nuestros discursantes salientes) o **Vienen** (Discursantes invitados visitantes) y haz click en "Nuevo Evento".
   - Utiliza la lupa del buscador para encontrar la congregación. Sus datos (dirección, horario) se llenarán automáticamente.
   - El sistema detectará si hay duplicados recientes.
5. **Notificando y Recordando**: Después de crear el evento, utiliza los **botones de Notificar (Iconos)** en la cabecera de la ventana para enviar un WhatsApp personalizado al discursante o al respectivo coordinador.
6. **Reportes de Supervisor**: Accede a **Informes**, selecciona el rango de fecha (ej. el próximo mes) y el tipo (Vienen/Van). Dale click a `WhatsApp` y el resumen tabular se abrirá listo para mandarse por la app de mensajería.

## 🛠 Entorno de Desarrollo

- **HTML5 & CSS3 Vanilla** (Sin frameworks complejos, optimizado para carga < 1s).
- **ES6 JavaScript Modular**: Con `router.js` estilo SPA y Arquitectura de Contexto (`state.js`).
- **Service Worker (`sw.js`)**: Caché robusta para permitir el uso totalmente fuera de línea y funcionamiento rápido incluso en redes lentas.
- **Persistencia de Datos**: Uso extensivo de `localStorage` para salvaguardar la privacidad y el uso de la app sin backend de terceros.

---
*Desarrollado para la gestión simplificada, enfocada en la eficiencia y sin distracciones visuales.*
