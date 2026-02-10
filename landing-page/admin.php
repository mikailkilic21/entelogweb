<?php
session_start();
header('Content-Type: text/html; charset=utf-8');

// ==========================================================================
// AYARLAR
// ==========================================================================
$admin_user = "admin";
$admin_pass = "entelog2026"; 
$json_file = 'messages.json';
$config_file = 'config.json';
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

// Varsayılan Ayarlar
$current_config = [
    'ai_provider' => 'gemini',
    'ai_api_key' => '',
    'ai_model' => 'gemini-1.5-flash'
];

if (file_exists($config_file)) {
    $loaded_config = json_decode(file_get_contents($config_file), true);
    if (is_array($loaded_config)) {
        $current_config = array_merge($current_config, $loaded_config);
    }
}

// --------------------------------------------------------------------------
// API ACTIONS (AJAX)
// --------------------------------------------------------------------------
if ($is_logged_in && isset($_GET['action'])) {
    
    function getMessages($file) {
        if (!file_exists($file)) return [];
        $data = json_decode(file_get_contents($file), true);
        return is_array($data) ? $data : [];
    }

    function saveMessages($file, $data) {
        file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

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

    if ($_GET['action'] == 'delete_message' && isset($_POST['id'])) {
        $messages = getMessages($json_file);
        $new_messages = [];
        $deleted = false;
        foreach ($messages as $msg) {
            if ($msg['id'] == $_POST['id']) {
                $deleted = true;
                continue;
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

    if ($_GET['action'] == 'export_csv') {
        $messages = getMessages($json_file);
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=demo_talepleri_' . date('Y-m-d') . '.csv');
        $output = fopen('php://output', 'w');
        fputs($output, "\xEF\xBB\xBF");
        fputcsv($output, ['ID', 'Tarih', 'Ad Soyad', 'E-posta', 'Telefon', 'Durum', 'IP']);
        foreach ($messages as $msg) {
           fputcsv($output, [$msg['id'], $msg['date'], $msg['name'], $msg['email'], $msg['phone'], $msg['status'] ?? 'Yeni', $msg['ip']]);
        }
        fclose($output);
        exit;
    }

    if ($_GET['action'] == 'save_settings' && isset($_POST['ai_provider'])) {
        $new_config = [
            'ai_provider' => $_POST['ai_provider'],
            'ai_api_key' => $_POST['ai_api_key'] ?? '',
            'ai_model' => $_POST['ai_model'] ?? 'gemini-1.5-flash'
        ];
        file_put_contents($config_file, json_encode($new_config, JSON_PRETTY_PRINT));
        echo json_encode(['success' => true]);
        exit;
    }

    // MODELLERİ GETİR (Google API)
    if ($_GET['action'] == 'get_models' && isset($_POST['api_key'])) {
        $apiKey = $_POST['api_key'];
        // V1BETA Endpoint (En çok model burada)
        $url = "https://generativelanguage.googleapis.com/v1beta/models?key=" . $apiKey;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        if (curl_errno($ch)) {
            echo json_encode(['success' => false, 'message' => 'Curl Hatası: '.curl_error($ch)]);
        } else {
            $data = json_decode($response, true);
            if (isset($data['models'])) {
                $chatModels = [];
                foreach ($data['models'] as $m) {
                    // Sadece generateContent'i destekleyenleri al
                    if (isset($m['supportedGenerationMethods']) && in_array("generateContent", $m['supportedGenerationMethods'])) {
                        $name = str_replace('models/', '', $m['name']);
                        $chatModels[] = [
                            'id' => $name,
                            'name' => $m['displayName'] . " ($name)"
                        ];
                    }
                }
                echo json_encode(['success' => true, 'models' => $chatModels]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Model listesi alınamadı. API Key veya erişim sorunu.', 'debug' => $data]);
            }
        }
        curl_close($ch);
        exit;
    }
}
// --------------------------------------------------------------------------

$demo_messages = [];
if ($is_logged_in && file_exists($json_file)) {
    $demo_messages = json_decode(file_get_contents($json_file), true);
    if (!is_array($demo_messages)) $demo_messages = [];
}

$active_tab = isset($_GET['tab']) ? $_GET['tab'] : 'demo';
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
    <script>
        tailwind.config = {
            theme: { extend: { fontFamily: { sans: ['Inter', 'sans-serif'] }, colors: { brand: { 500: '#0ea5e9', 600: '#0284c7', 900: '#0c4a6e' } } } }
        }
    </script>
</head>
<body class="bg-slate-900 text-slate-50 font-sans antialiased h-screen flex flex-col">

    <?php if (!$is_logged_in): ?>
        <div class="flex-1 flex items-center justify-center p-4">
            <div class="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-8">
                <div class="text-center mb-8">
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
        <nav class="bg-slate-800 border-b border-slate-700 px-4 py-4">
            <div class="max-w-7xl mx-auto flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <span class="text-xl font-bold text-white">Admin Paneli</span>
                </div>
                <div class="flex items-center gap-4">
                    <a href="?logout=true" class="text-red-400 hover:text-white text-sm font-medium flex items-center gap-2">
                        <i data-lucide="log-out" class="w-4 h-4"></i> Çıkış
                    </a>
                </div>
            </div>
        </nav>

        <main class="flex-1 overflow-auto p-4 sm:p-8" 
              x-data="{ 
                  activeTab: '<?php echo $active_tab; ?>',
                  aiSettings: {
                      provider: '<?php echo $current_config['ai_provider']; ?>',
                      apiKey: '<?php echo $current_config['ai_api_key']; ?>',
                      model: '<?php echo $current_config['ai_model']; ?>'
                  },
                  saving: false,
                  dynamicModels: [],
                  loadingModels: false,

                  saveSettings() {
                      this.saving = true;
                      const formData = new FormData();
                      formData.append('ai_provider', this.aiSettings.provider);
                      formData.append('ai_api_key', this.aiSettings.apiKey);
                      formData.append('ai_model', this.aiSettings.model);

                      fetch('admin.php?action=save_settings', { method: 'POST', body: formData })
                          .then(res => res.json())
                          .then(data => {
                              if(data.success) {
                                  alert('Ayarlar kaydedildi!');
                              } else {
                                  alert('Kaydedilemedi.');
                              }
                          })
                          .finally(() => { this.saving = false; });
                  },

                  fetchModels() {
                      if (!this.aiSettings.apiKey) { alert('Lütfen önce API Anahtarı girin.'); return; }
                      this.loadingModels = true;
                      
                      const formData = new FormData();
                      formData.append('api_key', this.aiSettings.apiKey);
                      
                      fetch('admin.php?action=get_models', { method: 'POST', body: formData })
                          .then(res => res.json())
                          .then(data => {
                              if(data.success) {
                                  this.dynamicModels = data.models;
                                  alert('Modeller başarıyla yüklendi! Lütfen listeden seçiminizi yapın.');
                              } else {
                                  alert('Hata: ' + (data.message || 'Modeller alınamadı.'));
                                  console.error(data);
                              }
                          })
                          .catch(err => alert('Bağlantı hatası.'))
                          .finally(() => { this.loadingModels = false; });
                  },
                  
                  updateStatus(id, newStatus) {
                      const formData = new FormData();
                      formData.append('id', id);
                      formData.append('status', newStatus);
                      fetch('admin.php?action=update_status', { method: 'POST', body: formData });
                  },
                  
                  deleteMessage(id) {
                      if(!confirm('Silmek istediğinize emin misiniz?')) return;
                      const formData = new FormData();
                      formData.append('id', id);
                      fetch('admin.php?action=delete_message', { method: 'POST', body: formData })
                          .then(res => res.json())
                          .then(data => { if(data.success) location.reload(); });
                  }
              }">
              
            <div class="max-w-7xl mx-auto">
                <div class="flex border-b border-slate-700 mb-8">
                    <a href="?tab=demo" class="pb-3 px-4 border-b-2 font-medium transition-colors <?php echo $active_tab == 'demo' ? 'border-brand-500 text-brand-500' : 'border-transparent text-slate-400 hover:text-white'; ?>">
                        Demo Talepleri
                    </a>
                    <a href="?tab=settings" class="pb-3 px-4 border-b-2 font-medium transition-colors <?php echo $active_tab == 'settings' ? 'border-brand-500 text-brand-500' : 'border-transparent text-slate-400 hover:text-white'; ?>">
                        Yapay Zeka Ayarları
                    </a>
                </div>

                <?php if ($active_tab == 'demo'): ?>
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
                                                <td class="px-6 py-4 text-slate-300 text-sm whitespace-nowrap"><?php echo date('d.m.Y H:i', strtotime($msg['date'])); ?></td>
                                                <td class="px-6 py-4 text-white font-medium"><?php echo htmlspecialchars($msg['name']); ?></td>
                                                <td class="px-6 py-4">
                                                    <div class="flex flex-col gap-1 text-sm">
                                                        <a href="mailto:<?php echo $msg['email']; ?>" class="text-brand-500 hover:underline"><?php echo $msg['email']; ?></a>
                                                        <span class="text-slate-400"><?php echo $msg['phone']; ?></span>
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4">
                                                    <select onchange="updateStatus('<?php echo $msg['id']; ?>', this.value)" 
                                                            class="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-500">
                                                        <option value="Yeni" <?php echo $status == 'Yeni' ? 'selected' : ''; ?>>Yeni</option>
                                                        <option value="Arandı" <?php echo $status == 'Arandı' ? 'selected' : ''; ?>>Arandı</option>
                                                        <option value="Teklif" <?php echo $status == 'Teklif' ? 'selected' : ''; ?>>Teklif Verildi</option>
                                                        <option value="Tamamlandı" <?php echo $status == 'Tamamlandı' ? 'selected' : ''; ?>>Tamamlandı</option>
                                                        <option value="İptal" <?php echo $status == 'İptal' ? 'selected' : ''; ?>>İptal</option>
                                                    </select>
                                                </td>
                                                <td class="px-6 py-4 text-right">
                                                    <button @click="deleteMessage('<?php echo $msg['id']; ?>')" class="text-slate-500 hover:text-red-400 transition-colors p-2"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                <?php else: ?>
                    <div class="max-w-2xl mx-auto">
                        <div class="bg-slate-800 rounded-xl border border-slate-700 p-8 shadow-lg">
                            <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <i data-lucide="bot" class="w-6 h-6 text-brand-500"></i> Yapay Zeka Yapılandırması
                            </h2>
                            
                            <form @submit.prevent="saveSettings" class="space-y-6">
                                <div>
                                    <label class="block text-sm font-medium text-slate-400 mb-2">Servis Sağlayıcı</label>
                                    <div class="grid grid-cols-2 gap-4">
                                        <label class="cursor-pointer border border-slate-600 rounded-lg p-4 hover:bg-slate-700 transition-colors"
                                            :class="aiSettings.provider === 'gemini' ? 'border-brand-500 bg-brand-500/10' : ''">
                                            <input type="radio" value="gemini" x-model="aiSettings.provider" @change="aiSettings.model = 'gemini-1.5-flash'" class="hidden">
                                            <div class="flex items-center gap-3">
                                                <div class="bg-white p-1 rounded"><img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" class="w-6 h-6"></div>
                                                <span class="font-bold text-white">Google Gemini</span>
                                            </div>
                                        </label>
                                        <label class="cursor-pointer border border-slate-600 rounded-lg p-4 hover:bg-slate-700 transition-colors"
                                            :class="aiSettings.provider === 'openai' ? 'border-brand-500 bg-brand-500/10' : ''">
                                            <input type="radio" value="openai" x-model="aiSettings.provider" @change="aiSettings.model = 'gpt-3.5-turbo'" class="hidden">
                                            <div class="flex items-center gap-3">
                                                <div class="bg-green-100 p-1 rounded"><img src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" class="w-6 h-6"></div>
                                                <span class="font-bold text-white">OpenAI (ChatGPT)</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-slate-400 mb-2">API Anahtarı (Key)</label>
                                    <div class="flex gap-2">
                                        <input type="text" x-model="aiSettings.apiKey" placeholder="sk-..." class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 font-mono text-sm">
                                        <!-- Modelleri Çek Butonu -->
                                        <template x-if="aiSettings.provider === 'gemini'">
                                            <button type="button" @click="fetchModels" :disabled="loadingModels" 
                                                class="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2">
                                                <i data-lucide="refresh-cw" class="w-4 h-4" :class="loadingModels ? 'animate-spin' : ''"></i>
                                                <span x-text="loadingModels ? 'Aranıyor...' : 'Modelleri Tara'"></span>
                                            </button>
                                        </template>
                                    </div>
                                    <p class="text-xs text-slate-500 mt-2">API anahtarınız sunucuda güvenli bir şekilde saklanır.</p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-slate-400 mb-2">Model Seçimi</label>
                                    <select x-model="aiSettings.model" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500">
                                        <template x-if="aiSettings.provider === 'gemini'">
                                            <optgroup label="Google Modelleri">
                                                <!-- Dinamik Modeller Varsa Buraya -->
                                                <template x-if="dynamicModels.length > 0">
                                                    <template x-for="m in dynamicModels" :key="m.id">
                                                        <option :value="m.id" x-text="m.name"></option>
                                                    </template>
                                                </template>
                                                
                                                <!-- Fallback (Dinamik yoksa) -->
                                                <template x-if="dynamicModels.length === 0">
                                                    <fragment>
                                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (Standart)</option>
                                                        <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Latest)</option>
                                                        <option value="gemini-pro">Gemini Pro</option>
                                                        <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
                                                    </fragment>
                                                </template>
                                            </optgroup>
                                        </template>
                                        <template x-if="aiSettings.provider === 'openai'">
                                            <optgroup label="OpenAI Modelleri">
                                                <option value="gpt-4o-mini">GPT-4o Mini (Hızlı & Ucuz)</option>
                                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                                <option value="gpt-4o">GPT-4o (En Akıllı)</option>
                                            </optgroup>
                                        </template>
                                    </select>
                                    <p x-show="dynamicModels.length > 0" class="text-xs text-green-400 mt-2 flex items-center gap-1">
                                        <i data-lucide="check-circle" class="w-3 h-3"></i> Google API'den alınan güncel model listesi gösteriliyor.
                                    </p>
                                </div>

                                <div class="pt-4 border-t border-slate-700">
                                    <button type="submit" 
                                        class="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                                        :disabled="saving">
                                        <i data-lucide="save" class="w-5 h-5"></i>
                                        <span x-text="saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'"></span>
                                    </button>
                                </div>
                            </form>
                        </div>
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
