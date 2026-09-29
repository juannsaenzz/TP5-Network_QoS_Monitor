# Network QoS Monitor

Analizador y visualizador de calidad de red móvil en tiempo real con mapeo de cobertura personal.
Proyecto desarrollado para la cátedra de Desarrollo de Aplicaciones Móviles.

## Arquitectura del Proyecto

El sistema está dividido en 5 capas claramente delimitadas para separar la adquisición de datos de la interfaz de usuario:

1. **Native Bridge (`/src/NativeBridge`)**: 
   - Módulos en Kotlin (Android) y Swift (iOS) que exponen la información profunda de las antenas mediante el `TelephonyManager`.
2. **Measurement Engine (`/src/MeasurementEngine`)**:
   - Sondas creadas en TypeScript Puro.
   - `PingEngine`: Usa TCP Sockets (`react-native-tcp-socket`) para medir latencia y jitter sin ser bloqueado por las políticas HTTP.
   - `ThroughputEngine`: Mide velocidad de carga y descarga contra el backend en Node.js adjunto.
3. **Geo Layer (`/src/GeoLayer`)**:
   - Implementa `@react-native-community/geolocation` para triangular la posición GPS de cada lectura, operando en alta precisión y evitando crasheos nativos en dispositivos modernos.
4. **Persistence Layer (`/src/PersistenceLayer`)**:
   - Construido sobre **WatermelonDB** y adaptadores SQLite.
   - Provee un entorno reactivo: las lecturas de background disparan renders en la UI sin necesidad de hacer polls o usar reducers complejos.
5. **Presentation Layer (`/src/PresentationLayer`)**:
   - Patrón de navegación tipo Drawer (`@react-navigation/drawer`).
   - Pantalla de Mapas de Calor inyectada vía WebView usando **Leaflet**, OpenStreetMap y CartoDB para garantizar renderizado multiplataforma sin depender de Google Play Services.
   - Gráficos de líneas con series temporales usando `victory-native` (Skia).

## Backend de Throughput

En la carpeta `/backend` se encuentra un microservicio Node.js/Express.
Para correrlo:
```bash
cd backend
npm install
npm start
```
*Nota: Si se prueba desde un dispositivo físico con red 4G, es necesario exponer este servidor mediante ngrok y actualizar la URL en `ThroughputEngine.ts`.*

## Limitaciones Conocidas y Decisiones de Diseño

- **iOS y RSSI:** Apple restringe el acceso directo a la potencia de la señal (RSSI) en dBm a través de sus APIs públicas (CoreTelephony). En iOS el módulo devuelve `0` para evitar un rechazo en el App Store. En Android funciona nativamente.
- **Background Fetch:** Las tareas en background dictadas por iOS/Android operan con un mínimo de 15 minutos (por optimización de batería del SO). No se puede forzar un ping cada 1 minuto de manera determinista con la app cerrada.
- **TCP Sockets para Ping:** En React Native no existe soporte nativo de bajo nivel para paquetes ICMP (Ping tradicional). Se implementó un socket TCP que emula la latencia RTT midiendo los tiempos de handshake.
- **Topología de Red y Ngrok (Throughput Test):** El backend de medición de velocidad (Node.js) se ejecuta en la red de área local (LAN) del desarrollador. Al desconectar el Wi-Fi para realizar pruebas sobre red celular (4G/5G), el dispositivo móvil adquiere una IP pública del operador y pierde visibilidad de la IP privada del backend (por restricciones de NAT). Para solucionar esto sin incurrir en costos de servidores en la nube (AWS/DigitalOcean), se implementó un túnel inverso con **Ngrok**. Esto expone el servidor local a Internet mediante una URL pública, permitiendo que el celular haga los tests de Throughput sobre 4G. *(Nota: Esto implica que la velocidad máxima reportada en el test está limitada por el ancho de banda del túnel de Ngrok, y no representa el límite físico de la antena celular).*
- **Mapas y Google Maps API Key:** Durante el desarrollo, `react-native-maps` en Android 14 exigía obligatoriamente una API Key activa con facturación de Google Cloud para renderizar tiles, provocando fondos negros o bloqueos del módulo. Decisión de diseño: Se migró la pantalla del Historial a un motor inyectado de **Leaflet + WebView** (simulando comportamiento de navegador web) usando tiles gratuitos de CartoDB y `leaflet.heat`. Esto garantizó un despliegue sin vendor lock-in ni costos asociados.
- **Servicio de GPS:** Se descartó `react-native-geolocation-service` a favor de `@react-native-community/geolocation` porque la primera provocaba *crasheos nativos silenciosos* por conflictos con las versiones de `play-services-location` instaladas de fábrica en dispositivos de la marca Samsung.

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

*(Nota: Para evitar esto en la presentación final de la cátedra, se debe generar un Release APK con `cd android && ./gradlew assembleRelease`, que empaqueta el JS nativamente y permite usar la app 100% desconectada de la PC).*

## Instalación y Despliegue

```bash
npm install
npx react-native run-android
```
