<?php
session_start();
header('Content-Type: text/html; charset=utf-8');

// ==========================================================================
// AYARLAR
// ==========================================================================
$admin_user = "admin";
$admin_pass = "entelog2026"; 
$json_file = 'messages.json';
// ==========================================================================

// Çıkış İşlemi
if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: admin.php");
    exit;
}

// Giriş Kontrolü
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['username'])) {
    if ($_POST['username'] === $admin_user && $_POST['password'] === $admin_pass) {
        $_SESSION['logged_in'] = true;
        header("Location: admin.php");
        exit;
    } else {
        $error = "Hatalı kullanıcı adı veya şifre!";
    }
}

// Oturum Kontrolü
$is_logged_in = isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;

// --------------------------------------------------------------------------
// API ACTIONS (AJAX)
// --------------------------------------------------------------------------
if ($is_logged_in && isset($_GET['action'])) {
    
    // Mesajları Getir (Helper)
    function getMessages($file) {
        if (!file_exists($file)) return [];
        $data = json_decode(file_get_contents($file), true);
        return is_array($data) ? $data : [];
    }

    // Mesaj Kaydet (Helper)
    function saveMessages($file, $data) {
        file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    // 1. DURUM GÜNCELLE
    if ($_GET['action'] == 'update_status' && isset($_POST['id']) && isset($_POST['status'])) {
        $messages = getMessages($json_file);
        $updated = false;
        foreach ($messages as &$msg) {
            if ($msg['id'] == $_POST['id']) {
                $msg['status'] = $_POST['status'];
                $updated = true;
                break;
            }
        }
        if ($updated) {
            saveMessages($json_file, $messages);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Mesaj bulunamadı']);
        }
        exit;
    }

    // 2. MESAJ SİL
    if ($_GET['action'] == 'delete_message' && isset($_POST['id'])) {
        $messages = getMessages($json_file);
        $new_messages = [];
        $deleted = false;
        foreach ($messages as $msg) {
            if ($msg['id'] == $_POST['id']) {
                $deleted = true;
                continue; // Bu mesajı atla (sil)
            }
            $new_messages[] = $msg;
        }
        if ($deleted) {
            saveMessages($json_file, $new_messages);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Mesaj bulunamadı']);
        }
        exit;
    }

    // 3. EXCEL (CSV) İNDİR
    if ($_GET['action'] == 'export_csv') {
        $messages = getMessages($json_file);
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=demo_talepleri_' . date('Y-m-d') . '.csv');
        $output = fopen('php://output', 'w');
        
        // BOM for Excel UTF-8
        fputs($output, "\xEF\xBB\xBF");
        
        // Başlıklar
        fputcsv($output, ['ID', 'Tarih', 'Ad Soyad', 'E-posta', 'Telefon', 'Durum', 'IP']);
        
        foreach ($messages as $msg) {
            fputcsv($output, [
                $msg['id'],
                $msg['date'],
                $msg['name'],
                $msg['email'],
                $msg['phone'],
                isset($msg['status']) ? $msg['status'] : 'Yeni',
                $msg['ip']
            ]);
        }
        fclose($output);
        exit;
    }

    // 4. IMAP BODY GETİR
    if ($_GET['action'] == 'get_body' && isset($_GET['id'])) {
        $msg_id = intval($_GET['id']);
        $mailbox = "{mail.kurumsaleposta.com:993/imap/ssl}INBOX";
        $username = "info@entelog.com.tr";
        $password = "Sg_1.E5hdwQ8W_=2";
    
        $inbox = @imap_open($mailbox, $username, $password);
        if ($inbox) {
            $structure = imap_fetchstructure($inbox, $msg_id);
            $body = "";
            $part_num = 1;

            if (isset($structure->parts) && is_array($structure->parts)) {
                foreach ($structure->parts as $key => $part) {
                    if ($part->subtype == 'HTML') {
                        $part_num = $key + 1;
                        break;
                    }
                }
                $body = imap_fetchbody($inbox, $msg_id, $part_num); 
            } else {
                $body = imap_body($inbox, $msg_id);
            }
            
            $encoding = $structure->encoding;
            if (isset($structure->parts) && is_array($structure->parts)) {
                 if(isset($structure->parts[$part_num-1]->encoding)) $encoding = $structure->parts[$part_num-1]->encoding;
            }
    
            if ($encoding == 3) $body = base64_decode($body);
            elseif ($encoding == 4) $body = quoted_printable_decode($body);
            
            $body = mb_convert_encoding($body, "UTF-8", "auto");
            $body = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', "", $body);
            
            echo $body;
            imap_close($inbox);
        } else {
            echo "E-posta içeriği alınamadı.";
        }
        exit;
    }
}
// --------------------------------------------------------------------------

// Sayfa Yükleme Verileri
$demo_messages = [];
if ($is_logged_in && file_exists($json_file)) {
    $demo_messages = json_decode(file_get_contents($json_file), true);
    if (!is_array($demo_messages)) $demo_messages = [];
}

$imap_emails = [];
$imap_error = "";
$active_tab = isset($_GET['tab']) ? $_GET['tab'] : 'demo';

if ($is_logged_in && $active_tab == 'inbox') {
    if (!function_exists('imap_open')) {
        $imap_error = "Sunucuda PHP IMAP eklentisi yüklü değil.";
    } else {
        $mailbox = "{mail.kurumsaleposta.com:993/imap/ssl}INBOX";
        $username = "info@entelog.com.tr";
        $password = "Sg_1.E5hdwQ8W_=2";

        try {
            $inbox = @imap_open($mailbox, $username, $password);
            if ($inbox) {
                $total_msgs = imap_num_msg($inbox);
                if ($total_msgs > 0) {
                    $start = $total_msgs;
                    $end = max(1, $total_msgs - 19);

                    for ($i = $start; $i >= $end; $i--) {
                        $overview = imap_fetch_overview($inbox, $i, 0);
                        if (is_array($overview) && !empty($overview)) {
                            $msg_data = $overview[0];
                            $subject = isset($msg_data->subject) ? imap_utf8($msg_data->subject) : '(Konu Yok)';
                            $from = isset($msg_data->from) ? imap_utf8($msg_data->from) : 'Bilinmeyen';
                            $date = isset($msg_data->date) ? date("d.m.Y H:i", strtotime($msg_data->date)) : '-';
                            
                            $imap_emails[] = [
                                'id' => $msg_data->msgno,
                                'subject' => $subject,
                                'from' => $from,
                                'date' => $date
                            ];
                        }
                    }
                }
                imap_close($inbox);
            } else {
                $imap_error = "IMAP Bağlantı Hatası: " . imap_last_error();
            }
        } catch (Exception $e) {
            $imap_error = "Hata: " . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EnteLog - Admin Paneli V2</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        [x-cloak] { display: none !important; }
    </style>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'] },
                    colors: { brand: { 500: '#0ea5e9', 600: '#0284c7', 900: '#0c4a6e' } }
                }
            }
        }
    </script>
</head>
<body class="bg-slate-900 text-slate-50 font-sans antialiased h-screen flex flex-col">

    <?php if (!$is_logged_in): ?>
        <!-- GİRİŞ EKRANI -->
        <div class="flex-1 flex items-center justify-center p-4">
            <div class="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-8">
                <div class="text-center mb-8">
                    <img src="logo.png" alt="Logo" class="h-12 w-auto mx-auto mb-4 object-contain" onerror="this.style.display='none'">
                    <h1 class="text-2xl font-bold text-white">Yönetici Girişi</h1>
                </div>
                <?php if (isset($error)): ?>
                    <div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm text-center"><?php echo $error; ?></div>
                <?php endif; ?>
                <form method="POST" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Kullanıcı Adı</label>
                        <input type="text" name="username" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Şifre</label>
                        <input type="password" name="password" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500" required>
                    </div>
                    <button type="submit" class="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-lg transition-all mt-4">Giriş Yap</button>
                </form>
            </div>
        </div>
    <?php else: ?>
        <!-- PANEL EKRANI -->
        <nav class="bg-slate-800 border-b border-slate-700 px-4 py-4">
            <div class="max-w-7xl mx-auto flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <img src="logo.png" alt="Logo" class="h-8 w-auto object-contain" onerror="this.style.display='none'">
                    <span class="text-xl font-bold text-white">Admin Paneli</span>
                </div>
                <div class="flex items-center gap-4">
                    <!-- Bildirim İkonu (Basit UI) -->
                    <div class="relative">
                        <i data-lucide="bell" class="w-5 h-5 text-slate-400 hover:text-white cursor-pointer"></i>
                        <span class="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
                    </div>
                    <a href="?logout=true" class="text-red-400 hover:text-white text-sm font-medium flex items-center gap-2">
                        <i data-lucide="log-out" class="w-4 h-4"></i> Çıkış
                    </a>
                </div>
            </div>
        </nav>

        <main class="flex-1 overflow-auto p-4 sm:p-8" 
              x-data="{ 
                  activeTab: '<?php echo $active_tab; ?>',
                  
                  // Helper Functions
                  updateStatus(id, newStatus) {
                      const formData = new FormData();
                      formData.append('id', id);
                      formData.append('status', newStatus);
                      
                      fetch('admin.php?action=update_status', { method: 'POST', body: formData })
                          .then(res => res.json())
                          .then(data => {
                              if(data.success) {
                                  // UI Feedback (Opsiyonel, zaten select değişiyor)
                              } else {
                                  alert('Durum güncellenemedi.');
                              }
                          });
                  },
                  
                  deleteMessage(id) {
                      if(!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
                      
                      const formData = new FormData();
                      formData.append('id', id);
                      
                      fetch('admin.php?action=delete_message', { method: 'POST', body: formData })
                          .then(res => res.json())
                          .then(data => {
                              if(data.success) {
                                  location.reload(); // En temiz yöntem sayfayı yenilemek
                              } else {
                                  alert('Silme işlemi başarısız.');
                              }
                          });
                  }
              }">
              
            <div class="max-w-7xl mx-auto">
                <!-- Tabs -->
                <div class="flex justify-between items-end border-b border-slate-700 mb-8">
                    <div class="flex space-x-4">
                        <a href="?tab=demo" class="pb-3 px-2 border-b-2 font-medium transition-colors <?php echo $active_tab == 'demo' ? 'border-brand-500 text-brand-500' : 'border-transparent text-slate-400 hover:text-white'; ?>">
                            Demo Talepleri
                            <span class="ml-2 bg-slate-700 text-white text-xs px-2 py-0.5 rounded-full"><?php echo count($demo_messages); ?></span>
                        </a>
                        <a href="?tab=inbox" class="pb-3 px-2 border-b-2 font-medium transition-colors <?php echo $active_tab == 'inbox' ? 'border-brand-500 text-brand-500' : 'border-transparent text-slate-400 hover:text-white'; ?>">
                            Gelen Kutusu (info@)
                        </a>
                    </div>
                    <?php if ($active_tab == 'demo'): ?>
                        <div class="pb-2">
                            <a href="admin.php?action=export_csv" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                                <i data-lucide="download" class="w-4 h-4"></i> Excel İndir
                            </a>
                        </div>
                    <?php endif; ?>
                </div>

                <?php if ($active_tab == 'demo'): ?>
                    <!-- CRM TABLOSU -->
                    <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
                         <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-slate-900/50 border-b border-slate-700 text-xs uppercase text-slate-400 tracking-wider">
                                        <th class="px-6 py-4 font-semibold">Tarih</th>
                                        <th class="px-6 py-4 font-semibold">Ad Soyad</th>
                                        <th class="px-6 py-4 font-semibold">İletişim</th>
                                        <th class="px-6 py-4 font-semibold">Durum</th>
                                        <th class="px-6 py-4 font-semibold text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-700">
                                    <?php if(empty($demo_messages)): ?>
                                        <tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Henüz talep yok.</td></tr>
                                    <?php else: ?>
                                        <?php foreach ($demo_messages as $msg): ?>
                                            <?php $status = isset($msg['status']) ? $msg['status'] : 'Yeni'; ?>
                                            <tr class="hover:bg-slate-700/30 transition-colors">
                                                <td class="px-6 py-4 text-slate-300 text-sm whitespace-nowrap">
                                                    <?php echo date('d.m.Y H:i', strtotime($msg['date'])); ?>
                                                </td>
                                                <td class="px-6 py-4 text-white font-medium">
                                                    <?php echo htmlspecialchars($msg['name']); ?>
                                                </td>
                                                <td class="px-6 py-4">
                                                    <div class="flex flex-col gap-1 text-sm">
                                                        <a href="mailto:<?php echo $msg['email']; ?>" class="text-brand-500 hover:underline"><?php echo $msg['email']; ?></a>
                                                        <span class="text-slate-400"><?php echo $msg['phone']; ?></span>
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4">
                                                    <select onchange="updateStatus('<?php echo $msg['id']; ?>', this.value)" 
                                                            class="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-500
                                                            <?php echo $status == 'Tamamlandı' ? 'text-green-400 border-green-500/30' : ($status == 'İptal' ? 'text-red-400 border-red-500/30' : 'text-slate-300'); ?>">
                                                        <option value="Yeni" <?php echo $status == 'Yeni' ? 'selected' : ''; ?>>Yeni</option>
                                                        <option value="Arandı" <?php echo $status == 'Arandı' ? 'selected' : ''; ?>>Arandı</option>
                                                        <option value="Teklif" <?php echo $status == 'Teklif' ? 'selected' : ''; ?>>Teklif Verildi</option>
                                                        <option value="Tamamlandı" <?php echo $status == 'Tamamlandı' ? 'selected' : ''; ?>>Tamamlandı</option>
                                                        <option value="İptal" <?php echo $status == 'İptal' ? 'selected' : ''; ?>>İptal / Olumsuz</option>
                                                    </select>
                                                </td>
                                                <td class="px-6 py-4 text-right">
                                                    <button @click="deleteMessage('<?php echo $msg['id']; ?>')" class="text-slate-500 hover:text-red-400 transition-colors p-2" title="Sil">
                                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>

                <?php else: ?>
                    <!-- GELEN KUTUSU (IMAP) -->
                    <div x-data="{ 
                          openMailId: null, 
                          loading: false,
                          mailContents: {},
                          async toggleMail(id) {
                              if (this.openMailId === id) { this.openMailId = null; return; }
                              this.openMailId = id;
                              if (this.mailContents[id]) return;
                              this.loading = true;
                              try {
                                  const res = await fetch('admin.php?action=get_body&id=' + id);
                                  const html = await res.text();
                                  this.mailContents[id] = html;
                              } catch(e) { this.mailContents[id] = 'Hata'; } 
                              finally { this.loading = false; }
                          }
                      }">
                        <?php if ($imap_error): ?>
                            <div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-4 rounded-lg"><?php echo $imap_error; ?></div>
                        <?php elseif (empty($imap_emails)): ?>
                            <div class="text-center py-10 bg-slate-800/50 rounded-lg text-slate-400">Gelen kutusu boş.</div>
                        <?php else: ?>
                            <div class="flex flex-col gap-4">
                                <?php foreach ($imap_emails as $email): ?>
                                    <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm hover:border-brand-500/30 transition-colors">
                                        <div class="p-4 cursor-pointer flex items-start gap-4" @click="toggleMail(<?php echo $email['id']; ?>)">
                                            <div class="bg-slate-700/50 p-2 rounded-full"><i data-lucide="mail" class="w-5 h-5 text-slate-300"></i></div>
                                            <div class="flex-1 min-w-0">
                                                <div class="flex justify-between items-start">
                                                    <h3 class="text-white font-medium truncate pr-4 text-lg"><?php echo $email['subject']; ?></h3>
                                                    <span class="text-xs text-slate-500 whitespace-nowrap mt-1"><?php echo $email['date']; ?></span>
                                                </div>
                                                <div class="flex items-center gap-2 mt-1"><span class="text-brand-400 text-sm font-medium"><?php echo $email['from']; ?></span></div>
                                            </div>
                                            <div>
                                                <i x-show="loading && openMailId === <?php echo $email['id'] ?> && !mailContents[<?php echo $email['id'] ?>]" class="animate-spin w-5 h-5 text-brand-500" data-lucide="loader-2"></i>
                                                <i x-show="!(loading && openMailId === <?php echo $email['id'] ?> && !mailContents[<?php echo $email['id'] ?>])" data-lucide="chevron-down" class="w-5 h-5 text-slate-500 transition-transform" :class="{ 'rotate-180': openMailId === <?php echo $email['id']; ?> }"></i>
                                            </div>
                                        </div>
                                        <div x-show="openMailId === <?php echo $email['id']; ?>" x-cloak x-collapse class="border-t border-slate-700 bg-slate-900/50 p-6 text-slate-300 text-sm leading-relaxed overflow-x-auto">
                                            <div x-html="mailContents[<?php echo $email['id']; ?>]" class="bg-white text-black p-4 rounded shadow-inner prose prose-sm max-w-none">
                                                <span class="text-slate-500">Yükleniyor...</span>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            </div>
        </main>
    <?php endif; ?>

    <script>
        lucide.createIcons();
    </script>
</body>
</html>
