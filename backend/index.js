const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Parseamos todo como raw buffer hasta 50MB para no ahogar a express
app.use(express.raw({ type: '*/*', limit: '50mb' }));

// Pre-generamos un payload de 5MB en memoria para no gastar CPU en cada request
const payloadSize = 5 * 1024 * 1024;
const downloadPayload = Buffer.alloc(payloadSize, 'x');

app.get('/download', (req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] ⬇️ Petición de DESCARGA recibida. Enviando payload de 5MB...`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', downloadPayload.length);
    // Para que los proxies y celulares no cacheen esto
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.send(downloadPayload);
});

app.post('/upload', (req, res) => {
    const receivedBytes = req.body ? req.body.length : 0;
    const mbytes = (receivedBytes / (1024 * 1024)).toFixed(2);
    console.log(`[${new Date().toLocaleTimeString()}] ⬆️ Petición de SUBIDA completada. Recibidos ${mbytes} MB con éxito.`);
    res.json({
        success: true,
        receivedBytes,
        message: 'Echo exitoso'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`QoS Throughput Backend corriendo en http://0.0.0.0:${PORT}`);
    console.log(`Payload de descarga configurado en ${payloadSize / (1024 * 1024)} MB`);
});
