import { ICommunicationService } from './ICommunicationService';
import { EventEmitter } from 'events';
import config from '../../config.json'; // config.json dosyamızı import ediyoruz

export class MockCommunicationService extends EventEmitter implements ICommunicationService {
    private isRunning = false;

    constructor() {
        super(); // EventEmitter'ın constructor'ını çağırıyoruz
    }

    async start(): Promise<void> {
        console.log("Mock İletişim Servisi Başlatıldı.");
        this.isRunning = true;
        // Gerçek serviste burada seri porta bağlanılır.
    }

    async stop(): Promise<void> {
        console.log("Mock İletişim Servisi Durduruldu.");
        this.isRunning = false;
        // Gerçek serviste burada seri port bağlantısı kapatılır.
    }

    sendCommand(command: string): void {
        if (!this.isRunning) {
            console.error("Servis çalışmıyor. Önce start() çağrılmalı.");
            return;
        }

        console.log(`SAHTE CİHAZA GÖNDERİLEN KOMUT: ${command}`);

        // config.json'dan okuduğumuz gecikme süresi kadar bekleyip cevap veriyoruz.
        setTimeout(() => {
            // %90 ihtimalle 'o' (ok), %10 ihtimalle 'e' (error) cevabı verelim.
            const response = Math.random() < 0.9 ? 'o' : 'e';

            console.log(`SAHTE CİHAZDAN GELEN CEVAP: ${response}`);

            // 'data' olayını yayınlayarak cevabı dinleyenlere gönderiyoruz.
            this.emit('data', response);

        }, config.simulationData.responseDelayMs);
    }
}