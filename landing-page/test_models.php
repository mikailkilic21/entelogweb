<?php
$apiKey = 'AIzaSyDYSE5v62mJekQTHiqDLroTW4z3OAqqta0';
$url = "https://generativelanguage.googleapis.com/v1beta/models?key=" . $apiKey;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

if (isset($data['models'])) {
    echo "<h1>Mevcut Modeller:</h1><ul>";
    foreach ($data['models'] as $model) {
        if (strpos($model['name'], 'gemini') !== false && in_array('generateContent', $model['supportedGenerationMethods'])) {
            echo "<li>" . $model['name'] . " (" . $model['version'] . ")</li>";
        }
    }
    echo "</ul>";
} else {
    echo "Model listesi alınamadı: " . $response;
}
?>
