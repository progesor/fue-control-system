import { WebSocketServer as WSS, WebSocket } from 'ws';
import { ICommunicationService } from './ICommunicationService';
import config from '../../config.json';

export class WebSocketServer {
    private wss: WSS;
    private commService: ICommunicationService;

    // Bu sunucu, hangi iletişim servisini kullanacağını dışarıdan alacak.
    // Bu tasarıma "Dependency Injection" denir ve kodumuzu çok esnek yapar.
    constructor(communicationService: ICommunicationService) {
        this.commService = communicationService;
        this.wss = new WSS({ port: config.api.port });
    }

    public start() {
        console.log(`WebSocket sunucusu ${config.api.port} portunda başlatıldı.`);

        // İletişim servisimizden bir veri ('data') geldiğinde...
        this.commService.on('data', (data) => {
            // Bağlı olan tüm istemcilere bu veriyi yollayalım.
            this.broadcast({ type: 'DEVICE_RESPONSE', payload: data.toString() });
        });

        // Yeni bir istemci (React arayüzü) bağlandığında...
        this.wss.on('connection', (ws: WebSocket) => {
            console.log('Yeni bir istemci bağlandı.');

            // O istemciden bir mesaj geldiğinde...
            ws.on('message', (message: string) => {
                try {
                    const parsedMessage = JSON.parse(message);

                    // Gelen mesajın tipi 'COMMAND' ise...
                    if (parsedMessage.type === 'COMMAND' && parsedMessage.payload) {
                        // Mesajın içeriğini iletişim servisimize yollayalım.
                        this.commService.sendCommand(parsedMessage.payload);
                    }
                } catch (error) {
                    console.error('Geçersiz formatta mesaj alındı:', message);
                }
            });

            ws.on('close', () => {
                console.log('Bir istemcinin bağlantısı kesildi.');
            });
        });
    }

    // Sunucuya bağlı tüm istemcilere mesaj gönderen yardımcı fonksiyon.
    private broadcast(message: object) {
        const messageString = JSON.stringify(message);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageString);
            }
        });
    }
}