<?php
// EnteLog Bilgi Bankası - AI Chat (Gemini 2.0 Flash)
// Manuel Ayarlı Sürüm - Hata Giderme Modu

ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

function sendError($msg, $debug = null) {
    header('Content-Type: application/json');
    // Frontend 'response' beklediği için hatayı da bu formatta dönüyoruz
    echo json_encode(['response' => "Üzgünüm, şu an bağlantıda bir yoğunluk var (" . $msg . "). Lütfen kısa bir süre sonra tekrar deneyin.", 'debug' => $debug]);
    exit;
}

register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== NULL && $error['type'] === E_ERROR) {
        sendError('Kritik PHP Hatası: ' . $error['message']);
    }
});

try {
    // --------------------------------------------------------------------------
    // SABİT AYARLAR (Config Yerine Doğrudan Tanım)
    // --------------------------------------------------------------------------
    $provider = 'gemini';
    $apiKey = 'AIzaSyDYSE5v62mJekQTHiqDLroTW4z3OAqqta0'; 
    $model = 'gemini-1.5-flash'; // Kota sorunu nedeniyle daha hafif/eski modele dönüş
    
    // --------------------------------------------------------------------------
    // İSTEK KONTROLÜ
    // --------------------------------------------------------------------------
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST');

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Sadece POST istekleri kabul edilir.');
    }

    $rawInput = file_get_contents('php://input');
    if (!$rawInput) throw new Exception('Veri alınamadı.');

    $input = json_decode($rawInput, true);
    if (json_last_error() !== JSON_ERROR_NONE) throw new Exception('Geçersiz JSON verisi.');

    $userMessage = $input['message'] ?? '';
    $history = $input['history'] ?? [];

    if (empty($userMessage)) throw new Exception('Mesaj boş olamaz.');

    // --------------------------------------------------------------------------
    // SİSTEM BİLGİSİ (PROMPT)
    // --------------------------------------------------------------------------
    $systemContext = "
SEN KİMSİN:
Sen EnteLog'un akıllı yapay zeka asistanısın. İsmim 'EnteLog AI'. 
Görevin web sitesini ziyaret eden potansiyel müşterilerin sorularını yanıtlamak, onlara EnteLog'un özelliklerini anlatmak ve satışa yönlendirmek.

KURALLAR (ÇOK ÖNEMLİ):
1. SADECE EnteLog ile ilgili soruları cevapla. 
2. Eğer kullanıcı genel kültür, tarih, siyaset, yemek tarifi, kodlama yardımı veya EnteLog dışındaki herhangi bir konu sorarsa; nazikçe 'Ben sadece EnteLog ERP sistemleri hakkında yardımcı olabilirim. Projemizle ilgili sorularınızı bekliyorum.' şeklinde cevap ver.
3. Cevapların kısa, net ve satış odaklı olsun.
4. Profesyonel ama samimi bir dil kullan.

BİLMEN GEREKEN ENTELOG BİLGİLERİ:
- Nedir?: EnteLog, işletmelere özel geliştirilen, Web ve Mobil senkronize çalışan yeni nesil bir ERP çözümüdür. Standart paket program değildir, firmaya özel modüller geliştirilir.
- En Önemli Özelliği: 'Paket programların sınırlarına takılmayın.' mottosuyla çalışır. İşletmenin yoğurt yiyişine göre şekillenir.
- Platformlar: Web Paneli ve %100 Native Mobil Uygulama (iOS ve Android) tek veritabanında çalışır.
- Modüller: 
  - Stok Yönetimi (Depo bazlı, stok yaşlandırma)
  - Finans Yönetimi (Cari, Çek/Senet, Vade takibi)
  - Banka ve DBS (Doğrudan Borçlandırma Sistemi) Entegrasyonu
  - PDF Sipariş Analizi (Tedarikçi sipariş PDF'lerini okuyup sisteme işleyen yapay zeka modülü)
  - Özel Raporlama
- Mevcut Yazılımlar: Logo, Netsis, Mikro gibi programlardan veri aktarımı mümkündür.
- İletişim: Müşteri 'Teklif Alın' veya 'İletişim' formunu doldurmalı veya WhatsApp hattından yazmalıdır. Asla doğrudan bir fiyat verme.
  - Eğer kullanıcı iletişim kurmak isterse veya WhatsApp sorarsa: 'Bize +90 553 391 22 86 numarasından WhatsApp üzerinden ulaşabilirsiniz.' şeklinde yönlendirme yap.
  - Asla 'ihtiyaçlarınıza göre özel fiyatlandırma yapıyoruz' de, net fiyat verme.

DİL: Türkçe konuş.
";

    // --------------------------------------------------------------------------
    // GEMINI ENTEGRASYONU
    // --------------------------------------------------------------------------
        
    // Prompt Hazırlama
    $fullPrompt = $systemContext . "\n\nKonuşma Geçmişi:\n";
    foreach ($history as $h) {
            $r = ($h['role'] === 'user') ? 'Kullanıcı' : 'Sen';
            $fullPrompt .= "$r: " . str_replace('"', "'", $h['content']) . "\n";
    }
    $fullPrompt .= "Kullanıcı: " . str_replace('"', "'", $userMessage) . "\nSen:";

    $contents = [['role' => 'user', 'parts' => [['text' => $fullPrompt]]]];

    // API URL - Gemini 2.0 için v1beta
    $apiVersion = 'v1beta';

    // Model adının başında 'models/' varsa temizleyelim
    if (strpos($model, 'models/') === 0) {
        $model = substr($model, 7);
    }
    
    $url = "https://generativelanguage.googleapis.com/{$apiVersion}/models/{$model}:generateContent?key=" . $apiKey;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'contents' => $contents,
        'generationConfig' => ['temperature' => 0.7, 'maxOutputTokens' => 1024]
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $result = curl_exec($ch);
    if (curl_errno($ch)) throw new Exception('Gemini Bağlantı Hatası: ' . curl_error($ch));
    curl_close($ch);

    $response = json_decode($result, true);
    
    // Hata Kontrolü
    if (isset($response['error'])) {
        $errMsg = $response['error']['message'] ?? 'Bilinmeyen API Hatası';
        
         if(strpos($errMsg, 'quota') !== false) {
             throw new Exception("Kota Aşıldı: Ücretsiz API limitine takıldık. 1 dakika sonra tekrar deneyin.");
        }
        
        throw new Exception("Gemini API Hatası: $errMsg");
    }

    if (isset($response['candidates'][0]['content']['parts'][0]['text'])) {
        echo json_encode(['response' => $response['candidates'][0]['content']['parts'][0]['text']]);
    } else {
        // Yanıt boş veya farklı formatta ise debug verisi dönelim
        sendError('Gemini API beklenmedik bir yanıt döndü.', $response);
    }

} catch (Exception $e) {
    sendError($e->getMessage());
}
?>
