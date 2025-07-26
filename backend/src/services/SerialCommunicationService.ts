// backend/src/services/SerialCommunicationService.ts
// Bu, "UniCom" protokolünü konuşan nihai haberleşme servisidir.

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { ICommunicationService } from './ICommunicationService';

export class SerialCommunicationService implements ICommunicationService {
    private port: SerialPort;
    private parser: ReadlineParser;
    private isConnected: boolean = false;
    private commandQueue: { command: string, resolve: (value: string) => void, reject: (reason?: any) => void }[] = [];
    private isProcessing: boolean = false;

    constructor(path: string, baudRate: number) {
        this.port = new SerialPort({ path, baudRate, autoOpen: false });
        this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

        this.port.on('open', () => {
            this.isConnected = true;
            console.log(`Serial port ${path} açıldı.`);
            this.parser.on('data', this.handleResponse.bind(this));
        });

        this.port.on('close', () => {
            this.isConnected = false;
            console.log(`Serial port ${path} kapandı.`);
        });

        this.port.on('error', (err) => {
            console.error('Seri Port Hatası: ', err);
            this.isConnected = false;
        });
    }

    public open(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.port.open((err) => {
                if (err) return reject(err);
                setTimeout(resolve, 2000); // Arduino'nun başlaması için bekle
            });
        });
    }

    public close(): void { this.port.close(); }
    public getIsConnected(): boolean { return this.isConnected; }

    public sendCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.commandQueue.push({ command, resolve, reject });
            if (!this.isProcessing) {
                this.processQueue();
            }
        });
    }

    private processQueue() {
        if (this.commandQueue.length === 0) {
            this.isProcessing = false;
            return;
        }
        this.isProcessing = true;
        const { command } = this.commandQueue[0];
        this.port.write(`${command}\n`, (err) => {
            if (err) {
                console.error(`Seri porta yazma hatası: ${err.message}`);
                const nextCmd = this.commandQueue.shift();
                if (nextCmd) nextCmd.reject(err);
                this.processQueue();
            }
        });
    }

    private handleResponse(data: string) {
        const response = data.trim();
        if (this.commandQueue.length > 0) {
            const { resolve, reject } = this.commandQueue.shift()!;
            if (response.startsWith('ERR')) {
                reject(new Error(response));
            } else {
                resolve(response);
            }
        }
        this.processQueue();
    }
}