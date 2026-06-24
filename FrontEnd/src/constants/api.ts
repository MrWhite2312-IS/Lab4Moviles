import { Platform } from 'react-native';

// En emulador Android usa 10.0.2.2; en iOS simulator y web usa localhost.
// En dispositivo físico cambia esto por la IP local de tu máquina.
const BASE_HOST = '192.168.100.86'; // IP de la PC en Wi-Fi

export const API_URL = `http://${BASE_HOST}:5203/api`;

console.log(`[API] Platform: ${Platform.OS} | URL: ${API_URL}`);
