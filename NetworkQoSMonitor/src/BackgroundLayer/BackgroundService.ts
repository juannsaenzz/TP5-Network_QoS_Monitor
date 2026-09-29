import BackgroundFetch from 'react-native-background-fetch';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { database } from '../PersistenceLayer/database';
import Measurement from '../PersistenceLayer/Measurement';
import { pingEngine } from '../MeasurementEngine/PingEngine';
import { geoService } from '../GeoLayer/GeoService';
import { getCellularInfo } from '../NativeBridge/TelephonyModule';

// Lógica pura de la tarea en segundo plano
export const performBackgroundMeasurement = async (taskId: string) => {
  console.log('[BackgroundFetch] Tarea iniciada: ', taskId);

  try {
    // 1. Tomamos latencia contra 3 hosts
    const pingResult = await pingEngine.measureLatency();
    
    // 2. Tomamos GPS (puede fallar si no hay permiso "Allow all the time" en Android 11+,
    // pero manejamos el error devolviendo 0)
    const location = await geoService.getCurrentLocation().catch(() => ({ latitude: 0, longitude: 0 }));
    
    // 3. Tomamos info de red (asumimos que si no falla, estamos en celular)
    const cellInfo = await getCellularInfo().catch(() => ({ operatorName: 'UNKNOWN', rssi: 0, cellNetworkType: 'UNKNOWN' }));

    // 4. Guardamos en WatermelonDB
    await database.write(async () => {
      await database.get<Measurement>('measurements').create(measurement => {
        measurement.timestamp = Date.now();
        measurement.latitude = location.latitude;
        measurement.longitude = location.longitude;
        measurement.networkType = cellInfo.cellNetworkType;
        measurement.operatorName = cellInfo.operatorName;
        measurement.rssi = cellInfo.rssi;
        measurement.pingAvg = pingResult.avg;
        measurement.pingMin = pingResult.min;
        measurement.pingMax = pingResult.max;
        measurement.packetLoss = pingResult.loss;
        measurement.jitter = pingResult.jitter;
        measurement.downloadMbps = 0; // En background no quemamos datos bajando 5MB
        measurement.uploadMbps = 0;
      });
    });

    // 5. RF-08: Motor de Notificaciones / Alertas
    // Si el ping es malísimo (> 300ms) o la señal RSSI es muy pobre (< -105 dBm)
    if (pingResult.avg > 300 || (cellInfo.rssi !== 0 && cellInfo.rssi < -105)) {
      await sendDegradationNotification(pingResult.avg, cellInfo.rssi);
    }

    // Le avisamos al OS que terminamos exitosamente
    BackgroundFetch.finish(taskId);
  } catch (error) {
    console.error('[BackgroundFetch] Error en la tarea:', error);
    BackgroundFetch.finish(taskId);
  }
};

const sendDegradationNotification = async (ping: number, rssi: number) => {
  // Pide permiso al usuario (en Android 13+ y iOS)
  await notifee.requestPermission();

  // Crea el canal (obligatorio en Android)
  const channelId = await notifee.createChannel({
    id: 'qos_alerts',
    name: 'QoS Degradation Alerts',
    importance: AndroidImportance.HIGH,
  });

  // Dispara la notificación local
  await notifee.displayNotification({
    title: '⚠️ Red Degradada',
    body: `Calidad de red pobre detectada. Ping: ${ping.toFixed(0)}ms | Señal: ${rssi}dBm`,
    android: {
      channelId,
      smallIcon: 'ic_launcher', // Asegurate de tener este icono o usa el por defecto
    },
  });
};

// Clase utilitaria para arrancar el servicio desde la UI
export class BackgroundService {
  public async configure() {
    const status = await BackgroundFetch.configure(
      {
        minimumFetchInterval: 15, // El mínimo soportado por iOS/Android es 15 minutos
        stopOnTerminate: false,   // Sigue corriendo aunque maten la app (Android)
        enableHeadless: true,     // Activa la tarea headless
        startOnBoot: true,        // Arranca al reiniciar el teléfono (Android)
      },
      async (taskId) => {
        await performBackgroundMeasurement(taskId);
      },
      (taskId) => {
        // Callback de Timeout (si el OS nos está por matar la tarea porque tardamos mucho)
        console.warn('[BackgroundFetch] TIMEOUT:', taskId);
        BackgroundFetch.finish(taskId);
      }
    );

    console.log('[BackgroundFetch] Configurado con status:', status);
  }
}

export const backgroundService = new BackgroundService();
