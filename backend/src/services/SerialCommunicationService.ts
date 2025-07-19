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
            autoOpen: false, // Portu manuel olarak açacağız
        });

        // Hatanın düzeltildiği satır
        this.port.on('data', this.handleData);

        this.port.on('error', (err) => {
            console.error('Seri Port Hatası: ', err.message);
            this.emit('error', err); // Hataları dışarıya da bildirelim
        });

        this.port.on('close', () => {
            console.log('Seri Port bağlantısı kapandı.');
        });
    }

    private handleData = (data: Buffer) => {
        // Tork ölçümü aktifse, gelen her byte'ı doğrudan 'torque_data' olarak yayınla
        if (this.isMeasuringTorque) {
            // Gelen verinin her bir byte'ını ayrı bir tork verisi olarak ele alalım
            for (const byte of data) {
                this.emit('torque_data', byte);
            }
            return; // Tork verisi geldiğinde başka bir işlem yapma
        }

        // Tork ölçümü aktif değilse, normal komut cevaplarını işle
        const receivedString = data.toString().trim();
        if (receivedString === 'o' || receivedString === 'e') {
            console.log(`CİHAZDAN GELEN CEVAP: ${receivedString}`);
            this.emit('data', receivedString);
        } else if (receivedString.length > 0) { // Boş verileri loglama
            // Cihazdan gelen beklenmedik bir veri (örn: cihazın başlattığı bir istek)
            console.log(`CİHAZDAN GELEN İSTEK/BİLGİ: ${receivedString}`);
            // TODO: Cihazdan gelen 'h', 'a', 't' gibi istekleri burada işleyip
            // WebSocket üzerinden frontend'e bildirebiliriz.
        }
    }


    async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.port.open((err) => {
                if (err) {
                    console.error('Seri Port açılamadı: ', err.message);
                    return reject(err);
                }
                console.log(`Seri Port (${config.serial.port}) başarıyla açıldı.`);
                resolve();
            });
        });
    }

    async stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Tork ölçümü açıksa önce onu durdur
            if (this.isMeasuringTorque) {
                this.sendCommand('c');
            }
            this.port.close((err) => {
                if (err) {
                    // Port zaten kapalıysa veya bir hata oluşursa bunu logla ama programı durdurma
                    console.warn('Seri Port kapatılırken hata oluştu (muhtemelen zaten kapalıydı): ', err.message);
                }
                resolve();
            });
        });
    }

    sendCommand(command: string): void {
        if (!this.port.isOpen) {
            console.error("Seri Port açık değil. Komut gönderilemiyor.");
            return;
        }

        console.log(`CİHAZA GÖNDERİLEN KOMUT: ${command}`);

        // Tork ölçümünün durumunu komutlara göre yönet
        if (command === 'i') {
            this.isMeasuringTorque = true;
        } else if (command === 'c') {
            this.isMeasuringTorque = false;
        }

        this.port.write(command, (err) => {
            if (err) {
                console.error('Komut gönderilirken hata oluştu: ', err.message);
            }
        });
    }
}