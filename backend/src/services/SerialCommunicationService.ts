// fue-control-system-main/backend/src/services/SerialCommunicationService.ts

import { SerialPort } from 'serialport'; // <-- @serialport/stream yerine ana paketi kullanıyoruz
import { EventEmitter } from 'events';
import { ICommunicationService } from './ICommunicationService';
import config from '../../config.json';

export class SerialCommunicationService extends EventEmitter implements ICommunicationService {
    private port: SerialPort;
    private isMeasuringTorque = false;

    constructor() {
        super();
        this.port = new SerialPort({
            path: config.serial.port,
            ...config.serial.options,
            autoOpen: false,
        });

        // ÖNEMLİ: Hata ayıklama için ham veri log'u
        this.port.on('data', (data: Buffer) => {
            console.log(`[RAW DATA] Gelen Ham Veri: <${data.toString('hex')}> - "${data.toString().replace(/\s/g, '?')}"`);
            this.handleData(data); // Asıl işleyiciyi sonra çağır
        });

        this.port.on('error', (err) => console.error('[SERVİS] Seri Port Hatası:', err?.message));
        this.port.on('close', () => console.log('[SERVİS] Seri Port bağlantısı kapandı.'));
    }

    // Bu fonksiyonu private'dan public'e çevirdik, adı handleData olarak kalabilir.
    public handleData = (data: Buffer) => {
        if (this.isMeasuringTorque) {
            for (const byte of data) { this.emit('torque_data', byte); }
            return;
        }
        const response = data.toString().trim();
        if (response === 'o' || response === 'e') {
            console.log(`[SERVİS] CİHAZDAN GELEN CEVAP: ${response}`);
            this.emit('data', response);
        } else if (response) {
            console.log(`[SERVİS] CİHAZDAN GELEN BİLGİ: ${response}`);
        }
    };

    async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.port.open((err) => {
                if (err) { return reject(err); }
                console.log(`[SERVİS] Seri Port (${this.port.path}) başarıyla açıldı.`);
                resolve();
            });
        });
    }

    async stop(): Promise<void> {
        return new Promise((resolve) => {
            this.port.close(() => resolve());
        });
    }

    sendCommand(command: string): void {
        if (!this.port.isOpen) {
            console.error("[SERVİS] Seri port açık değil, komut gönderilemiyor.");
            return;
        }
        console.log(`[SERVİS] CİHAZA GÖNDERİLEN KOMUT: ${command}`);
        this.isMeasuringTorque = command === 'i' ? true : command === 'c' ? false : this.isMeasuringTorque;
        this.port.write(command);
    }
}