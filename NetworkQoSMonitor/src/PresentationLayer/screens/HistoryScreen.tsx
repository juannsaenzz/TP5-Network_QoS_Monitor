import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Share, FlatList, Modal, LayoutAnimation, Platform, UIManager } from 'react-native';
import { WebView } from 'react-native-webview';
import { Svg, Path } from 'react-native-svg';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { Calendar } from 'react-native-calendars';
import withObservables from '@nozbe/with-observables';
import { database } from '../../PersistenceLayer/database';
import Measurement from '../../PersistenceLayer/Measurement';
import { Colors, Typography } from '../Theme';

interface Props {
  measurements: Measurement[];
}

const HistoryScreenRaw = ({ measurements }: Props) => {
  const [filterType, setFilterType] = useState('TODOS');
  const [isListExpanded, setIsListExpanded] = useState(false);
  
  // Rango de fechas por defecto: Siempre hasta hoy
  const [startDate, setStartDate] = useState(0);
  
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  });
  
  const [showCalendar, setShowCalendar] = useState<'start' | 'end' | null>(null);

  const handleDayPress = (day: any) => {
    const parts = day.dateString.split('-');
    const selected = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    
    if (showCalendar === 'start') {
      selected.setHours(0, 0, 0, 0);
      setStartDate(selected.getTime());
    } else {
      selected.setHours(23, 59, 59, 999);
      setEndDate(selected.getTime());
    }
    setShowCalendar(null);
  };

  const filteredMeasurements = measurements.filter(m => {
    // Filtro de red
    if (filterType === 'WIFI' && m.networkType !== 'wifi') return false;
    if (filterType === 'CELULAR' && (m.networkType === 'wifi' || m.networkType === 'UNKNOWN')) return false;
    
    // Filtro de rango de fechas (Entre fecha de inicio y fecha de fin)
    if (m.timestamp < startDate || m.timestamp > endDate) return false;

    return true;
  });

  const resetFilters = () => {
    setFilterType('TODOS');
    setStartDate(0);
    const end = new Date(); end.setHours(23,59,59,999);
    setEndDate(end.getTime());
  };

  const handleExport = async () => {
    try {
      // Formatear como CSV para cumplir con RF-08
      const header = 'timestamp,latitude,longitude,networkType,operatorName,rssi,pingAvg,jitter,downloadMbps,uploadMbps\n';
      const rows = filteredMeasurements.map(m => {
        return `${m.timestamp},${m.latitude},${m.longitude},${m.networkType},${m.operatorName},${m.rssi},${m.pingAvg},${m.jitter},${m.downloadMbps},${m.uploadMbps}`;
      }).join('\n');
      
      const csvData = header + rows;
      
      await Share.share({
        title: 'Exportación QoS (CSV)',
        message: csvData,
      });
    } catch (error) {
      console.warn('Error al exportar:', error);
    }
  };

  // Generamos el HTML del mapa usando useMemo tal como hicieron en el TP anterior.
  // Solo se regenera si cambia la cantidad de mediciones o el filtro.
  const mapHtml = useMemo(() => {
    const validMeasurements = filteredMeasurements.filter(m => m.latitude !== 0 && m.longitude !== 0);
    
    // Si no hay mediciones, centramos en Buenos Aires
    const centerLat = validMeasurements.length > 0 ? validMeasurements[validMeasurements.length - 1].latitude : -34.6037;
    const centerLng = validMeasurements.length > 0 ? validMeasurements[validMeasurements.length - 1].longitude : -58.3816;

    // Preparamos los datos para leaflet.heat: [lat, lng, intensity]
    // Mapeamos el RSSI (-120 a -50) a una intensidad positiva
    const heatData = validMeasurements.map(m => {
      let weight = 120 + m.rssi;
      if (weight <= 0) weight = 1;
      return `[${m.latitude}, ${m.longitude}, ${weight}]`;
    }).join(',');

    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
          <style>
              body { margin: 0; padding: 0; height: 100vh; width: 100vw; }
              #map { height: 100%; width: 100%; }
          </style>
      </head>
      <body>
          <div id="map"></div>
          <script>
              var map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], 15);
              
              // Volvemos a OpenStreetMap original puro, ya que ahora estamos en un WebView 
              // (y al simular ser un navegador web, OSM no nos bloquea como hacía en el módulo nativo).
              L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  maxZoom: 19,
                  attribution: '© OpenStreetMap'
              }).addTo(map);

              var heatPoints = [${heatData}];
              
              if (heatPoints.length > 0) {
                  var heat = L.heatLayer(heatPoints, {
                      radius: 35,
                      blur: 25,
                      maxZoom: 17,
                      gradient: { 0.4: 'green', 0.65: 'yellow', 1: 'red' }
                  }).addTo(map);
              }
          </script>
      </body>
      </html>
    `;
  }, [filteredMeasurements.length, filterType]); // Dependencias para evitar recargas constantes

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <WebView 
          source={{ html: mapHtml }}
          style={{ flex: 1 }}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          scrollEnabled={false}
        />

        <View style={styles.topControls}>
          {/* Action Row: Limpiar y Exportar */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.clearBtn} onPress={resetFilters}>
              <View style={{ marginRight: 5 }}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={Colors.surface} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M21 2v6h-6" />
                  <Path d="M3 12a9 9 0 1 0 2.81-6.49L21 8" />
                </Svg>
              </View>
              <Text style={styles.clearBtnText}>Limpiar Filtros</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
              <View style={{ marginRight: 5 }}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={Colors.surface} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <Path d="M7 10l5 5 5-5" />
                  <Path d="M12 15V3" />
                </Svg>
              </View>
              <Text style={styles.exportText}>Exportar CSV</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterGroup}>
            <View style={styles.filterRow}>
              {['TODOS', 'WIFI', 'CELULAR'].map(type => (
                <TouchableOpacity 
                  key={type} 
                  style={[styles.filterBtn, filterType === type && styles.filterBtnActive]}
                  onPress={() => setFilterType(type)}
                >
                  <Text style={[styles.filterText, filterType === type && styles.filterTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.filterRow, { marginTop: 10 }]}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <TouchableOpacity style={styles.calendarBtn} onPress={() => setShowCalendar('start')}>
                  <Text style={styles.calendarBtnText}>Desde: {startDate === 0 ? 'SIEMPRE' : new Date(startDate).toLocaleDateString()}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.calendarBtn, { marginLeft: 10 }]} onPress={() => setShowCalendar('end')}>
                  <Text style={styles.calendarBtnText}>Hasta: {new Date(endDate).toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.listContainer, !isListExpanded && { flex: 0, paddingBottom: 30 }]}>
        <TouchableOpacity 
          style={styles.listHeader} 
          activeOpacity={0.7}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsListExpanded(!isListExpanded);
          }}
        >
          <View style={{ marginBottom: 2 }}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isListExpanded ? (
                <Path d="M6 9l6 6 6-6" />
              ) : (
                <Path d="M18 15l-6-6-6 6" />
              )}
            </Svg>
          </View>
          <Text style={styles.listTitle}>Historial de mediciones ({filteredMeasurements.length})</Text>
        </TouchableOpacity>

        {isListExpanded && (
          <FlatList 
            data={filteredMeasurements.slice().reverse()} // Mostrar más recientes primero
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <View style={styles.listRow}>
                  <Text style={styles.listDate}>{new Date(item.timestamp).toLocaleString()}</Text>
                  <Text style={styles.listNetwork}>
                    {item.networkType === 'cellular' ? 'CELULAR' : item.networkType.toUpperCase()} {item.operatorName !== 'UNKNOWN' ? item.operatorName : ''}
                  </Text>
                </View>
                <View style={styles.listRow}>
                  <Text style={styles.listStats}>Ping: {item.pingAvg}ms | {item.rssi} dBm</Text>
                  <Text style={styles.listStats}>⬇ {item.downloadMbps} MB/s | ⬆ {item.uploadMbps} MB/s</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Modal de Calendario */}
      <Modal visible={!!showCalendar} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Calendar
              onDayPress={handleDayPress}
              theme={{
                selectedDayBackgroundColor: Colors.primary,
                todayTextColor: Colors.primaryDark,
                arrowColor: Colors.primary,
              }}
            />
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowCalendar(null)}>
              <Text style={styles.closeModalText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const enhance = withObservables([], () => ({
  measurements: database.collections.get<Measurement>('measurements').query().observe(),
}));

export default enhance(HistoryScreenRaw);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topControls: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  filterGroup: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 5,
  },
  filterBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: 12,
    color: Colors.textMuted,
  },
  filterTextActive: {
    color: Colors.surface,
  },
  exportBtn: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportText: {
    color: Colors.surface,
    fontFamily: Typography.fontFamilyBold,
    fontSize: 12,
  },
  listContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -15,
    padding: 15,
  },
  listHeader: {
    alignItems: 'center',
    paddingBottom: 10,
    width: '100%',
  },
  listTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: 16,
    color: Colors.primaryDark,
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  listDate: {
    fontFamily: Typography.fontFamilyBold,
    color: Colors.textDark,
    fontSize: 12,
  },
  listNetwork: {
    fontFamily: Typography.fontFamily,
    color: Colors.primary,
    fontSize: 12,
  },
  listStats: {
    fontFamily: Typography.fontFamily,
    color: Colors.textMuted,
    fontSize: 12,
  },
  calendarBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
  },
  calendarBtnText: {
    fontFamily: Typography.fontFamilyBold,
    color: Colors.primaryDark,
    fontSize: 12,
  },
  clearBtn: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearBtnText: {
    fontFamily: Typography.fontFamilyBold,
    color: Colors.surface,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 20,
    width: '90%',
  },
  closeModalBtn: {
    marginTop: 15,
    backgroundColor: Colors.background,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeModalText: {
    fontFamily: Typography.fontFamilyBold,
    color: Colors.textDark,
  }
});
