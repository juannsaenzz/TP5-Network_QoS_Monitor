import { NativeModules } from 'react-native';

const { TelephonyModule } = NativeModules;

export type CellularInfo = {
  operatorName: string | null;
  rssi: number;
  cellNetworkType: string;
  error?: string;
};

export const getCellularInfo = async (): Promise<CellularInfo> => {
  if (!TelephonyModule) {
    throw new Error('TelephonyModule no está disponible. ¿Recompilaste la app nativa?');
  }
  
  return await TelephonyModule.getCellularInfo();
};
