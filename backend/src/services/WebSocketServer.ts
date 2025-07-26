// backend/src/services/WebSocketServer.ts
// KONSOL SORUNUNU ÇÖZEN NİHAİ VERSİYON

import { WebSocketServer as WsServer, WebSocket } from 'ws';
import { ICommunicationService } from './ICommunicationService';

interface WebSocketMessage {
    type: string;
    payload?: any;
}

export class WebSocketServer {
    private wss: WsServer;
    private communicationService: ICommunicationService;

    constructor(port: number, communicationService: ICommunicationService) {
        this.wss = new WsServer({ port });
        this.communicationService = communicationService;
        this.initialize();
    }

    private initialize(): void {
        this.wss.on('connection', (ws: WebSocket) => {
            console.log('Yeni bir istemci bağlandı.');
            ws.on('message', (message: string) => this.handleMessage(ws, message));
            ws.on('close', () => console.log('Bir istemcinin bağlantısı kesildi.'));
            ws.on('error', (error) => console.error('WebSocket hatası:', error));
        });
        console.log(`WebSocket sunucusu ${this.wss.options.port} portunda başlatıldı.`);
    }

    private broadcast(message: object): void {
        const messageString = JSON.stringify(message);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageString);
            }
        });
    }

    private handleMessage(ws: WebSocket, message: string): void {
        try {
            const parsedMessage: WebSocketMessage = JSON.parse(message);

            const logToConsole = (logMessage: string) => {
                // Frontend'e log göndermek için yeni bir mesaj tipi kullanıyoruz.
                // Bu, useWebSocketStore tarafından dinlenecek.
                this.broadcast({ type: 'CONSOLE_LOG', payload: logMessage });
            };

            // ANA DÜZELTME BURADA:
            // Frontend'den gelen 'COMMAND' tipini yakalayıp içindeki payload'ı işliyoruz.
            switch (parsedMessage.type) {
                case 'COMMAND':
                    const command = parsedMessage.payload;
                    if (typeof command === 'string' && command.trim() !== '') {
                        logToConsole(`>> ${command}`); // Giden komutu logla
                        this.communicationService.sendCommand(command)
                            .then(response => logToConsole(`<< ${response}`)) // Gelen yanıtı logla
                            .catch(error => logToConsole(`<< ${error.message || 'Hata'}`));
                    }
                    break;
                default:
                    // Diğer mesaj tipleri (SET_MODE vb.) daha sonra buraya eklenecek.
                    console.warn(`Bilinmeyen mesaj tipi alındı: ${parsedMessage.type}`);
                    break;
            }
        } catch (error) {
            console.error('WebSocket mesajı işlenirken hata oluştu:', error);
        }
    }
}