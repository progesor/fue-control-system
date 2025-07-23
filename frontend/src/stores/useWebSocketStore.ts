import { create } from 'zustand';

// Store'umuzun tutacağı state'lerin ve fonksiyonların tiplerini tanımlıyoruz.
interface WebSocketState {
    socket: WebSocket | null;
    isConnected: boolean;
    lastMessage: any | null;
    isMeasuringTorque: boolean; // YENİ: Tork ölçüm durumu
    torqueData: { name: number, value: number }[]; // YENİ: Grafik için veri dizisi
    messageHistory: string[];
    connect: (url: string) => void;
    disconnect: () => void;
    sendMessage: (message: object) => void;
    startTorqueMeasurement: () => void; // YENİ
    stopTorqueMeasurement: () => void;  // YENİ
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
    socket: null,
    isConnected: false,
    lastMessage: null,
    isMeasuringTorque: false,
    torqueData: [],
    messageHistory: [],

    // Bağlantı kuran ana fonksiyon
    connect: (url) => {
        // Zaten bir bağlantı varsa tekrar deneme
        if (get().socket) return;

        const socket = new WebSocket(url);

        socket.onopen = () => {
            console.log('WebSocket bağlantısı kuruldu.');
            set({ isConnected: true, socket: socket });
        };

        socket.onclose = () => {
            console.log('WebSocket bağlantısı kesildi.');
            set({ isConnected: false, socket: null });
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('Sunucudan mesaj alındı:', message);
            const formattedMessage = `[ALINAN] << ${JSON.stringify(message)}`;
            set((state) => ({
                lastMessage: message,
                messageHistory: [...state.messageHistory, formattedMessage]
            }));

            // YENİ: Gelen mesaj tork güncellemesi ise...
            if (message.type === 'TORQUE_UPDATE') {
                set((state) => {
                    const newDataPoint = { name: state.torqueData.length + 1, value: message.payload };
                    // Grafiğin sonsuza dek büyümemesi için son 100 veriyi tutalım
                    const newTorqueData = [...state.torqueData, newDataPoint].slice(-100);
                    return { torqueData: newTorqueData };
                });
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket hatası:', error);
        };
    },

    // Bağlantıyı kesen fonksiyon
    disconnect: () => {
        get().socket?.close();
    },

    // Sunucuya mesaj gönderen fonksiyon
    sendMessage: (message) => {
        const socket = get().socket;
        if (socket) {
            const messageString = JSON.stringify(message);
            socket.send(messageString);

            // YENİ: Gönderilen mesajı da geçmişe ekle
            const formattedMessage = `[GÖNDERİLEN] >> ${messageString}`;
            set((state) => ({
                messageHistory: [...state.messageHistory, formattedMessage]
            }));
        }
    },

    // YENİ FONKSİYONLAR
    startTorqueMeasurement: () => {
        // Ölçüme başlamadan önce eski verileri temizle
        set({ isMeasuringTorque: true, torqueData: [] });
        get().sendMessage({ type: 'COMMAND', payload: 'i' });
    },
    stopTorqueMeasurement: () => {
        set({ isMeasuringTorque: false });
        get().sendMessage({ type: 'COMMAND', payload: 'c' });
    },
}));