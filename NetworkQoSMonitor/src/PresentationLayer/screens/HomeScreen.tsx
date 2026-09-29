import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Typography } from '../Theme';
import { networkObserver, NetworkInfo } from '../../MeasurementEngine/NetworkObserver';
import { getCellularInfo, CellularInfo } from '../../NativeBridge/TelephonyModule';
import { geoService, GeoLocation } from '../../GeoLayer/GeoService';
import { pingEngine, PingResult } from '../../MeasurementEngine/PingEngine';
import { throughputEngine, ThroughputResult } from '../../MeasurementEngine/ThroughputEngine';
import { database } from '../../PersistenceLayer/database';
import Measurement from '../../PersistenceLayer/Measurement';

export default function HomeScreen() {
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [cellularInfo, setCellularInfo] = useState<CellularInfo | null>(null);
  const [throughput, setThroughput] = useState<ThroughputResult | null>(null);
  const [ping, setPing] = useState<PingResult | null>(null);

  // Al montar la pantalla, arrancamos el observer y pedimos permisos
  useEffect(() => {
    networkObserver.start();
    const sub = (info: NetworkInfo) => setNetworkInfo(info);
    networkObserver.addListener(sub);

    // Pedimos permiso de GPS apenas entramos
    geoService.requestPermissions();

    return () => {
      networkObserver.removeListener(sub);
    };
  }, []);

  // Actualizar la info celular (RSSI/Operador) automáticamente al cambiar a datos móviles
  useEffect(() => {
    if (networkInfo?.type === 'cellular') {
      getCellularInfo()
        .then(info => setCellularInfo(info))
        .catch(() => setCellularInfo(null));
    } else {
      setCellularInfo(null);
    }
  }, [networkInfo]);

  const handleConnectToggle = async () => {
    if (isMeasuring) return; // Evita doble toque
    setIsMeasuring(true);
    setPing(null);
    setThroughput(null);

    try {
      // 1. Conseguir GPS
      const location = await geoService.getCurrentLocation().catch(() => ({ latitude: 0, longitude: 0, accuracy: 0 }));
      
      // 2. Conseguir Info de la Antena (Módulo Nativo)
      let cellInfo: CellularInfo = { operatorName: 'N/A', rssi: 0, cellNetworkType: 'N/A' };
      if (networkInfo?.type === 'cellular') {
        cellInfo = await getCellularInfo().catch(() => cellInfo);
      }
      setCellularInfo(cellInfo);

      // 3. Medir Latencia (Múltiples hosts)
      const pingResult = await pingEngine.measureLatency();
      setPing(pingResult);

      // 4. Medir Throughput
      const speeds = await throughputEngine.runFullTest();
      setThroughput(speeds);

      // 5. Guardar en Base de Datos (WatermelonDB)
      await database.write(async () => {
        await database.get<Measurement>('measurements').create(measurement => {
          measurement.timestamp = Date.now();
          measurement.latitude = location.latitude;
          measurement.longitude = location.longitude;
          measurement.networkType = networkInfo?.type || 'UNKNOWN';
          measurement.operatorName = cellInfo.operatorName || 'UNKNOWN';
          measurement.rssi = cellInfo.rssi;
          measurement.pingAvg = pingResult.avg;
          measurement.pingMin = pingResult.min;
          measurement.pingMax = pingResult.max;
          measurement.packetLoss = pingResult.loss;
          measurement.jitter = pingResult.jitter;
          measurement.downloadMbps = speeds.downloadMbps;
          measurement.uploadMbps = speeds.uploadMbps;
        });
      });

    } catch (error) {
      console.warn('Error durante el ciclo de medición:', error);
    } finally {
      setIsMeasuring(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Tarjeta Superior: Red Actual */}
      <View style={styles.headerCard}>
        <Text style={styles.countryText}>
          {networkInfo?.type === 'cellular' ? cellularInfo?.operatorName || 'Red Celular' : 'Red Wi-Fi'}
        </Text>
        <Text style={styles.cityText}>
          Estado: {networkInfo?.isConnected ? 'Conectado' : 'Desconectado'}
        </Text>
        {cellularInfo?.rssi ? <Text style={styles.cityText}>RSSI: {cellularInfo.rssi} dBm</Text> : null}
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.ipText}>Tipo de Red: {networkInfo?.type === 'cellular' ? 'CELULAR' : (networkInfo?.type?.toUpperCase() || '...')}</Text>
      </View>

      {/* Botón Central de Medición */}
      <View style={styles.centerAction}>
        <TouchableOpacity 
          style={styles.connectButton}
          onPress={handleConnectToggle}
          disabled={isMeasuring}
        >
          {isMeasuring ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            <Text style={styles.connectButtonText}>GO</Text>
          )}
        </TouchableOpacity>
        {!isMeasuring && <Text style={styles.tapToConnect}>Tocar para Medir</Text>}
        {isMeasuring && <Text style={styles.tapToConnect}>Midiendo QoS...</Text>}

        {/* Resultados Anteriores (Ahora dentro del bloque naranja) */}
        {throughput && ping && (
          <View style={styles.bottomStatsContainer}>
            <View style={styles.bottomStats}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Descarga</Text>
                <Text style={styles.statValue}>{throughput.downloadMbps} MB/s</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Subida</Text>
                <Text style={styles.statValue}>{throughput.uploadMbps} MB/s</Text>
              </View>
            </View>
            <View style={styles.bottomStats}>
              <View style={styles.statBoxSmall}>
                <Text style={styles.statLabel}>Ping Avg</Text>
                <Text style={styles.statValueSmall}>{ping.avg} ms</Text>
              </View>
              <View style={styles.statBoxSmall}>
                <Text style={styles.statLabel}>Jitter</Text>
                <Text style={styles.statValueSmall}>{ping.jitter} ms</Text>
              </View>
              <View style={styles.statBoxSmall}>
                <Text style={styles.statLabel}>Min/Max</Text>
                <Text style={styles.statValueSmall}>{ping.min}/{ping.max}</Text>
              </View>
              <View style={styles.statBoxSmall}>
                <Text style={styles.statLabel}>Pérdida</Text>
                <Text style={styles.statValueSmall}>{ping.loss}%</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    paddingTop: 20,
  },
  headerCard: {
    backgroundColor: Colors.surface,
    width: '90%',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 40,
  },
  countryText: {
    fontSize: 18,
    color: Colors.textDark,
    fontFamily: Typography.fontFamilyBold,
  },
  cityText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Typography.fontFamily,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  ipText: {
    fontSize: 18,
    color: Colors.primaryDark,
    fontFamily: Typography.fontFamilyBold,
  },
  centerAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 300,
    borderTopRightRadius: 300,
    marginTop: 'auto',
    paddingTop: 50,
  },
  connectButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.primaryDark,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  connectButtonText: {
    fontSize: 36,
    color: Colors.primary,
    fontFamily: Typography.fontFamilyBold,
  },
  tapToConnect: {
    fontSize: 24,
    color: Colors.surface,
    fontFamily: Typography.fontFamilyBold,
  },
  bottomStatsContainer: {
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 20,
    paddingBottom: 20,
  },
  bottomStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
  statBox: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statBoxSmall: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statLabel: {
    color: Colors.textDark,
    fontSize: 12,
    fontFamily: Typography.fontFamily,
  },
  statValue: {
    color: Colors.surface,
    fontSize: 18,
    fontFamily: Typography.fontFamilyBold,
  },
  statValueSmall: {
    color: Colors.surface,
    fontSize: 14,
    fontFamily: Typography.fontFamilyBold,
  },
});
