<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

// Hata gizlemeyi açalım, JSON formatı bozulmasın
error_reporting(0);
ini_set('display_errors', 0);

// ==========================================================================
// 1. SMTP AYARLARI (Lütfen Burayı Düzenleyin)
// ==========================================================================
define('SMTP_HOST', 'mail.kurumsaleposta.com');
define('SMTP_PORT', 587);                     // Port 587
define('SMTP_USER', 'info@entelog.com.tr');   // E-posta adresi
define('SMTP_PASS', 'Sg_1.E5hdwQ8W_=2');      // E-posta şifresi
define('SMTP_SECURE', 'none');                // Güvenlik: Yok (Sunucu TLS desteklemediğini söyledi)
// ==========================================================================


if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $name = strip_tags(trim($_POST["name"]));
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    $phone = strip_tags(trim($_POST["phone"]));
    $company = strip_tags(trim($_POST["company"] ?? ''));
    $erp = strip_tags(trim($_POST["erp_software"] ?? ''));
    $sector = strip_tags(trim($_POST["sector"] ?? ''));
    $employees = strip_tags(trim($_POST["employee_count"] ?? ''));
    $message = strip_tags(trim($_POST["message"] ?? ''));

    if (empty($name) || empty($phone) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["status" => "error", "message" => "Lütfen zorunlu alanları doldurunuz."]);
        exit;
    }

    $subject = "YENI TALEP: $company - $name";
    $body = "
    <h2>Yeni Web Talebi</h2>
    <table border='1' cellpadding='10' cellspacing='0' style='border-collapse: collapse; width: 100%; max-width: 600px;'>
        <tr><td width='30%'><strong>Ad Soyad:</strong></td><td>$name</td></tr>
        <tr><td><strong>Firma:</strong></td><td>$company</td></tr>
        <tr><td><strong>E-posta:</strong></td><td>$email</td></tr>
        <tr><td><strong>Telefon:</strong></td><td>$phone</td></tr>
        <tr><td><strong>ERP Yazılımı:</strong></td><td>$erp</td></tr>
        <tr><td><strong>Sektör:</strong></td><td>$sector</td></tr>
        <tr><td><strong>Çalışan Sayısı:</strong></td><td>$employees</td></tr>
        <tr><td><strong>Mesaj:</strong></td><td>$message</td></tr>
    </table>
    <hr>
    <p>Bu mesaj entelog.com.tr web sitesinden gönderilmiştir.</p>
    ";

    // SMTP Gönderimi Başlat
    $result = sendSmtpEmail(SMTP_USER, $subject, $body, $email, $name);

    if ($result === true) {
        // ------------------------------------------------------------------
        // YENİ: Veriyi JSON dosyasına kaydet (Admin Paneli İçin)
        // ------------------------------------------------------------------
        $messageData = [
            'id' => uniqid(),
            'date' => date('Y-m-d H:i:s'),
            'name' => $name,
            'company' => $company,
            'email' => $email,
            'phone' => $phone,
            'erp' => $erp,
            'sector' => $sector,
            'employees' => $employees,
            'message' => $message,
            'ip' => $_SERVER['REMOTE_ADDR'],
            'status' => 'new' // Okunmadı/Yeni durumu
        ];

        $file = 'messages.json';
        $current_data = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
        if (!is_array($current_data)) $current_data = [];
        
        // En başa ekle (En yeni en üstte)
        array_unshift($current_data, $messageData);
        
        // Dosyayı kaydet
        file_put_contents($file, json_encode($current_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        // ------------------------------------------------------------------

        echo json_encode(["status" => "success", "message" => "Talebiniz başarıyla alındı. Teşekkürler!"]);
    } else {
        // Hata detayını sadece geliştirici görsün diye loglayabiliriz ama kullanıcıya genel hata dönüyoruz
        echo json_encode(["status" => "error", "message" => "Sunucu hatası: Mail gönderilemedi. Lütfen daha sonra deneyin. ($result)"]);
    }

} else {
    echo json_encode(["status" => "error", "message" => "Yetkisiz erişim."]);
}


// ==========================================================================
// 2. YARDIMCI SMTP FONKSİYONU (Harici kütüphane gerektirmez)
// ==========================================================================
function sendSmtpEmail($to, $subject, $message, $replyToEmail, $replyToName) {
    
    $host = SMTP_HOST;
    $port = SMTP_PORT;
    $username = SMTP_USER;
    $password = SMTP_PASS;

    // SSL Sertifika doğrulamasını atlayalım (Hosting uyumluluğu için)
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        ]
    ]);

    // Bağlantı (stream_socket_client kullanacağız, fsockopen yerine)
    $socket = stream_socket_client("tcp://$host:$port", $errno, $errstr, 30, STREAM_CLIENT_CONNECT, $context);
    
    if (!$socket) return "Bağlantı Hatası: $errstr ($errno) - Host: $host Port: $port";

    // Sunucu yanıtlarını okuma fonksiyonu (Debug Modlu)
    function read_smtp_response($socket) {
        $response = "";
        while ($str = fgets($socket, 515)) {
            $response .= $str;
            if (substr($str, 3, 1) == " ") break;
        }
        return $response;
    }
    
    $log = "";
    
    // Bağlantı
    $log .= "CONNECT: " . read_smtp_response($socket) . "\n";

    // HELO / EHLO
    fputs($socket, "EHLO $host\r\n");
    $log .= "EHLO: " . read_smtp_response($socket) . "\n";

    // TLS Başlatma (Sunucu TLS desteklemediği için bu bloğu kapattık)
    /*
    if (SMTP_SECURE === 'tls') {
        fputs($socket, "STARTTLS\r\n");
        $log .= "STARTTLS: " . read_smtp_response($socket) . "\n";
        stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        fputs($socket, "EHLO $host\r\n");
        $log .= "EHLO (After TLS): " . read_smtp_response($socket) . "\n";
    }
    */

    // AUTH LOGIN
    fputs($socket, "AUTH LOGIN\r\n");
    $log .= "AUTH LOGIN: " . read_smtp_response($socket) . "\n";

    fputs($socket, base64_encode($username) . "\r\n");
    $log .= "USER: " . read_smtp_response($socket) . "\n";

    fputs($socket, base64_encode($password) . "\r\n");
    $authResult = read_smtp_response($socket);
    $log .= "PASS: " . $authResult . "\n";

    // Kimlik doğrulama kontrolü
    if (strpos($authResult, '235') === false) {
        fclose($socket);
        return "Kimlik Doğrulama Hatası (SMTP Log):\n" . $log;
    }

    // Mail Gönderimi
    fputs($socket, "MAIL FROM: <$username>\r\n");
    $log .= "MAIL FROM: " . read_smtp_response($socket) . "\n";

    fputs($socket, "RCPT TO: <$to>\r\n");
    $log .= "RCPT TO: " . read_smtp_response($socket) . "\n";

    fputs($socket, "DATA\r\n");
    $log .= "DATA: " . read_smtp_response($socket) . "\n";

    // Headers
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: EnteLog Web <$username>\r\n";
    $headers .= "Reply-To: $replyToName <$replyToEmail>\r\n";
    $headers .= "Subject: $subject\r\n";
    $headers .= "X-Mailer: PHP-Custom-SMTP\r\n";

    fputs($socket, "$headers\r\n$message\r\n.\r\n");
    $sendResult = read_smtp_response($socket);
    $log .= "SEND: " . $sendResult . "\n";

    fputs($socket, "QUIT\r\n");
    fclose($socket);

    if (strpos($sendResult, '250') !== false) {
        return true;
    } else {
        return "Gönderim Hatası (SMTP Log):\n" . $log;
    }
}
?>
