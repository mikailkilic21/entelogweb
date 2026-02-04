# 📱 Mobil Navigasyon Yeniden Yapılandırma Planı

## 🎯 Hedef
Mobil uygulamaya Banka sekmesi eklemek ve sekmeleri gruplandırarak sadeleştirmek

---

## 📊 Mevcut Durum (7 Sekme - ÇOK FAZLA!)

1. 🏠 Panel (Dashboard)
2. 👥 Cariler (Accounts)
3. 📦 Stok (Products)
4. 🧾 Faturalar (Invoices)
5. 📄 Sipariş (Orders)
6. 💰 Çek/Senet (Checks)
7. ⚙️ Ayarlar (Settings)

**Sorun:** Alt tab bar çok kalabalık!

---

## ✅ Yeni Yapı (4 Ana Sekme + Menu)

### Bottom Tabs:
1. 🏠 **Panel** - Dashboard, stats, charts
2. 📊 **İşlemler** - Transaction hub (grouped)
3. 🏦 **Bankalar** - Bank accounts & transactions (NEW!)
4. ⋮ **Daha Fazla** - More menu (grouped)

### İşlemler Sekmesi (Transaction Hub):
```
┌─────────────────────────────────────┐
│  İşlemler                            │
├─────────────────────────────────────┤
│  📦 Stok ve Ürünler                 │
│  🧾 Faturalar                       │
│  📄 Siparişler                      │
│  💰 Çek ve Senetler                 │
│  👥 Cari Hesaplar                   │
└─────────────────────────────────────┘
```

### Daha Fazla Sekmesi (More Menu):
```
┌─────────────────────────────────────┐
│  Daha Fazla                          │
├─────────────────────────────────────┤
│  ⚙️ Ayarlar                         │
│  👤 Profil                          │
│  🔔 Bildirimler                     │
│  📊 Raporlar                        │
│  ℹ️ Hakkında                        │
│  🚪 Çıkış Yap                       │
└─────────────────────────────────────┘
```

---

## 🏦 Bankalar Sekmesi Özellikleri

Web'deki Banks.jsx'den alınacak özellikler:

### 1. Banka Hesapları Listesi
- Banka logoları (Ziraat, QNB, Albaraka, İş Bankası, Kuveyt Türk)
- Hesap numaraları
- Bakiyeler
- IBAN bilgileri

### 2. Banka Hareketleri (Transactions)
- Gelen ödemeler (ArrowDownRight)
- Giden ödemeler (ArrowUpRight)
- Tarih, tutar, açıklama
- Filter by bank

### 3. Stats Kartları
- Toplam bakiye
- Gelen ödemeler toplamı
- Giden ödemeler toplamı
- Net durum

### 4. Arama ve Filtreleme
- Banka adına göre arama
- Tarih aralığı filtresi
- İşlem tipi filtresi

---

## 📁 Dosya Yapısı

```
mobile/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx (YENİDEN YAPILANDIRILACAK)
│   │   ├── index.tsx (Dashboard - mevcut)
│   │   ├── transactions.tsx (YENİ - Hub)
│   │   ├── banks.tsx (YENİ - Banks sayfası)
│   │   └── more.tsx (YENİ - More menu)
│   ├── transaction-detail/
│   │   ├── accounts.tsx (taşınacak)
│   │   ├── products.tsx (taşınacak)
│   │   ├── invoices.tsx (taşınacak)
│   │   ├── orders.tsx (taşınacak)
│   │   └── checks.tsx (taşınacak)
```

---

## 🔧 İmplementasyon Adımları

### Adım 1: Transaction Hub Oluştur
- `app/(tabs)/transactions.tsx` oluştur
- Grid/List view ile transaction types göster
- Her item click'te ilgili sayfaya route et

### Adım 2: More Menu Oluştur
- `app/(tabs)/more.tsx` oluştur
- Settings ve diğer options göster
- Logout button ekle

### Adım 3: Banks Sayfası Oluştur
- `app/(tabs)/banks.tsx` oluştur
- Web'deki Banks.jsx'i React Native'e adapt et
- Bank logos, accounts, transactions

### Adım 4: Tab Layout Güncelle
- 4 ana tab: Panel, İşlemler, Bankalar, Daha Fazla
- Eski tabs'ları kaldır

### Adım 5: Eski Sayfaları Taşı
- accounts, products, invoices, orders, checks
- `transaction-detail/` folder'a taşı
- Routing güncelle

---

## 🎨 UI/UX İyileştirmeleri

### Transaction Hub Cards:
```tsx
<TouchableOpacity onPress={() => router.push('/transaction-detail/products')}>
  <Card>
    <Icon>📦</Icon>
    <Title>Stok ve Ürünler</Title>
    <Subtitle>328 ürün</Subtitle>
  </Card>
</TouchableOpacity>
```

### Banks Sayfası Layout:
```
┌─────────────────────────────────┐
│  Toplam Bakiye: 1,234,567 TL   │
├─────────────────────────────────┤
│  [Banka 1] Ziraat Bankası       │
│  TR12 0001 0000 0012 3456 7890  │
│  Bakiye: 500,000 TL             │
├─────────────────────────────────┤
│  [Banka 2] QNB Finansbank       │
│  TR34 0011 1000 0098 7654 3210  │
│  Bakiye: 734,567 TL             │
└─────────────────────────────────┘
```

---

## 📊 Gelecek İyileştirmeler

1. **DBS (Direct Debit System)** - Web'deki gibi
2. **Bank statements** - PDF export
3. **Transaction history** - Detailed filtering
4. **Multi-currency support**
5. **Bank account linking** - Open Banking API

---

**Durum:** Plan hazır, implementasyon başlıyor...
