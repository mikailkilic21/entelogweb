# Entelogweb Dashboard

Modern, responsive web dashboard for LOGO Go Wingsoo ERP sistemi. React + Vite frontend ve Node.js + Express backend ile geliştirilmiştir.

## Özellikler

- 📊 **Dashboard**: Gerçek zamanlı satış ve alış istatistikleri
- 👥 **Cari Hesaplar**: Müşteri ve tedarikçi yönetimi
- 📦 **Stok Yönetimi**: Ürün takibi ve stok kontrolü
- 🧾 **Faturalar**: Fatura listesi ve detaylarıı 🛒 **Siparişler**: Sipariş takibi
- 💰 **Çek/Senet**: Çek ve senet yönetimi
- ⚙️ **Ayarlar**: Firma ve şirket bilgileri yönetimi
- 🔄 **Firma/Dönem Değiştirme**: SQL-tabanlı dinamik firma ve dönem seçimi

## Teknolojiler

### Frontend
- React 18
- Vite
- React Router v7
- Recharts (Grafikler)
- Lucide React (İkonlar)
- Tailwind CSS

### Backend
- Node.js
- Express.js
- MSSQL (Logo Go Wings veritabanı)
- Multer (Dosya yükleme)

## Kurulum

### Gereksinimler
- Node.js 16+
- LOGO Go Wings ERP
- MSSQL Server

### Adımlar

1. **Projeyi klonlayın:**
```bash
git clone https://github.com/mikailkilic21/entelogweb.git
cd entelogweb
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Veritabanı yapılandırması:**

`server/src/config/db-config.json` dosyasını oluşturun:
```json
{
  "server": "YOUR_SERVER\\SQLEXPRESS",
  "database": "LOGO_DB",
  "user": "sa",
  "password": "YOUR_PASSWORD",
  "firmNo": "113",
  "periodNo": "01",
  "encrypt": false,
  "trustServerCertificate": true
}
```

4. **Projeyi çalıştırın:**
```bash
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3001

## Proje Yapısı

```
entelogweb/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/    # React bileşenleri
│   │   ├── pages/        # Sayfa bileşenleri
│   │   └── App.jsx       # Ana uygulama
│   └── package.json
├── server/                # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/       # Veritabanı yapılandırması
│   │   ├── controllers/  # API kontrolcüleri
│   │   └── routes/       # API rotaları
│   ├── data/            # JSON veritabanı (company-db.json)
│   ├── public/          # Statik dosyalar
│   └── package.json
└── package.json          # Root package (concurrently)
```

## API Endpoints

### İstatistikler
- `GET /api/stats?period={daily|weekly|monthly|yearly}` - Genel istatistikler
- `GET /api/stats/trend?period={period}` - Trend verileri
- `GET /api/stats/top-products?period={period}` - En çok satan ürünler
- `GET /api/stats/top-customers?period={period}` - En çok alışveriş yapan müşteriler
- `GET /api/stats/top-suppliers?period={period}` - En çok alım yapılan tedarikçiler

### Cari Hesaplar
- `GET /api/accounts?type={customer|supplier}&search={query}` - Cari hesap listesi
- `GET /api/accounts/:id` - Cari hesap detayları
- `GET /api/accounts/stats` - Cari hesap istatistikleri

### Ürünler
- `GET /api/products` - Ürün listesi
- `GET /api/products/:id` - Ürün detayları

### Faturalar
- `GET /api/invoices` - Fatura listesi
- `GET /api/invoices/:id` - Fatura detayları

### Çek/Senet
- `GET /api/checks` - Çek/senet listesi
- `GET /api/checks/payroll/:id` - Çek bordro detayları

### Firmalar
- `GET /api/firms` - Firma listesi
- `GET /api/firms/:firmNo/periods` - Firma dönemleri
- `POST /api/settings/db/switch` - Firma/dönem değiştir

## Güvenlik Notları

⚠️ **ÖNEMLİ**: Aşağıdaki dosyaları asla Git'e eklemeyin:
- `server/src/config/db-config.json` - Veritabanı kimlik bilgileri
- `server/data/` - Şirket verileri
- `.env` dosyaları

## Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## Lisans

Bu proje özel kullanım içindir.

## İletişim

Mikail KILIÇ - mikailkilic21@gmail.com

Proje Linki: [https://github.com/mikailkilic21/entelogweb](https://github.com/mikailkilic21/entelogweb)
