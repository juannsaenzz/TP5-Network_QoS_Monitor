# Backend de Referencia (Throughput Test)

Este directorio contiene el microservicio desarrollado en Node.js/Express que actúa como servidor de referencia para medir la velocidad de red (Throughput) de la aplicación **Network QoS Monitor**.

## ¿Qué hace este backend?
1. **Endpoint de Descarga (`GET /api/throughput/download`)**: Genera y envía en memoria un bloque de datos (payload) fijo de 5 MB de tamaño compuesto por bytes aleatorios. La aplicación móvil descarga este bloque y calcula el tiempo que demoró para obtener los **Megabytes por segundo (MB/s)**.
2. **Endpoint de Subida (`POST /api/throughput/upload`)**: Recibe un archivo masivo (stream de bytes) desde el celular y calcula internamente cuánto tardó en recibirlo por completo, devolviendo la métrica exacta de velocidad de carga hacia la app.

---

## Instrucciones de Despliegue (Deployment)

Hay múltiples formas de levantar este servidor dependiendo del entorno:

### Opción A: Despliegue Local (Desarrollo)
Requisitos: Tener instalado Node.js (v18+).

1. Ingresar a la carpeta del backend:
   ```bash
   cd backend
   ```
2. Instalar las librerías necesarias:
   ```bash
   npm install
   ```
3. Iniciar el servidor:
   ```bash
   npm start
   ```
El servidor quedará corriendo en `http://localhost:3000`.

### Opción B: Despliegue con Docker (Producción aisalda)
Requisitos: Docker instalado.

Si se desea evitar instalar dependencias de Node, se provee un `Dockerfile` listo para usar:
1. Construir la imagen:
   ```bash
   docker build -t qos-backend .
   ```
2. Correr el contenedor:
   ```bash
   docker run -p 3000:3000 qos-backend
   ```

---

## Exposición a Internet para pruebas 4G/5G (Túnel)

Por defecto, si corrés el servidor en tu computadora, la aplicación móvil solo podrá conectarse si **el celular y la computadora están en el mismo Wi-Fi** usando la IP local (ej: `192.168.1.15`).

Sin embargo, el objetivo principal del Trabajo Práctico es medir **Redes Celulares**. Al desconectar el Wi-Fi del teléfono, este pasará a la red 4G y ya no verá tu IP local.

Para solucionar esto sin tener que alquilar un servidor en la nube (AWS/VPS), se debe usar un túnel inverso como **Ngrok**.

**Pasos para conectarlo vía 4G:**
1. Mantener el servidor Node o Docker corriendo en el puerto 3000.
2. En una terminal nueva, iniciar Ngrok:
   ```bash
   ngrok http 3000
   ```
3. Ngrok te entregará una URL pública segura (ej: `https://abcd-12-34.ngrok-free.app`).
4. Entrar al código de la App en `src/MeasurementEngine/ThroughputEngine.ts`, buscar la constante `BASE_URL` y pegar esta nueva URL pública.
5. Volver a compilar la app (`app-release.apk`). Ahora el celular podrá medir velocidad desde la calle.
