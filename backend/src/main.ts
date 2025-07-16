import { MockCommunicationService } from './services/MockCommunicationService';

console.log("Uygulama başlatılıyor...");

// Sahte servisimizi oluşturuyoruz
const commService = new MockCommunicationService();

// Servisten 'data' olayı geldiğinde ne yapacağımızı belirtiyoruz
commService.on('data', (data) => {
    console.log(`--> ANA UYGULAMA VERİ ALDI: ${data.toString()}`);
});

// Servisi başlatıyoruz
commService.start();

// Her 3 saniyede bir sahte komut göndererek servisi test edelim
setInterval(() => {
    const randomSpeed = Math.floor(Math.random() * 4000) + 1000;
    commService.sendCommand(`h${randomSpeed}`);
}, 3000);