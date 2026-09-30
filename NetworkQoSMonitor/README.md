# Network QoS Monitor (App Móvil)

Analizador y visualizador de calidad de red móvil en tiempo real con mapeo de cobertura personal.
Este directorio contiene el código fuente de la aplicación desarrollada en **React Native CLI puro**, con integración de código nativo en **Kotlin** para Android.

> **NOTA IMPORTANTE:** Para la entrega formal, revisión de la arquitectura, diagrama de capas y justificación de decisiones técnicas, por favor refiérase al **Documento Técnico en PDF** ubicado en la raíz del repositorio (`Documento_Tecnico_TP5.md`).

## Arquitectura de la Interfaz (Presentation Layer)

- **Navegación:** Implementada con React Navigation (Bottom Tabs).
- **Mapas (Historial):** Se utiliza `react-native-maps` para renderizar el mapa nativo de Android (Google Maps) con gradientes y marcadores geolocalizados.
- **Gráficos:** Desarrollados 100% nativos usando `Flexbox` puro (sin librerías externas de gráficos) para garantizar el máximo rendimiento (FPS) en la visualización histórica.
- **Iconografía:** Inyectada mediante trazados vectoriales puros (`react-native-svg`) para evitar problemas de enlazado de fuentes en los empaquetados nativos.

## Backend de Throughput

El motor de Throughput (`ThroughputEngine`) requiere comunicarse con un servidor. En la raíz del repositorio se encuentra la carpeta `/backend` con un microservicio Node.js/Express.

Para probar la descarga y subida desde una conexión Celular (4G):
1. Levantar el servidor local (`npm start` en el backend).
2. Exponer el puerto mediante Ngrok (`ngrok http 3000`).
3. Actualizar la variable de entorno o la URL en el código (`ThroughputEngine.ts`) con el enlace público de Ngrok.

## Instalación y Despliegue en Desarrollo

Para ejecutar el código fuente en modo desarrollo conectado al Metro Bundler:

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar servidor de desarrollo
npm start

# 3. En otra consola, compilar e instalar en el celular conectado por USB
npx react-native run-android
```

*(Recuerde que para correr esta aplicación se necesita el entorno de Android Studio completo, dado que se compila código nativo en Kotlin).*

## Solución de Problemas Frecuentes (Troubleshooting)

### Pantalla Roja: "Could not connect to development server" (Metro Bundler)
Si cambiaste de red Wi-Fi (ej: llevaste la computadora y el celular a otra casa para hacer pruebas de campo), la IP local de tu computadora cambió. 
La aplicación en tu celular intentará conectarse a la IP vieja y mostrará una pantalla roja completa.

**Solución rápida en Debug Mode:**
1. Conectá el celular y la computadora al mismo Wi-Fi nuevo.
2. Averiguá la nueva IP local de tu computadora (ej: ejecutando `ipconfig` en Windows).
3. Estando en la pantalla roja del celular, **sacudí el dispositivo** para abrir el Menú de Desarrollo de React Native.
4. Ingresá a **Settings** -> **Debug server host & port for device**.
5. Escribí tu nueva IP seguida del puerto 8081 (Ej: `192.168.1.15:8081`).
6. Presioná **Reload**. La app volverá a cargar normalmente.

*(Para evitar este problema, utilice directamente el archivo APK de producción `app-release.apk` generado para la entrega, el cual funciona 100% desconectado de la PC).*
