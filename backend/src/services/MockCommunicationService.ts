// backend/src/services/MockCommunicationService.ts
// TS2739 HATASINI GİDEREN NİHAİ VERSİYON

import { ICommunicationService } from './ICommunicationService';

export class MockCommunicationService implements ICommunicationService {
    private isConnected: boolean = false;
    private responseDelay: number;

    constructor(responseDelay: number = 50) {
        this.responseDelay = responseDelay;
    }

    public open(): Promise<void> {
        console.log('[MOCK] Sahte bağlantı açılıyor...');
        return new Promise(resolve => {
            setTimeout(() => {
                this.isConnected = true;
                console.log('[MOCK] Sahte bağlantı başarıyla açıldı.');
                resolve();
            }, 500);
        });
    }

    public close(): void {
        this.isConnected = false;
        console.log('[MOCK] Sahte bağlantı kapatıldı.');
    }

    public getIsConnected(): boolean {
        return this.isConnected;
    }

    public sendCommand(command: string): Promise<string> {
        return new Promise(resolve => {
            setTimeout(() => {
                const response = this.getMockResponse(command);
                console.log(`[MOCK] Komut alındı: "${command}", Yanıt: "${response}"`);
                resolve(response);
            }, this.responseDelay);
        });
    }

    private getMockResponse(command: string): string {
        const [fullCommand] = command.split(':', 1);
        switch (fullCommand) {
            case 'SYS.PING': return 'PONG';
            case 'SYS.INFO': return 'INFO:MOCK_FUE_SLAVE:1.0';
            case 'PIN.SET_D': return 'OK';
            case 'PIN.SET_A': return 'OK';
            case 'PIN.GET_D': return 'DATA:1';
            case 'PIN.GET_A': return 'DATA:512';
            default: return 'ERR:INVALID_CMD';
        }
    }
}