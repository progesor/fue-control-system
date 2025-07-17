// backend/src/services/WebSocketServer.ts

import { WebSocketServer as WSS, WebSocket } from 'ws';
import { ICommunicationService } from './ICommunicationService';
import config from '../../config.json';

// Arayüzü en güncel haliyle tanımla
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
        this.log(`WebSocket sunucusu ${config.api.port} portunda başlatıldı.`);
        this.commService.on('log', (message) => {
            this.broadcast({ type: 'LOG_MESSAGE', payload: message });
        });
        this.wss.on('connection', (ws: WebSocket) => {
            this.log('Yeni bir istemci bağlandı.');
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
                        // DÜZELTME: Doğru, yeni test fonksiyonunu çağır
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
                            this.log(`Bilinmeyen mesaj tipi alındı: ${parsedMessage.type}`);
                    }
                } catch (error) {
                    this.log(`HATA: Geçersiz formatta mesaj alındı: ${message}`);
                }
            });
            ws.on('close', () => this.log('Bir istemcinin bağlantısı kesildi.'));
        });
    }

    private broadcast(message: object) { /* ... Değişiklik yok ... */ }
    private log(message: string): void { /* ... Değişiklik yok ... */ }
}