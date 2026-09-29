export type ThroughputResult = {
  downloadMbps: number;
  uploadMbps: number;
};

class ThroughputEngine {
  // Túnel Ngrok para permitir pruebas tanto en Wi-Fi como en 4G/Celular
  private baseUrl = 'https://extrude-arguable-defog.ngrok-free.dev'; 
  
  // 5MB exactos (tiene que coincidir con el servidor)
  private readonly PAYLOAD_SIZE_BYTES = 5 * 1024 * 1024; 

  public setBackendUrl(url: string) {
    this.baseUrl = url;
  }

  /**
   * Mide la velocidad de descarga bajando el payload de 5MB
   */
  public async measureDownload(): Promise<number> {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.baseUrl}/download`);
      if (!response.ok) throw new Error('Network response was not ok');
      
      // Leemos el buffer para forzar la descarga completa
      const blob = await response.blob();
      const endTime = Date.now();
      
      const durationInSeconds = (endTime - startTime) / 1000;
      if (durationInSeconds === 0) return 0;

      // Calculamos Mbps (Megabits por segundo)
      const bits = blob.size * 8;
      const megabits = bits / 1_000_000;
      
      return megabits / durationInSeconds;
    } catch (error) {
      console.warn('Error en test de descarga:', error);
      return 0; // 0 Mbps = fallo
    }
  }

  /**
   * Mide la velocidad de subida enviando un payload de 5MB
   */
  public async measureUpload(): Promise<number> {
    try {
      // Usamos un string de 2MB en lugar de Uint8Array para evitar saturar y crashear el bridge de React Native
      const uploadData = '1'.repeat(2 * 1024 * 1024);

      const startTime = Date.now();
      
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: uploadData,
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const endTime = Date.now();
      const durationInSeconds = (endTime - startTime) / 1000;
      if (durationInSeconds === 0) return 0;

      const bits = (2 * 1024 * 1024) * 8;
      const megabits = bits / 1_000_000;
      
      return megabits / durationInSeconds;
    } catch (error) {
      console.warn('Error en test de subida:', error);
      return 0;
    }
  }

  /**
   * Corre el test completo
   */
  public async runFullTest(): Promise<ThroughputResult> {
    const downloadMbps = await this.measureDownload();
    const uploadMbps = await this.measureUpload();

    return {
      downloadMbps: Number(downloadMbps.toFixed(2)),
      uploadMbps: Number(uploadMbps.toFixed(2)),
    };
  }
}

export const throughputEngine = new ThroughputEngine();
