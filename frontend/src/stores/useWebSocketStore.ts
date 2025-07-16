import { create } from 'zustand';

// Store'umuzun tutacağı state'lerin ve fonksiyonların tiplerini tanımlıyoruz.
interface WebSocketState {
    socket: WebSocket | null;
    isConnected: boolean;
    lastMessage: any | null;
    connect: (url: string) => void;
    disconnect: () => void;
    sendMessage: (message: object) => void;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
    socket: null,
    isConnected: false,
    lastMessage: null,

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
    }
}));