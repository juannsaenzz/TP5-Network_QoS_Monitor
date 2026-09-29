import TcpSocket from 'react-native-tcp-socket';

export type PingResult = {
  host: string;
  min: number;
  max: number;
  avg: number;
  jitter: number;
  loss: number;
};

class PingEngine {
  
  /**
   * Realiza un "TCP Ping" (mide el tiempo de establecimiento de conexión TCP)
   * Esto es mucho más preciso a nivel de capa de aplicación que usar un fetch().
   */
  private async pingHost(host: string, port: number = 80, timeoutMs: number = 2000): Promise<number> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let isResolved = false;

      const client = TcpSocket.createConnection({ host, port }, () => {
        if (!isResolved) {
          isResolved = true;
          const rtt = Date.now() - startTime;
          client.destroy();
          resolve(rtt);
        }
      });

      client.setTimeout(timeoutMs, () => {
        if (!isResolved) {
          isResolved = true;
          client.destroy();
          reject(new Error('TIMEOUT'));
        }
      });

      client.on('error', (error) => {
        if (!isResolved) {
          isResolved = true;
          client.destroy();
          reject(error);
        }
      });
    });
  }

  public async measureLatency(hosts: string[] = ['8.8.8.8', '1.1.1.1', '208.67.222.222'], attemptsPerHost: number = 2): Promise<PingResult> {
    const latencies: number[] = [];
    let lostPackets = 0;
    const totalAttempts = hosts.length * attemptsPerHost;

    for (const host of hosts) {
      for (let i = 0; i < attemptsPerHost; i++) {
        try {
          const rtt = await this.pingHost(host);
          latencies.push(rtt);
        } catch (error) {
          lostPackets++;
        }
        // Pequeña pausa entre pings para no saturar
        await new Promise(res => setTimeout(res, 100));
      }
    }

    if (latencies.length === 0) {
      return { host: hosts.join(','), min: 0, max: 0, avg: 0, jitter: 0, loss: 100 };
    }

    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const loss = (lostPackets / totalAttempts) * 100;

    // Calculamos el Jitter (variación de la latencia)
    let jitter = 0;
    if (latencies.length > 1) {
      let sumOfDifferences = 0;
      for (let i = 1; i < latencies.length; i++) {
        sumOfDifferences += Math.abs(latencies[i] - latencies[i - 1]);
      }
      jitter = sumOfDifferences / (latencies.length - 1);
    }

    return {
      host: hosts.join(','),
      min: Math.round(min),
      max: Math.round(max),
      avg: Math.round(avg),
      jitter: Math.round(jitter),
      loss: Math.round(loss),
    };
  }
}

export const pingEngine = new PingEngine();
