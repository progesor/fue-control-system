// backend/src/main.ts
// TÜM SERVİSLERİ DOĞRU BAĞLAYAN NİHAİ VERSİYON

import * as fs from 'fs';
import * as path from 'path';
import { ICommunicationService } from './services/ICommunicationService';
import { SerialCommunicationService } from './services/SerialCommunicationService';
import { MockCommunicationService } from './services/MockCommunicationService';
import { WebSocketServer } from './services/WebSocketServer';
// MotorControlService şimdilik kullanılmıyor, sadece temel bağlantıyı test ediyoruz.

async function main() {
    console.log('Sunucu altyapısı başlatılıyor...');

    const configPath = path.join(__dirname, '..', 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    let communicationService: ICommunicationService;

    if (config.simulationMode) {
        console.log('Simülasyon modunda çalışılıyor.');
        // DÜZELTME: MockCommunicationService artık config'den gelen parametre ile doğru şekilde başlatılıyor.
        communicationService = new MockCommunicationService(config.simulationData.responseDelayMs);
    } else {
        console.log('Gerçek seri port modunda çalışılıyor.');
        communicationService = new SerialCommunicationService(
            config.serial.port,
            config.serial.options.baudRate
        );
    }

    try {
        await communicationService.open();
    } catch (error) {
        console.error('İletişim servisi başlatılamadı:', error);
        process.exit(1);
    }

    // WebSocket sunucusunu başlat ve iletişim servisini ona enjekte et.
    // Bu, WebSocket'in seri port ile konuşabilmesini sağlar.
    new WebSocketServer(config.api.port, communicationService);

    console.log('Uygulama başarıyla çalışıyor. İstemci bağlantısı bekleniyor...');
}

main().catch(error => {
    console.error('Uygulama başlatılırken kritik bir hata oluştu:', error);
    process.exit(1);
});
