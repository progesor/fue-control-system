import { create } from 'zustand';

// Store'umuzun tutacağı state'lerin ve fonksiyonların tiplerini tanımlıyoruz.
interface WebSocketState {
    socket: WebSocket | null;
    isConnected: boolean;
    lastMessage: any | null;
    isMeasuringTorque: boolean; // Tork ölçüm durumu
    torqueData: { name: number, value: number }[]; // YENİ: Grafik için veri dizisi
    connect: (url: string) => void;
    disconnect: () => void;
    sendMessage: (message: object) => void;
    startTorqueMeasurement: () => void;
    stopTorqueMeasurement: () => void;
    logMessages: string[];
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
    socket: null,
    isConnected: false,
    lastMessage: null,
    isMeasuringTorque: false,
    torqueData: [],
    logMessages: [],

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
            set({ lastMessage: message });

            // YENİ: Gelen mesaj tork güncellemesi ise...
            if (message.type === 'TORQUE_UPDATE') {
                set((state) => {
                    const newDataPoint = { name: state.torqueData.length + 1, value: message.payload };
                    // Grafiğin sonsuza dek büyümemesi için son 100 veriyi tutalım
                    const newTorqueData = [...state.torqueData, newDataPoint].slice(-100);
                    return { torqueData: newTorqueData };
                });
            }

            if (message.type === 'LOG_MESSAGE') {
                set((state) => ({
                    // Mevcut logların başına yenisini ekle ve listeyi 50 ile sınırla
                    logMessages: [message.payload, ...state.logMessages].slice(0, 50)
                }));
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
        get().socket?.send(JSON.stringify(message));
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