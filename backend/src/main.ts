// import { MockCommunicationService } from './services/MockCommunicationService';
// import { WebSocketServer } from './services/WebSocketServer';
import { HardwareCommunicationService } from './services/HardwareCommunicationService'; // DEĞİŞTİ
import { WebSocketServer } from './services/WebSocketServer';

console.log("Sunucu altyapısı başlatılıyor...");

// // 1. İletişim servisimizi oluşturuyoruz (şimdilik sahte olanı).
// const commService = new MockCommunicationService();

// 1. İletişim servisimizi oluşturuyoruz (Artık donanım servisini kullanıyoruz).
const commService = new HardwareCommunicationService(); // DEĞİŞTİ

// // 2. WebSocket sunucumuzu oluşturuyoruz ve hangi iletişim servisini
// //    kullanacağını ona söylüyoruz.
// const wsServer = new WebSocketServer(commService);

// 2. WebSocket sunucumuzu oluşturuyoruz ve hangi iletişim servisini
//    kullanacağını ona söylüyoruz.
const wsServer = new WebSocketServer(commService); // Bu satır aynı kaldı

// 3. Her iki servisi de başlatıyoruz.
commService.start();
wsServer.start();

console.log("Uygulama başarıyla çalışıyor. İstemci bağlantısı bekleniyor...");