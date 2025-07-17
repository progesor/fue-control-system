// backend/src/services/WebSocketServer.ts

import { WebSocketServer as WSS, WebSocket } from 'ws';
import { ICommunicationService } from './ICommunicationService';
import config from '../../config.json';

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

        // Log dinleyicisini, tüm sistemler hazır olduğunda, start() metodu içinde kuruyoruz.
        this.commService.on('log', (message) => {
            this.broadcast({ type: 'LOG_MESSAGE', payload: message });
        });

        this.wss.on('connection', (ws: WebSocket) => {
            console.log('Yeni bir istemci bağlandı.');
            ws.send(JSON.stringify({
                type: 'LOG_MESSAGE',
                payload: `[SYSTEM] Arayüze başarıyla bağlanıldı.`
            }));

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
            ws.on('close', () => console.log('Bir istemcinin bağlantısı kesildi.'));
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