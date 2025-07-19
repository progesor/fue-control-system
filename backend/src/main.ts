// fue-control-system-main/backend/src/main.ts

import { MockCommunicationService } from './services/MockCommunicationService';
import { SerialCommunicationService } from './services/SerialCommunicationService'; // Yeni servisi import et
import { WebSocketServer } from './services/WebSocketServer';
import { ICommunicationService } from './services/ICommunicationService';
import config from '../config.json'; // config.json'ı import et

console.log("Sunucu altyapısı başlatılıyor...");

// Hangi iletişim servisini kullanacağımızı seçiyoruz.
let commService: ICommunicationService;

if (config.simulationMode) {
    console.log("Simülasyon modunda çalışılıyor.");
    commService = new MockCommunicationService();
} else {
    console.log("Gerçek seri port modunda çalışılıyor.");
    commService = new SerialCommunicationService();
}

// WebSocket sunucumuzu oluşturuyoruz ve seçtiğimiz iletişim servisini
// ona enjekte ediyoruz.
const wsServer = new WebSocketServer(commService);

// Her iki servisi de başlatıyoruz.
commService.start().catch(err => {
    console.error("İletişim servisi başlatılamadı:", err);
    process.exit(1); // Servis başlamazsa uygulamayı sonlandır.
});
wsServer.start();

console.log("Uygulama başarıyla çalışıyor. İstemci bağlantısı bekleniyor...");