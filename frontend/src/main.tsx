import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { MantineProvider } from '@mantine/core'; // Mantine'ı import et
import '@mantine/core/styles.css'; // Mantine stillerini import et

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        {/* Tüm uygulamayı MantineProvider ile sarmalıyoruz */}
        <MantineProvider defaultColorScheme="dark">
            <App />
        </MantineProvider>
    </React.StrictMode>,
)