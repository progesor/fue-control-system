// backend/src/services/ICommunicationService.ts

/**
 * Bir iletişim servisinin (örn. Seri Port, Mock) sahip olması gereken
 * temel fonksiyonları ve özellikleri tanımlayan arayüz (sözleşme).
 * Bu, farklı iletişim yöntemlerinin birbirinin yerine kullanılabilmesini sağlar.
 */
export interface ICommunicationService {
    /**
     * İletişim kanalını (örn. portu) açar ve bağlantıyı başlatır.
     * @returns Bağlantı başarılı olduğunda çözülen bir Promise.
     */
    open(): Promise<void>;

    /**
     * İletişim kanalını kapatır.
     */
    close(): void;

    /**
     * Bağlantının aktif olup olmadığını kontrol eder.
     * @returns Bağlantı aktifse true, değilse false.
     */
    getIsConnected(): boolean;

    /**
     * Hedef cihaza bir komut gönderir ve bir yanıt bekler.
     * @param command Gönderilecek komut string'i.
     * @returns Cihazdan gelen yanıtı içeren bir Promise.
     */
    sendCommand(command: string): Promise<string>;
}
