import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

export type NetworkInfo = {
  type: string;
  isConnected: boolean;
  isInternetReachable: boolean | null;
  details: any;
};

class NetworkObserver {
  private subscription: NetInfoSubscription | null = null;
  private listeners: ((info: NetworkInfo) => void)[] = [];

  public start() {
    if (this.subscription) return;
    
    // Estado inicial
    NetInfo.fetch().then(this.handleStateChange);

    // Nos suscribimos a los cambios
    this.subscription = NetInfo.addEventListener(this.handleStateChange);
  }

  public stop() {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
    }
  }

  public addListener(callback: (info: NetworkInfo) => void) {
    this.listeners.push(callback);
  }

  public removeListener(callback: (info: NetworkInfo) => void) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  private handleStateChange = (state: NetInfoState) => {
    const info: NetworkInfo = {
      type: state.type,
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      details: state.details, // Acá viene info extra como el SSID en WiFi o la generación en Celular
    };
    
    this.listeners.forEach(listener => listener(info));
  };
}

// Exportamos un singleton para tener una única fuente de verdad en toda la app
export const networkObserver = new NetworkObserver();
