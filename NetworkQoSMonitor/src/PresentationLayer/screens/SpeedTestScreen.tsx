import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '../Theme';
import { CartesianChart, Line, Area } from 'victory-native';
import withObservables from '@nozbe/with-observables';
import { database } from '../../PersistenceLayer/database';
import Measurement from '../../PersistenceLayer/Measurement';
import { Q } from '@nozbe/watermelondb';

interface Props {
  measurements: Measurement[];
}

const SpeedTestScreenRaw = ({ measurements }: Props) => {
  const [tooltip, setTooltip] = React.useState<string>('Toca una barra para ver detalle exactos');
  
  // Extraemos la medición más reciente para los recuadros
  const latest = measurements.length > 0 ? measurements[measurements.length - 1] : null;

  // Tomamos las últimas 20 mediciones
  const chartData = measurements.slice(-20);
  const maxDownload = Math.max(...chartData.map(m => m.downloadMbps), 1); // evitar div por 0
  const maxPing = Math.max(...chartData.map(m => m.pingAvg), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Última Medición</Text>
      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Descarga</Text>
          <Text style={styles.cardValue}>{latest ? latest.downloadMbps : '--'} MB/s</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Subida</Text>
          <Text style={styles.cardValue}>{latest ? latest.uploadMbps : '--'} MB/s</Text>
        </View>
      </View>

      <View style={styles.metricsCard}>
        <View style={styles.metricColumn}>
          <Text style={styles.cardLabel}>Ping Avg</Text>
          <Text style={styles.cardValueSmall}>{latest ? latest.pingAvg : '--'} ms</Text>
        </View>
        <View style={styles.metricColumn}>
          <Text style={styles.cardLabel}>Jitter</Text>
          <Text style={styles.cardValueSmall}>{latest ? latest.jitter : '--'} ms</Text>
        </View>
        <View style={styles.metricColumn}>
          <Text style={styles.cardLabel}>Min/Max</Text>
          <Text style={styles.cardValueSmall}>{latest ? `${latest.pingMin}/${latest.pingMax}` : '--/--'}</Text>
        </View>
        <View style={styles.metricColumn}>
          <Text style={styles.cardLabel}>Pérdida</Text>
          <Text style={styles.cardValueSmall}>{latest ? latest.packetLoss : '--'} %</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 10, marginBottom: 5 }]}>Historial de la Sesión</Text>
      <Text style={styles.tooltipText}>{tooltip}</Text>

      {/* Gráficos Puros en Flexbox (A prueba de fallos) */}
      {chartData.length > 0 ? (
        <View style={styles.pureChartsContainer}>
          
          {/* Gráfico de Download */}
          <View style={styles.chartBox}>
            <Text style={styles.chartTitle}>Throughput (MB/s)</Text>
            <View style={styles.barContainer}>
              {chartData.map((m, i) => {
                // Si hubo un error y es 0, le damos 1% de altura mínima para que no desaparezca la barra
                let heightPct = (m.downloadMbps / maxDownload) * 100;
                if (heightPct < 1) heightPct = 1;
                
                return (
                  <TouchableOpacity 
                    key={`dl-${m.id}-${i}`} 
                    style={styles.barWrapper}
                    activeOpacity={0.6}
                    onPress={() => setTooltip(`Descarga: ${m.downloadMbps} MB/s | Subida: ${m.uploadMbps} MB/s`)}
                  >
                    <View style={[styles.bar, { height: `${heightPct}%`, backgroundColor: m.downloadMbps === 0 ? 'red' : Colors.primary }]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Gráfico de Ping */}
          <View style={styles.chartBox}>
            <Text style={styles.chartTitle}>Latencia (ms)</Text>
            <View style={styles.barContainer}>
              {chartData.map((m, i) => {
                let heightPct = (m.pingAvg / maxPing) * 100;
                if (heightPct < 1) heightPct = 1;

                return (
                  <TouchableOpacity 
                    key={`pg-${m.id}-${i}`} 
                    style={styles.barWrapper}
                    activeOpacity={0.6}
                    onPress={() => setTooltip(`Ping: ${m.pingAvg} ms | Jitter: ${m.jitter} ms`)}
                  >
                    <View style={[styles.bar, { height: `${heightPct}%`, backgroundColor: m.pingAvg === 0 ? 'red' : Colors.primaryDark }]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

        </View>
      ) : (
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartText}>Aún no hay mediciones suficientes.</Text>
        </View>
      )}
    </View>
  );
}

const enhance = withObservables([], () => ({
  measurements: database.collections
    .get<Measurement>('measurements')
    .query(Q.sortBy('timestamp', Q.asc))
    .observe(),
}));

export default enhance(SpeedTestScreenRaw);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: 18,
    color: Colors.primaryDark,
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginLeft: 5,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardLabel: {
    color: Colors.textDark,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: 14,
  },
  cardValue: {
    color: Colors.primary,
    fontFamily: Typography.fontFamilyBold,
    fontSize: 22,
    marginTop: 5,
  },
  metricsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  metricColumn: {
    alignItems: 'center',
  },
  cardValueSmall: {
    color: Colors.textDark,
    fontFamily: Typography.fontFamilyBold,
    fontSize: 16,
    marginTop: 5,
  },
  pureChartsContainer: {
    flex: 1,
    width: '100%',
  },
  chartBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  chartTitle: {
    fontFamily: Typography.fontFamilyBold,
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  barContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  chartPlaceholder: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartText: {
    color: Colors.textMuted,
    fontFamily: Typography.fontFamily,
  },
  tooltipText: {
    fontFamily: Typography.fontFamilyBold,
    color: Colors.primaryDark,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    overflow: 'hidden'
  }
});
