// backend/src/services/WebSocketServer.ts

import { WebSocketServer as WSS, WebSocket } from 'ws';
import { ICommunicationService } from './ICommunicationService';
import config from '../../config.json';

// HardwareCommunicationService'in tüm public metodlarına erişebilmek için bir arayüz
interface IExtendedCommunicationService extends ICommunicationService {
    executeSequence(sequence: any[]): Promise<void>;
    stopSequence(): void;
    runPeriodicMovement(power: number, duration: number, periodMs: number, brakeMs: number): Promise<void>;
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
                        case 'DIRECT_OSCILLATE_TEST':
                            if (parsedMessage.payload) {
                                this.commService.runPeriodicMovement(
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

            ws.on('close', () => {
                this.log('Bir istemcinin bağlantısı kesildi.');
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

    private log(message: string): void {
        console.log(message);
        this.broadcast({ type: 'LOG_MESSAGE', payload: `[${new Date().toLocaleTimeString()}] [WebSocket] ${message}` });
    }
}