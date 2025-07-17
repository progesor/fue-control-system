// backend/src/services/WebSocketServer.ts

import { WebSocketServer as WSS, WebSocket } from 'ws';
import { ICommunicationService } from './ICommunicationService';
import config from '../../config.json';

// HardwareCommunicationService'in public metodlarına erişebilmek için arayüz
interface IExtendedCommunicationService extends ICommunicationService {
    executeSequence(sequence: any[]): Promise<void>;
    stopSequence(): void;
    runDirectOscillationTest(power: number, duration: number, periodMs: number, brakeMs: number): Promise<void>;
}

export class WebSocketServer {
    private wss: WSS;
    private commService: IExtendedCommunicationService;

    constructor(communicationService: ICommunicationService) {
        this.commService = communicationService as IExtendedCommunicationService;
        this.wss = new WSS({ port: config.api.port });
    }

    public start() {
        console.log(`WebSocket sunucusu ${config.api.port} portunda başlatıldı.`);

        // NOT: Harici log yayını kaldırıldı ve stabil duruma dönüldü.
        // Loglar doğrudan Raspberry Pi konsolundan takip edilecek.

        this.wss.on('connection', (ws: WebSocket) => {
            console.log('Yeni bir istemci bağlandı.');

            ws.on('message', (message: string) => {
                try {
                    const parsedMessage = JSON.parse(message);
                    switch (parsedMessage.type) {
                        case 'EXECUTE_SEQUENCE':
                            this.commService.executeSequence(parsedMessage.payload);
                            break;
                        case 'STOP_SEQUENCE':
                            this.commService.stopSequence();
                            break;
                        // YENİ: Test komutunu doğru fonksiyona yönlendir
                        case 'DIRECT_OSCILLATE_TEST':
                            if (parsedMessage.payload) {
                                this.commService.runDirectOscillationTest(
                                    parsedMessage.payload.power,
                                    parsedMessage.payload.duration,
                                    parsedMessage.payload.periodMs,
                                    parsedMessage.payload.brakeMs
                                );
                            }
                            break;
                        default:
                            console.log(`Bilinmeyen mesaj tipi alındı: ${parsedMessage.type}`);
                    }
                } catch (error) {
                    console.error(`HATA: Geçersiz formatta mesaj alındı: ${message}`);
                }
            });

            ws.on('close', () => {
                console.log('Bir istemcinin bağlantısı kesildi.');
            });
        });
    }

    // Bu fonksiyon artık kullanılmıyor ama gelecekte lazım olabilir.
    private broadcast(message: object) {
        const messageString = JSON.stringify(message);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageString);
            }
        });
    }
}