// backend/src/services/WebSocketServer.ts

import { WebSocketServer as WSS, WebSocket } from 'ws';
import { ICommunicationService } from './ICommunicationService';
import config from '../../config.json';

// YENİ: ICommunicationService arayüzümüz artık daha yetenekli olduğu için
// executeSequence ve stopSequence metodlarını da içerecek şekilde genişletiyoruz.
interface IExtendedCommunicationService extends ICommunicationService {
    executeSequence(sequence: any[]): Promise<void>;
    stopSequence(): void;
}

export class WebSocketServer {
    private wss: WSS;
    // YENİ: commService tipini genişletilmiş arayüz olarak belirtiyoruz.
    private commService: IExtendedCommunicationService;

    constructor(communicationService: ICommunicationService) {
        // Gelen servisin yeni metodlara sahip olduğundan emin olmak için tip dönüşümü yapıyoruz.
        this.commService = communicationService as IExtendedCommunicationService;
        this.wss = new WSS({ port: config.api.port });
    }

    public start() {
        console.log(`WebSocket sunucusu ${config.api.port} portunda başlatıldı.`);

        this.commService.on('data', (data) => {
            this.broadcast({ type: 'DEVICE_RESPONSE', payload: data.toString() });
        });

        this.commService.on('torque_data', (data) => {
            this.broadcast({ type: 'TORQUE_UPDATE', payload: data });
        });

        this.wss.on('connection', (ws: WebSocket) => {
            console.log('Yeni bir istemci bağlandı.');

            ws.on('message', (message: string) => {
                try {
                    const parsedMessage = JSON.parse(message);

                    // *** ANA DEĞİŞİKLİK BURADA ***
                    // Artık farklı mesaj tiplerini kontrol ediyoruz.

                    switch (parsedMessage.type) {
                        // Eski tekil komutları işlemeye devam ediyoruz.
                        case 'COMMAND':
                            if (parsedMessage.payload) {
                                this.commService.sendCommand(parsedMessage.payload);
                            }
                            break;

                        // YENİ: Reçete çalıştırma komutunu yakalıyoruz.
                        case 'EXECUTE_SEQUENCE':
                            if (parsedMessage.payload && Array.isArray(parsedMessage.payload)) {
                                // Gelen reçeteyi donanım servisindeki ana fonksiyona gönderiyoruz.
                                this.commService.executeSequence(parsedMessage.payload);
                            }
                            break;

                        // YENİ: Reçeteyi durdurma komutu (gelecekteki bir "Durdur" butonu için)
                        case 'STOP_SEQUENCE':
                            this.commService.stopSequence();
                            break;

                        default:
                            console.warn('Bilinmeyen mesaj tipi alındı:', parsedMessage.type);
                    }

                } catch (error) {
                    console.error('Geçersiz formatta mesaj alındı:', message, error);
                }
            });

            ws.on('close', () => {
                console.log('Bir istemcinin bağlantısı kesildi.');
            });
        });
    }

    private broadcast(message: object) {
        const messageString = JSON.stringify(message);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageString);
            }
        });
    }
}