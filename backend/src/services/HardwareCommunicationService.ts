// backend/src/services/HardwareCommunicationService.ts

import { ICommunicationService } from './ICommunicationService';
import { EventEmitter } from 'events';
import { Pca9685Driver } from 'pca9685';
import i2c from 'i2c-bus';

const MOTOR_A_PINS = { IN1: 0, IN2: 1, PWM: 2 };

export class HardwareCommunicationService extends EventEmitter implements ICommunicationService {
    private pwm?: Pca9685Driver;
    private isRunning = false;
    private isInitialized = false;
    private isSequenceRunning = false;
    private sequenceTimer: NodeJS.Timeout | null = null; // Zamanlayıcıları temizlemek için referans

    constructor() {
        super();
        try {
            const i2cBus = i2c.openSync(1);
            this.pwm = new Pca9685Driver({ i2c: i2cBus, address: 0x40, frequency: 1600 }, (err) => {
                if (err) {
                    console.error("PCA9685 başlatılırken hata oluştu.", err);
                    this.isInitialized = false;
                } else {
                    console.log("PCA9685 başarıyla başlatıldı.");
                    this.isInitialized = true;
                    this.setMotorDirection('stop');
                    this.setMotorSpeedPWM(0);
                }
            });
        } catch (error) {
            console.error("I2C bus açılamadı!", error);
            this.isInitialized = false;
        }
    }

    public async start(): Promise<void> { this.isRunning = true; }
    public async stop(): Promise<void> { this.stopSequence(); this.isRunning = false; }
    public sendCommand(command: string): void { /* ... eski haliyle aynı kalabilir ... */ }

    // --- REÇETE MOTORU (GELİŞTİRİLMİŞ HALİ) ---

    public async executeSequence(sequence: any[]): Promise<void> {
        if (this.isSequenceRunning) {
            console.log("Mevcut bir dizi zaten çalışıyor.");
            return;
        }
        this.isSequenceRunning = true;
        console.log("Komut dizisi yürütülmeye başlandı.");

        // Zincirleme Promise yapısı ile adımları sırayla çalıştır
        let sequencePromise = Promise.resolve();
        for (const command of sequence) {
            sequencePromise = sequencePromise.then(() => {
                if (!this.isSequenceRunning) {
                    // Eğer bir önceki adımda durdurma komutu geldiyse zinciri kır
                    return Promise.reject(new Error("Sequence stopped"));
                }
                console.log(`Yürütülüyor: ${command.type} | Süre: ${command.duration}ms`);
                switch (command.type) {
                    case 'FORWARD':
                        return this.runForward(command.power, command.duration);
                    case 'OSCILLATE':
                        return this.runPeriodicMovement(command.power, command.duration, 50); // 50ms periyotla yön değiştir
                    case 'VIBRATE':
                        return this.runPeriodicMovement(command.power, command.duration, 15); // 15ms periyotla (daha hızlı) yön değiştir
                    case 'PAUSE':
                        return this.runPause(command.duration);
                    default:
                        console.warn(`Bilinmeyen komut: ${command.type}`);
                        return Promise.resolve();
                }
            });
        }

        sequencePromise.then(() => {
            console.log("Komut dizisi başarıyla tamamlandı.");
        }).catch((err) => {
            if (err.message === "Sequence stopped") {
                console.log("Komut dizisi kullanıcı tarafından durduruldu.");
            } else {
                console.error("Dizi yürütülürken hata oluştu:", err);
            }
        }).finally(() => {
            this.setMotorDirection('stop');
            this.setMotorSpeedPWM(0);
            this.isSequenceRunning = false;
        });
    }

    public stopSequence(): void {
        if (this.sequenceTimer) {
            clearInterval(this.sequenceTimer);
            this.sequenceTimer = null;
        }
        this.isSequenceRunning = false;
    }

    // --- HAREKET FONKSİYONLARI (YENİLENMİŞ) ---

    private runForward(power: number, duration: number): Promise<void> {
        return new Promise((resolve) => {
            const pwmValue = (power / 100); // 0-1 arası değer
            this.setMotorDirection('forward');
            this.setMotorSpeedPWM(pwmValue);
            this.sequenceTimer = setTimeout(() => resolve(), duration);
        });
    }

    private runPause(duration: number): Promise<void> {
        return new Promise((resolve) => {
            this.setMotorDirection('stop');
            this.setMotorSpeedPWM(0);
            this.sequenceTimer = setTimeout(() => resolve(), duration);
        });
    }

    /// Osilasyon ve Titreşim için tek, daha güvenilir bir fonksiyon
    private runPeriodicMovement(power: number, duration: number, periodMs: number): Promise<void> {
        return new Promise(async (resolve) => {
            const pwmValue = (power / 100);
            const endTime = Date.now() + duration;

            // Promise'i hemen durdurabilmek için bir referans tutalım
            let isMovementActive = true;
            const stopMovement = () => {
                isMovementActive = false;
            };

            // Toplam süre dolduğunda hareketi durduracak ana zamanlayıcı
            this.sequenceTimer = setTimeout(() => {
                stopMovement();
            }, duration);

            // Hareketi başlat
            this.setMotorSpeedPWM(pwmValue);

            // YENİ ve DAHA GÜVENİLİR MANTIK:
            // setInterval yerine, her adımın tamamlandığından emin olan bir while döngüsü kullanıyoruz.
            while (isMovementActive && Date.now() < endTime) {
                this.setMotorDirection('forward');
                // Yön değiştirme komutundan sonra motorun tepki vermesi için kısa bir bekleme
                await new Promise(r => setTimeout(r, periodMs));

                // Her adımdan sonra hala çalışıp çalışmadığımızı kontrol et
                if (!isMovementActive || Date.now() >= endTime) break;

                this.setMotorDirection('reverse');
                await new Promise(r => setTimeout(r, periodMs));
            }

            // Döngü bittiğinde veya süre dolduğunda promise'i çöz
            resolve();
        });
    }

    // --- TEMEL KONTROL FONKSİYONLARI ---

    private setMotorSpeedPWM(pwmValue: number): void {
        if (!this.pwm || !this.isInitialized) return;
        const clampedValue = Math.max(0, Math.min(1, pwmValue));
        this.pwm.setDutyCycle(MOTOR_A_PINS.PWM, clampedValue);
    }

    private setMotorDirection(direction: 'forward' | 'reverse' | 'stop'): void {
        if (!this.pwm || !this.isInitialized) return;
        if (direction === 'forward') {
            this.pwm.channelOn(MOTOR_A_PINS.IN1);
            this.pwm.channelOff(MOTOR_A_PINS.IN2);
        } else if (direction === 'reverse') {
            this.pwm.channelOff(MOTOR_A_PINS.IN1);
            this.pwm.channelOn(MOTOR_A_PINS.IN2);
        } else {
            this.pwm.channelOff(MOTOR_A_PINS.IN1);
            this.pwm.channelOff(MOTOR_A_PINS.IN2);
        }
    }
}