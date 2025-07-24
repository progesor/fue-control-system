import { create } from 'zustand';

interface WebSocketState {
    socket: WebSocket | null;
    isConnected: boolean;
    lastMessage: any | null;
    isMeasuringTorque: boolean;
    torqueData: { name: number, value: number }[];
    messageHistory: string[];
    currentMode: string;
    needsInitialization: boolean;
    connect: (url: string) => void;
    disconnect: () => void;
    sendMessage: (message: object) => void;
    startTorqueMeasurement: () => void;
    stopTorqueMeasurement: () => void;
    // YENİ: Modu değiştirecek fonksiyon
    setCurrentMode: (mode: string) => void;
}

// config.json'dan varsayılan modu alıyoruz
import config from '../../../backend/config.json';
const defaultMode = config.modes[0].id;

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
    socket: null,
    isConnected: false,
    lastMessage: null,
    isMeasuringTorque: false,
    torqueData: [],
    messageHistory: [],
    currentMode: defaultMode,
    needsInitialization: false,

    // YENİ Fonksiyon
    setCurrentMode: (mode) => set({ currentMode: mode }),

    connect: (url) => {
        if (get().socket) return;

        const socket = new WebSocket(url);

        socket.onopen = () => {
            console.log('WebSocket bağlantısı kuruldu.');
            set({ isConnected: true, socket: socket, needsInitialization: true });
            get().sendMessage({ type: 'COMMAND', payload: 's1' });
        };

        socket.onclose = () => {
            console.log('WebSocket bağlantısı kesildi.');
            set({ isConnected: false, socket: null, messageHistory: [] });
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('Sunucudan mesaj alındı:', message);

            const state = get();
            if (state.needsInitialization && message.type === 'DEVICE_RESPONSE' && message.payload === 'o') {
                // Eğer başlatma modundaysak ve 'o' cevabı geldiyse, ikinci komutu gönder
                console.log('Başlatma sekansı: s1 komutu ONAYLANDI. h1500 gönderiliyor...');
                state.sendMessage({ type: 'COMMAND', payload: 'h1500' });
                // Sekansı tamamla
                set({ needsInitialization: false });
            }

            const formattedMessage = `[ALINAN] << ${JSON.stringify(message)}`;
            set((state) => ({
                lastMessage: message,
                messageHistory: [...state.messageHistory, formattedMessage]
            }));

            if (message.type === 'TORQUE_UPDATE') {
                set((state) => {
                    const newDataPoint = { name: state.torqueData.length + 1, value: message.payload };
                    const newTorqueData = [...state.torqueData, newDataPoint].slice(-100);
                    return { torqueData: newTorqueData };
                });
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket hatası:', error);
        };
    },

    disconnect: () => {
        get().socket?.close();
    },

    sendMessage: (message) => {
        // ... (sendMessage fonksiyonunun geri kalanı aynı)
        const socket = get().socket;
        if (socket) {
            const messageString = JSON.stringify(message);
            socket.send(messageString);

            const formattedMessage = `[GÖNDERİLEN] >> ${messageString}`;
            set((state) => ({
                messageHistory: [...state.messageHistory, formattedMessage]
            }));
        }
    },

    startTorqueMeasurement: () => {
        set({ isMeasuringTorque: true, torqueData: [] });
        get().sendMessage({ type: 'COMMAND', payload: 'i' });
    },
    stopTorqueMeasurement: () => {
        set({ isMeasuringTorque: false });
        get().sendMessage({ type: 'COMMAND', payload: 'c' });
    },
}));