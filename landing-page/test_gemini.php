<?php
// Gemini API Key Test Scripti
// Tarayıcıdan çalıştırıp sonucu görebilirsiniz: test_gemini.php

header('Content-Type: text/plain; charset=utf-8');

// Manuel API Key (Yeni Hesap 2)
$apiKey = 'AIzaSyDYSE5v62mJekQTHiqDLroTW4z3OAqqta0';

echo "API Key Kullanılıyor: " . substr($apiKey, 0, 5) . "..." . substr($apiKey, -5) . "\n\n";

// Mevcut Modelleri Listele
$url = "https://generativelanguage.googleapis.com/v1beta/models?key=" . $apiKey;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    echo "CURL Hatası: " . curl_error($ch);
} else {
    echo "HTTP Kodu: $httpCode\n";
    $data = json_decode($response, true);
    
    if (isset($data['models'])) {
        echo "Mevcut Modeller:\n";
        foreach ($data['models'] as $m) {
            echo "- " . $m['name'] . " (" . implode(', ', $m['supportedGenerationMethods']) . ")\n";
        }
    } else {
        echo "Hata Yanıtı:\n";
        print_r($data);
    }
}
curl_close($ch);
?>
