import { MockCommunicationService } from './services/MockCommunicationService';
import { WebSocketServer } from './services/WebSocketServer';

console.log("Sunucu altyapısı başlatılıyor...");

// 1. İletişim servisimizi oluşturuyoruz (şimdilik sahte olanı).
const commService = new MockCommunicationService();

// 2. WebSocket sunucumuzu oluşturuyoruz ve hangi iletişim servisini
//    kullanacağını ona söylüyoruz.
const wsServer = new WebSocketServer(commService);

// 3. Her iki servisi de başlatıyoruz.
commService.start();
wsServer.start();

console.log("Uygulama başarıyla çalışıyor. İstemci bağlantısı bekleniyor...");