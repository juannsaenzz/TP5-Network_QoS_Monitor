import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const mySchema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'measurements',
      columns: [
        { name: 'timestamp', type: 'number' },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'network_type', type: 'string' }, // WiFi, LTE, GSM, etc.
        { name: 'operator_name', type: 'string', isOptional: true },
        { name: 'rssi', type: 'number' },
        { name: 'ping_avg', type: 'number' },
        { name: 'ping_min', type: 'number' },
        { name: 'ping_max', type: 'number' },
        { name: 'packet_loss', type: 'number' },
        { name: 'jitter', type: 'number' },
        { name: 'download_mbps', type: 'number' },
        { name: 'upload_mbps', type: 'number' },
      ]
    })
  ]
});
