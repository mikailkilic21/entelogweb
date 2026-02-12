<?php
// EnteLog Bilgi Bankası - AI Chat (Gemini 2.0 Flash)
// Manuel Ayarlı Sürüm - Hata Giderme Modu

ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

function sendError($msg, $debug = null) {
    global $userMessage;
    header('Content-Type: application/json');
    
    $phone = "905533912286"; // EnteLog number found in context
    $text = urlencode("Merhaba, web sitenizden yazıyorum." . ($userMessage ? " Sorum: " . $userMessage : ""));
    $waLink = "https://wa.me/$phone?text=$text";

    $friendlyResponse = "Şu an yoğunluk nedeniyle yapay zeka yanıt veremiyor. 😓<br>" .
        "Sorunuzu doğrudan WhatsApp hattımıza iletebilirsiniz:<br><br>" .
        "<a href='$waLink' target='_blank' class='inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-3 rounded-xl font-bold hover:bg-[#128C7E] transition-colors no-underline shadow-lg shadow-green-500/20'>" .
        // SVG icon for WhatsApp (since Lucide might not render dynamically without call)
        "<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21'/><path d='M9 10a2.013 2.013 0 0 1 .6 1.3 6.643 6.643 0 0 1-2.9 5.8 5.768 5.768 0 0 1-5.6.8'/></svg>" .
        "WhatsApp ile Devam Et</a>";

    echo json_encode(['response' => $friendlyResponse, 'debug' => $msg]); // Keep msg only in debug field
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
    $model = 'gemini-pro'; // Stabil sürüme geçildi (v1)
    
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
        
    // --------------------------------------------------------------------------
    // GEMINI ENTEGRASYONU (FALLBACK MEKANİZMALI)
    // --------------------------------------------------------------------------
    
    function callGemini($apiKey, $model, $apiVersion, $contents) {
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
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if (curl_errno($ch)) {
            return ['success' => false, 'error' => curl_error($ch)];
        }
        curl_close($ch);
        
        $response = json_decode($result, true);
        
        if ($httpCode !== 200 || isset($response['error'])) {
             $msg = $response['error']['message'] ?? "HTTP $httpCode";
             return ['success' => false, 'error' => $msg, 'raw' => $result];
        }
        
        return ['success' => true, 'data' => $response];
    }
        
    // Prompt Hazırlama
    $fullPrompt = $systemContext . "\n\nKonuşma Geçmişi:\n";
    foreach ($history as $h) {
            $r = ($h['role'] === 'user') ? 'Kullanıcı' : 'Sen';
            $fullPrompt .= "$r: " . str_replace('"', "'", $h['content']) . "\n";
    }
    $fullPrompt .= "Kullanıcı: " . str_replace('"', "'", $userMessage) . "\nSen:";
    $contents = [['role' => 'user', 'parts' => [['text' => $fullPrompt]]]];

    // 1. Deneme: Gemini 1.5 Flash (Hızlı ve Güncel)
    $attempt1 = callGemini($apiKey, 'gemini-1.5-flash', 'v1beta', $contents);
    
    if ($attempt1['success']) {
         $finalResponse = $attempt1['data'];
    } else {
        // 2. Deneme: Gemini Pro (Stabil Fallback)
        $attempt2 = callGemini($apiKey, 'gemini-pro', 'v1beta', $contents);
        
        if ($attempt2['success']) {
            $finalResponse = $attempt2['data'];
        } else {
            // Her ikisi de başarısız
            throw new Exception("Modeller yanıt vermedi. (1: " . $attempt1['error'] . ", 2: " . $attempt2['error'] . ")");
        }
    }

    if (isset($finalResponse['candidates'][0]['content']['parts'][0]['text'])) {
        echo json_encode(['response' => $finalResponse['candidates'][0]['content']['parts'][0]['text']]);
    } else {
        sendError('Gemini API beklenmedik bir yanıt döndü.', $finalResponse);
    }

} catch (Exception $e) {
    sendError($e->getMessage());
}
?>
