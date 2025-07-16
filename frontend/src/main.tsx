import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { MantineProvider,createTheme  } from '@mantine/core'; // Mantine'ı import et
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css'; // Mantine stillerini import et
import '@mantine/notifications/styles.css';

// Kendi özel temamızı oluşturuyoruz
const theme = createTheme({
    // Temel font boyutunu tarayıcı varsayılanından daha büyük yapıyoruz.
    // Bu, tüm rem birimlerini orantılı olarak büyütecektir.
    fontSizes: {
        md: '1.05rem' // Varsayılan 0.875rem'den büyük
    },
    // Başlıkların boyutlarını ayarlıyoruz
    headings: {
        sizes: {
            h1: { fontSize: '2.5rem' },
            h2: { fontSize: '2.0rem' },
            h3: { fontSize: '1.5rem' },
        }
    },
    // Bileşenler arası varsayılan boşlukları artırıyoruz
    spacing: {
        xs: '0.5rem',
        sm: '0.8rem',
        md: '1.2rem',
        lg: '1.8rem',
        xl: '2.5rem',
    },
});


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        {/* Tüm uygulamayı MantineProvider ile sarmalıyoruz */}
        <MantineProvider defaultColorScheme="dark" theme={theme}>
            {/* Bildirimlerin çalışması için bu sarmalayıcıyı ekliyoruz */}
            <Notifications position="top-right" />
            <App />
        </MantineProvider>
    </React.StrictMode>,
)