// frontend/src/oscillationConfig.ts

// Oscillation modundaki 10 kademeli RPM hızları
export const OSCILLATION_SPEEDS = [500, 750, 1000, 1380, 1750, 1940, 2130, 2320, 2510, 2700];

// Kullanıcının seçeceği 10 kademeli temel açılar
export const OSCILLATION_BASE_ANGLES = [180, 225, 270, 315, 360, 405, 450, 495, 540, 600];

// Cihaza gönderilecek gerçek açı komutlarının bulunduğu 2D tablo
// Dizin yapısı: OSCILLATION_ANGLES_TABLE[hız_indeksi][açı_indeksi]
export const OSCILLATION_ANGLES_TABLE = [
    [150, 179, 210, 250, 293, 298, 305, 312, 323, 340], // 500 RPM için açılar
    [99, 112, 138, 152, 165, 175, 183, 190, 200, 214],  // 750 RPM için açılar
    [95, 108, 129, 144, 150, 163, 175, 183, 190, 197],  // 1000 RPM için açılar
    [90, 98, 110, 120, 130, 140, 150, 158, 165, 172],  // 1380 RPM için açılar
    [66, 75, 83, 92, 98, 104, 110, 117, 123, 129],  // 1750 RPM için açılar
    [58, 67, 74, 82, 88, 93, 98, 103, 108, 113],  // 1940 RPM için açılar
    [51, 58, 64, 71, 76, 81, 85, 90, 95, 100],  // 2130 RPM için açılar
    [46, 52, 59, 64, 70, 75, 79, 84, 88, 92],  // 2320 RPM için açılar (2230 yerine 2320 olmalı)
    [34, 38, 42, 50, 52, 55, 57, 61, 64, 67],  // 2510 RPM için açılar
    [27, 31, 35, 38, 41, 44, 47, 50, 53, 56]   // 2700 RPM için açılar
];