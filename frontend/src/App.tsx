import { useWebSocketStore } from './stores/useWebSocketStore';

function App() {
    // Store'dan gerekli state'leri ve fonksiyonları çekiyoruz.
    const { isConnected, lastMessage, connect, disconnect, sendMessage } = useWebSocketStore();

    const handleConnect = () => {
        // Backend sunucumuzun adresini veriyoruz.
        connect('ws://localhost:8080');
    };

    const handleSendCommand = () => {
        sendMessage({ type: 'COMMAND', payload: 'h1234' });
    };

    return (
        <div>
            <h1>FUE Kontrol Arayüzü</h1>
            <div>
                <h2>Bağlantı Kontrolü</h2>
                <p>Durum: {isConnected ? <b style={{color: 'green'}}>Bağlı</b> : <b style={{color: 'red'}}>Bağlı Değil</b>}</p>
                <button onClick={handleConnect} disabled={isConnected}>Bağlan</button>
                <button onClick={disconnect} disabled={!isConnected}>Bağlantıyı Kes</button>
            </div>

            <div>
                <h2>Test</h2>
                <button onClick={handleSendCommand} disabled={!isConnected}>Test Komutu Gönder</button>
                <p>Sunucudan Gelen Son Mesaj:</p>
                <pre>{JSON.stringify(lastMessage, null, 2)}</pre>
            </div>
        </div>
    )
}

export default App