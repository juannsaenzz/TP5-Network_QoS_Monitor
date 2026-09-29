import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class Measurement extends Model {
  static table = 'measurements';

  @date('timestamp') timestamp!: number;
  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;
  @field('network_type') networkType!: string;
  @field('operator_name') operatorName?: string;
  @field('rssi') rssi!: number;
  @field('ping_avg') pingAvg!: number;
  @field('ping_min') pingMin!: number;
  @field('ping_max') pingMax!: number;
  @field('packet_loss') packetLoss!: number;
  @field('jitter') jitter!: number;
  @field('download_mbps') downloadMbps!: number;
  @field('upload_mbps') uploadMbps!: number;
}
