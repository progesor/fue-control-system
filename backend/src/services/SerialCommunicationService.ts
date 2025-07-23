// fue-control-system-main/backend/src/services/SerialCommunicationService.ts
import { SerialPort } from 'serialport';
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

        // Gelen ham veriyi logla ve işlemeye gönder
        this.port.on('data', (data: Buffer) => {
            console.log(`[RAW DATA] Gelen Ham Veri: <${data.toString('hex')}> - "${data.toString().replace(/\s/g, '?')}"`);
            this.handleData(data);
        });

        this.port.on('error', (err) => console.error('[SERVİS] Seri Port Hatası:', err?.message));
        this.port.on('close', () => console.log('[SERVİS] Seri Port bağlantısı kapandı.'));
    }

    public handleData = (data: Buffer) => {
        if (this.isMeasuringTorque) {
            for (const byte of data) {
                this.emit('torque_data', byte);
            }
            return;
        }

        const response = data.toString().trim();

        if (response.includes('o')) {
            console.log(`[SERVİS] CİHAZDAN OK: ${response}`);
            this.emit('data', 'o');
        } else if (response.includes('e')) {
            console.log(`[SERVİS] CİHAZDAN HATA: ${response}`);
            this.emit('data', 'e');
        } else if (response) {
            console.log(`[SERVİS] CİHAZDAN BİLGİ: ${response}`);
        }
    };

    async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.port.open((err) => {
                if (err) {
                    console.error(`[SERVİS] Seri port açılamadı: ${err.message}`);
                    return reject(err);
                }
                console.log(`[SERVİS] Seri Port (${this.port.path}) başarıyla açıldı.`);
                resolve();
            });
        });
    }

    async stop(): Promise<void> {
        return new Promise((resolve) => {
            if (this.port.isOpen) {
                this.port.close(() => {
                    console.log(`[SERVİS] Seri port kapatıldı.`);
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    sendCommand(command: string): void {
        if (!this.port.isOpen) {
            console.error("[SERVİS] Seri port açık değil, komut gönderilemiyor.");
            return;
        }

        console.log(`[SERVİS] CİHAZA GÖNDERİLEN KOMUT: ${command}`);
        this.isMeasuringTorque = command === 'i' ? true : command === 'c' ? false : this.isMeasuringTorque;

        // Komutun sonuna '\n' eklenmeli çünkü Arduino bunu bekliyor
        this.port.write(command + '\n');
    }
}
