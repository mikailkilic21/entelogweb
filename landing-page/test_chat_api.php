<?php
$apiKey = 'AIzaSyDYSE5v62mJekQTHiqDLroTW4z3OAqqta0';
$url = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=" . $apiKey;

$data = [
    'contents' => [
        [
            'parts' => [
                ['text' => 'Merhaba, nasılsın?']
            ]
        ]
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo 'Curl Error: ' . curl_error($ch);
}
curl_close($ch);

echo "<h3>API Yanıtı:</h3>";
echo "<pre>" . htmlspecialchars($response) . "</pre>";
?>
