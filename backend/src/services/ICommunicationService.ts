import { EventEmitter } from 'events';

// Bir iletişim servisinin hangi fonksiyonlara ve olaylara sahip olması gerektiğini
// tanımlayan sözleşmemiz (arayüzümüz).
export interface ICommunicationService extends EventEmitter {
    start(): Promise<void>;
    stop(): Promise<void>;
    sendCommand(command: string): void;
}