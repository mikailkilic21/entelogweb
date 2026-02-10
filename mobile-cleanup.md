# Mobile Cleanup & Quality Improvement Plan

## Goal
Entelog Mobile uygulamasındaki 70 lint problemini çözmek, büyük dosyaları refactor etmek, type safety'yi artırmak ve test altyapısını kurmak.

## Mevcut Durum
- **Lint:** 1 error + 69 warning = 70 problem
- **God Components:** banks.tsx (551), settings.tsx (385), checks.tsx (360)
- **Type Safety:** Yaygın `any` kullanımı
- **Test:** Hiç test dosyası yok
- **Data Layer:** REST + GraphQL karışık

---

## Phase 1: Lint Temizliği (Öncelik: 🔴 Yüksek)

- [ ] **1.1** Unused imports temizle (35 uyarı) → Tüm dosyalardaki kullanılmayan import'ları kaldır
  - `accounts.tsx`: MapPin, Phone, Mail, ArrowUpRight, ArrowDownLeft, Users, TrendingUp, TrendingDown
  - `banks.tsx`: FlatList, user, activeDBSTab, setActiveDBSTab
  - `checks.tsx`: router
  - `index.tsx`: useCallback, Search, user
  - `invoices.tsx`: TrendingUp, TrendingDown, Calendar, Filter, CheckCircle, XCircle
  - `orders.tsx`: Filter, Truck, CheckCircle, ChevronRight, X
  - `products.tsx`: CameraIcon
  - `_layout.tsx`: inAuthGroup
  - `account/[id].tsx`: Building2, FileText
  - `invoices/[id].tsx`: Calendar, FileText, Tag
  - `license/index.tsx`: user
  - `more/notifications.tsx`: Bell
  - `more/reports.tsx`: ArrowDownRight
  - `orders/[id].tsx`: Package, Calendar, MapPin
  - `products/[id].tsx`: filteredTransactions
  - `system-settings.tsx`: Check, error (2x)
  - `FinanceDetailModal.tsx`: BlurView, isIncome
  - Verify: `npx expo lint` → 0 unused-vars warning

- [ ] **1.2** `exhaustive-deps` uyarılarını çöz (15 uyarı) → Her dosyada eksik dependency'leri ekle veya `useCallback` ile sar
  - `accounts.tsx`: fetchData'ya isDemo ekle, useEffect'e fetchData ekle
  - `checks.tsx`: fetchData'ya isDemo ekle, useEffect'e fetchData ekle
  - `index.tsx`: useEffect'e fetchData ekle
  - `invoices.tsx`: fetchData'ya isDemo ekle, useEffect'e fetchData ekle
  - `orders.tsx`: fetchData'ya isDemo ekle, useEffect'e fetchData ekle
  - `products.tsx`: useEffect'e isDemo ve fetchData ekle
  - `settings.tsx`: useEffect'e opacity, rotateX, scale ekle
  - `_layout.tsx`: useEffect'e router ekle
  - `account/[id].tsx`: useEffect'e fetchAccountDetails ekle
  - `invoices/[id].tsx`: useEffect'e fetchDetails ekle
  - `orders/[id].tsx`: useEffect'e fetchDetails ekle
  - `products/[id].tsx`: useEffect'e warehouse ekle
  - `system-settings.tsx`: useEffect'e fetchData ekle
  - Verify: `npx expo lint` → 0 exhaustive-deps warning

- [ ] **1.3** `eqeqeq` uyarılarını çöz (4 uyarı) → `settings.tsx` satır 328, 337, 360, 373'teki `==` → `===` değiştir
  - Verify: `npx expo lint` → 0 eqeqeq warning

- [ ] **1.4** `EnvironmentBadge.tsx` error'ü çöz → satır 71'deki `'` → `&apos;` escape et
  - Verify: `npx expo lint` → 0 error

**Phase 1 Done When:** `npx expo lint` → ✨ 0 problems (0 errors, 0 warnings)

---

## Phase 2: Refactoring (Öncelik: 🟡 Orta)

- [ ] **2.1** `banks.tsx` (551 satır) parçala:
  - `components/banks/BankStats.tsx` — renderStats fonksiyonu
  - `components/banks/BankTabs.tsx` — renderTabs fonksiyonu
  - `components/banks/BankAccounts.tsx` — renderAccounts fonksiyonu
  - `components/banks/BankTransactions.tsx` — renderTransactions fonksiyonu
  - `components/banks/DBSSection.tsx` — renderDBS fonksiyonu
  - `data/mockBanks.ts` — getMockBanks, getMockStats, getMockTransactions
  - Verify: banks.tsx < 150 satır, uygulama hatasız çalışır

- [ ] **2.2** `settings.tsx` (385 satır) parçala:
  - `components/settings/MenuCard.tsx` — MenuCard bileşeni
  - `components/settings/FirmPeriodSelector.tsx` — Firma/dönem seçim modal'ları
  - `hooks/useDbConfig.ts` — fetchDbConfig, fetchFirms, fetchPeriods mantığı
  - Verify: settings.tsx < 150 satır, ayarlar ekranı çalışır

- [ ] **2.3** `checks.tsx` (360 satır) parçala:
  - `components/checks/CheckHeader.tsx` — renderHeader fonksiyonu
  - `components/checks/CheckItem.tsx` — renderItem fonksiyonu
  - Verify: checks.tsx < 200 satır, çek ekranı çalışır

- [ ] **2.4** `console.log` temizliği:
  - `services/graphql.ts`: satır 10 `console.log` → `__DEV__` guard ekle
  - Tüm ekranlardaki production `console.error` → uygun logging
  - Verify: grep ile production console.log bulunmaz

- [ ] **2.5** `_layout.tsx` düzelt:
  - Kullanılmayan `inAuthGroup` değişkenini kaldır (Phase 1'de yapılacak)
  - Tab layout'ta tanımlı `menu` screen'i var ama dosyası yok → kaldır veya dosya oluştur
  - Verify: Hata vermeden uygulama açılır

**Phase 2 Done When:** Hiçbir dosya 200 satırı geçmez (charts hariç), mock data ayrı dosyalarda

---

## Phase 3: Type Safety (Öncelik: 🟡 Orta)

- [ ] **3.1** `types/index.ts` genişlet:
  - `Invoice` interface ekle
  - `Order` interface ekle
  - `Check` interface ekle
  - `DashboardData` interface ekle
  - `DBSCustomer` interface ekle
  - Verify: Tüm `any` kullanımları tip tanımlı olur

- [ ] **3.2** `any` kullanımlarını temizle:
  - `orders.tsx`: `useState<any[]>` → `useState<Order[]>`
  - `settings.tsx`: `MenuCard({ children, onPress, colors }: any)` → proper types
  - `banks.tsx`: transaction handler'da `any` → `Transaction`
  - Verify: grep `": any"` → 0 sonuç (mümkün olduğunca)

- [ ] **3.3** Data fetching katmanını tutarlı yap:
  - Karar ver: REST mi GraphQL mi? (Öneri: REST, çünkü çoğunluk REST)
  - Eğer GraphQL kalacaksa products dışında da kullan
  - `services/api.ts` oluştur → Merkezi fetch helper (headers, error handling)
  - Verify: Tüm API çağrıları tek katman üzerinden geçer

**Phase 3 Done When:** `any` kullanımı minimumda, tüm veri tipleri tanımlı

---

## Phase 4: Test Altyapısı (Öncelik: 🔵 Düşük → Uzun Vadeli)

- [ ] **4.1** Jest + React Native Testing Library kur:
  - `npm install --save-dev jest @testing-library/react-native @testing-library/jest-native`
  - `jest.config.js` oluştur
  - `package.json`'a `"test": "jest"` script'i ekle
  - Verify: `npm test` → boş çalışır (no tests found ama hata vermez)

- [ ] **4.2** İlk unit testleri yaz:
  - `__tests__/utils/chartHelpers.test.ts` — formatCurrency, formatDateLabel
  - `__tests__/constants/Config.test.ts` — Environment config
  - `__tests__/context/AuthContext.test.tsx` — signIn, signOut
  - Verify: `npm test` → 3 test suite, hepsi pass

- [ ] **4.3** Component testleri yaz:
  - `__tests__/components/ProductItem.test.tsx` — render + props
  - `__tests__/components/OrderItem.test.tsx` — render + status badge
  - `__tests__/components/BankCard.test.tsx` — render + format
  - Verify: `npm test` → 6 test suite, hepsi pass

**Phase 4 Done When:** `npm test` → tüm testler yeşil, en az %30 coverage kritik utils'te

---

## Uygulama Sırası

```
Phase 1 (Lint)  →  Hemen yapılmalı, 30-45 dk
Phase 2 (Refactor) →  Lint sonrası, 1-2 saat
Phase 3 (Types) →  Refactor ile paralel, 1 saat
Phase 4 (Tests) →  Son adım, 1-2 saat
```

## Notes
- Her phase sonrası `npx expo lint` çalıştır
- Her phase sonrası uygulamayı Expo Go'da test et
- Her phase sonrası git commit at
- Phase 2 ve 3 paralel yapılabilir ama Phase 1 önce bitmeli
