# 🌍 VPN ÜZERİNDEN UZAKTAN ERİŞİM REHBERİ

**Tarih:** 04.02.2026  
**Konfigürasyon:** VPN Server @ 192.168.1.200

---

## 🎯 AMAÇ

Mobil uygulamadan **dünyanın herhangi bir yerinden** şirket sunucusuna (192.168.1.200) güvenli VPN bağlantısı üzerinden erişim sağlamak.

---

## ⚙️ YAPILAN DEĞİŞİKLİKLER

### 1. Environment-Based Config Sistemi

**Dosya:** `mobile/constants/Config.ts`

3 environment modu eklendi:
- **development:** Local geliştirme (192.168.1.11)
- **production:** Production ortam (ayarlanabilir)
- **vpn:** VPN sunucusu (192.168.1.200) ← Şu anda AKTİF ✅

### 2. Environment Badge (Debug Tool)

**Dosya:** `mobile/components/EnvironmentBadge.tsx`

- Sağ üstte VPN durumu gösterir (sadece dev modda)
- Tıklayınca detaylı bilgi gösterir
- API URL, environment name, connection status

### 3. Dashboard Entegrasyonu

**Dosya:** `mobile/app/(tabs)/index.tsx`

EnvironmentBadge dashboard'a eklendi.

---

## 🚀 KULLANIM REHBERİ

### Adım 1: VPN Bağlantısı Kur

1. **Mobil cihazda** şirket VPN programını aç
2. **Sunucuya bağlan** (192.168.1.200 erişilebilir olmalı)
3. **VPN bağlantısını doğrula**

### Adım 2: Mobil Uygulamayı Başlat

```bash
cd mobile
npx expo start
```

### Adım 3: Expo Go ile Aç

1. **QR kodu tara**
2. **Uygulama açılır**
3. **Sağ üstte 🌍 VPN badge görünür** (dev modda)

### Adım 4: Login Yap

- Username: `demo`
- Password: `demo123`

veya backend'deki kayıtlı kullanıcı

### Adım 5: Doğrulama

**Dashboard'da:**
- Charts yüklenmeli ✅
- Stats kartları görünmeli ✅
- Network error olmamalı ✅
- 🌍 VPN badge gösterir: "VPN Server (192.168.1.200)"

---

## 🔧 ENVIRONMENT DEĞİŞTİRME

### Manuel Değiştirme

**Dosya:** `mobile/constants/Config.ts`

```typescript
// Satır 10:
const CURRENT_ENV: Environment = 'vpn'; // 'development' | 'production' | 'vpn'
```

**Seçenekler:**
- `'development'` - Local (192.168.1.11)
- `'production'` - Production (192.168.1.11)
- `'vpn'` - VPN Server (192.168.1.200) ← ŞU ANDA BU AKTİF

### Yeniden Build

Environment değiştirdikten sonra:

```bash
# Expo cache temizle
npx expo start --clear
```

---

## 🔍 DEBUG VE TEST

### 1. VPN Bağlantı Testi

**Mobil cihazın tarayıcısında:**
```
http://192.168.1.200:3001/api/invoices
```

Eğer JSON verisi görüyorsanız → VPN çalışıyor ✅

### 2. Backend Server Kontrolü

**Server bilgisayarında:**
```bash
netstat -ano | findstr :3001
```

Port 3001 LISTENING durumunda olmalı.

### 3. Firewall Kontrolü

**Windows Firewall:**
- Port 3001 açık olmalı
- VPN IP aralığı (192.168.1.0/24) izin verilmeli

### 4. Environment Badge Kontrolü

**Dev modda:**
- Sağ üstte 🌍 VPN badge görünür
- Tıklayınca modal açılır
- API URL: `http://192.168.1.200:3001/api`
- Environment: "VPN Server (192.168.1.200)"

---

## 🛡️ GÜVENLİK ÖNERİLERİ

### 1. VPN Güvenliği
- ✅ Güçlü VPN encryption (AES-256)
- ✅ Multi-factor authentication
- ✅ VPN logs monitoring

### 2. Backend Güvenliği
- ✅ API authentication (JWT tokens)
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ SQL injection prevention

### 3. Network Güvenliği
- ✅ Firewall rules
- ✅ IP whitelisting (VPN subnet only)
- ✅ SSL/TLS encryption (upgrade to HTTPS)

### 4. HTTPS Upgrade (Önerilen)

**Şu anda:** HTTP (192.168.1.200:3001)  
**Önerilir:** HTTPS (https://company.yourdomain.com)

**Adımlar:**
1. SSL certificate al (Let's Encrypt)
2. Nginx/Apache reverse proxy kur
3. HTTPS port 443'ü aç
4. Config.ts'de HTTPS URL kullan

---

## 📊 NETWORK DİYAGRAMI

```
┌─────────────────┐
│  Mobil Device   │
│  (Anywhere)     │
└────────┬────────┘
         │
         │ VPN Tunnel
         │ (Encrypted)
         │
         ▼
┌─────────────────┐
│   VPN Server    │
│  192.168.1.200  │
└────────┬────────┘
         │
         │ Internal Network
         │
         ▼
┌─────────────────┐
│  Backend API    │
│  Port 3001      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SQL Database   │
│  (Logo SQL)     │
└─────────────────┘
```

---

## ⚙️ BACKEND KONFIGÜRASYONU

### CORS Ayarları

**Dosya:** `server/src/index.js`

```javascript
app.use(cors({
    origin: '*', // Tüm IP'lere izin (dev için)
    // Production'da:
    // origin: ['http://192.168.1.200:3001'],
}));
```

### Server Listen Address

```javascript
const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => { // Tüm interface'lerde dinle
    console.log(`Server running on port ${PORT}`);
});
```

---

## 🧪 TEST SENARYOLARI

### Senaryo 1: Local WiFi
- ✅ Aynı WiFi'de
- ✅ VPN kapalı
- ✅ Config: 'development' mode
- ✅ API: 192.168.1.11:3001

### Senaryo 2: VPN (Ofiste)
- ✅ Aynı WiFi'de
- ✅ VPN açık
- ✅ Config: 'vpn' mode
- ✅ API: 192.168.1.200:3001

### Senaryo 3: VPN (Uzaktan)
- ✅ Farklı WiFi/4G
- ✅ VPN açık
- ✅ Config: 'vpn' mode
- ✅ API: 192.168.1.200:3001
- ✅ **Dünyanın herhangi bir yerinden!** 🌍

---

## 🚨 SORUN GİDERME

### Sorun 1: "Network Error"

**Çözüm:**
1. VPN bağlantısını kontrol et
2. `http://192.168.1.200:3001/api/invoices` tarayıcıda aç
3. Firewall kontrolü yap
4. Backend server çalışıyor mu kontrol et

### Sorun 2: "Cannot connect to server"

**Çözüm:**
1. Backend server IP'sini doğrula (192.168.1.200)
2. Port 3001'in açık olduğunu kontrol et
3. VPN IP range'i kontrol et
4. `netstat -ano | findstr :3001` ile server durumunu kontrol et

### Sorun 3: "Timeout"

**Çözüm:**
1. VPN connection stability kontrol et
2. Network latency test et (`ping 192.168.1.200`)
3. Backend timeout ayarlarını artır
4. Slow query logs kontrol et

### Sorun 4: "SSL/TLS Error"

**Çözüm:**
- HTTP kullanıyorsanız HTTPS'e geçin
- Self-signed certificates için devices'a ekleyin
- Certificate expiry date kontrol edin

---

## 📈 PERFORMANS OPTİMİZASYONU

### VPN<bağlantısı üzerinden:
- **Latency:** Typically 50-200ms
- **Bandwidth:** Depends on VPN provider
- **Data compression:** Enable if available

### Optimizasyon stratejileri:
1. **Caching:** AsyncStorage ile local cache
2. **Pagination:** Large lists için
3. **Debouncing:** Search queries
4. **Image optimization:** Compress images
5. **Lazy loading:** Charts ve large components

---

## 📝 CHECKLIST (Production İçin)

### Pre-deploy:
- [ ] HTTPS upgrade yap
- [ ] Environment variables kullan (.env)
- [ ] API authentication ekle
- [ ] Rate limiting ekle
- [ ] Error logging (Sentry)
- [ ] Performance monitoring
- [ ] Backup strategy
- [ ] Security audit

### Post-deploy:
- [ ] VPN connection test et (multiple locations)
- [ ] Load testing yap
- [ ] Security scan yap
- [ ] Documentation güncelle
- [ ] Team training yap

---

## 🎯 SONUÇ

✅ **VPN modülü başarıyla kuruldu!**

**Şimdi yapabilirsiniz:**
- İstanbul'da olun, VPN açın → Bağlan ✅
- New York'ta olun, VPN açın → Bağlan ✅
- Tokyo'da olun, VPN açın → Bağlan ✅
- **Dünyanın herhangi bir yerinden!** 🌍

**Next steps:**
1. VPN bağlantısını test edin
2. Farklı lokasyonlardan test edin
3. HTTPS upgrade planlayın
4. Production deployment hazırlayın

---

**Hazırlayan:** Gemini AI  
**Tarih:** 04.02.2026  
**Durum:** ✅ VPN MODE ACTIVE

---
