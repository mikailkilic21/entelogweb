<?php
session_start();

// GÜVENLİK AYARLARI
$ADMIN_USER = 'admin';
$ADMIN_PASS = 'entelog2026';

if (isset($_POST['username']) && isset($_POST['password'])) {
    if ($_POST['username'] === $ADMIN_USER && $_POST['password'] === $ADMIN_PASS) {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_user'] = $ADMIN_USER;
    } else {
        $error = "Hatalı kullanıcı adı veya şifre!";
    }
}

if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: admin.php");
    exit;
}

// Mesaj Durumu Güncelleme
if (isset($_POST['action']) && isset($_POST['id']) && $_SESSION['admin_logged_in']) {
    $file = 'messages.json';
    $data = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
    
    foreach ($data as &$msg) {
        if ($msg['id'] === $_POST['id']) {
            if ($_POST['action'] === 'archive') $msg['status'] = 'archived';
            if ($_POST['action'] === 'reply') $msg['status'] = 'replied';
            if ($_POST['action'] === 'delete') $msg['status'] = 'deleted';
            break;
        }
    }
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    header("Location: admin.php");
    exit;
}

// Giriş Kontrolü
if (!isset($_SESSION['admin_logged_in'])) {
?>
<!DOCTYPE html>
<html lang="tr" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EnteLog Admin Giriş</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = { darkMode: 'class' }
    </script>
</head>
<body class="bg-gray-50 dark:bg-slate-900 flex items-center justify-center h-screen transition-colors duration-300">
    <div class="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center border border-gray-200 dark:border-slate-700">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-6">Yönetici Girişi</h2>
        <?php if(isset($error)) echo "<p class='text-red-500 mb-4 text-sm'>$error</p>"; ?>
        <form method="POST" class="space-y-4">
            <input type="text" name="username" placeholder="Kullanıcı Adı" class="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" required>
            <input type="password" name="password" placeholder="Şifre" class="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" required>
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors">Giriş Yap</button>
        </form>
    </div>
</body>
</html>
<?php
    exit;
}

// Mesajları Getir
$file = 'messages.json';
$messages = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
if (!is_array($messages)) $messages = []; // Hata önlemek için

// Filtreleme (Silinenleri gösterme)
$messages = array_filter($messages, function($m) {
    return isset($m['status']) && $m['status'] !== 'deleted';
});
?>
<!DOCTYPE html>
<html lang="tr" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EnteLog Talep Yönetimi</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    <script>
        tailwind.config = { 
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        slate: { 850: '#1e293b' } 
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-50 dark:bg-slate-950 min-h-screen font-sans text-slate-800 dark:text-slate-200" x-data="{ darkMode: localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) }" :class="{ 'dark': darkMode }">

    <!-- Navbar -->
    <nav class="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm transition-colors duration-300">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <i data-lucide="shield" class="w-6 h-6"></i>
            </div>
            <h1 class="text-xl font-bold text-slate-800 dark:text-white">EnteLog <span class="text-slate-500 dark:text-slate-400 font-normal ml-1">Talep Paneli</span></h1>
        </div>
        <div class="flex items-center gap-4">
            <!-- Dark Mode Toggle -->
            <button @click="darkMode = !darkMode; localStorage.setItem('theme', darkMode ? 'dark' : 'light'); document.documentElement.classList.toggle('dark', darkMode)" 
                class="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <i x-show="!darkMode" data-lucide="moon" class="w-5 h-5"></i>
                <i x-show="darkMode" data-lucide="sun" class="w-5 h-5" style="display: none;"></i>
            </button>
            
            <span class="text-sm font-medium text-slate-600 dark:text-slate-400 hidden md:block">
                Merhaba, <?php echo htmlspecialchars($_SESSION['admin_user']); ?>
            </span>
            <a href="?logout=true" class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors text-sm font-medium border border-red-200 dark:border-red-900/30">Çıkış</a>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto p-6 transition-colors duration-300">
        
        <!-- İstatistik Kartları -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
                <p class="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Toplam Talep</p>
                <h3 class="text-3xl font-bold text-slate-800 dark:text-white mt-2"><?php echo count($messages); ?></h3>
            </div>
            <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm transition-colors">
                <p class="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">Bekleyen</p>
                <h3 class="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-2">
                    <?php echo count(array_filter($messages, fn($m) => ($m['status'] ?? 'new') === 'new')); ?>
                </h3>
            </div>
        </div>

        <!-- Tablo -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden transition-colors duration-300">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700 uppercase tracking-wider text-xs">
                        <tr>
                            <th class="p-4 font-bold">Tarih</th>
                            <th class="p-4 font-bold">Firma / Kişi</th>
                            <th class="p-4 font-bold">Sektör & ERP</th>
                            <th class="p-4 font-bold">İletişim</th>
                            <th class="p-4 font-bold">Durum</th>
                            <th class="p-4 font-bold text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-slate-800">
                        <?php foreach ($messages as $msg): ?>
                        <tr class="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors <?php echo ($msg['status']=='new') ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''; ?>">
                            <td class="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                                <?php echo date('d.m.Y H:i', strtotime($msg['date'])); ?>
                            </td>
                            <td class="p-4">
                                <div class="font-bold text-slate-800 dark:text-white text-base"><?php echo htmlspecialchars($msg['company'] ?? '-'); ?></div>
                                <div class="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium"><?php echo htmlspecialchars($msg['name']); ?></div>
                            </td>
                            <td class="p-4">
                                <div class="inline-flex flex-col gap-1.5">
                                    <span class="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold w-fit border border-gray-200 dark:border-slate-700">
                                        <?php echo htmlspecialchars($msg['erp'] ?? 'Belirtilmedi'); ?>
                                    </span>
                                    <span class="text-xs text-slate-500 dark:text-slate-400">
                                        <?php echo htmlspecialchars($msg['sector'] ?? '-'); ?>
                                        (<?php echo htmlspecialchars($msg['employees'] ?? '-'); ?>)
                                    </span>
                                </div>
                            </td>
                            <td class="p-4 text-slate-600 dark:text-slate-400">
                                <div class="flex items-center gap-2 text-xs font-medium bg-gray-50 dark:bg-slate-800/50 p-1.5 rounded-lg w-fit mb-1">
                                    <i data-lucide="mail" class="w-3.5 h-3.5 text-slate-400"></i> <?php echo htmlspecialchars($msg['email']); ?>
                                </div>
                                <div class="flex items-center gap-2 text-xs font-medium bg-gray-50 dark:bg-slate-800/50 p-1.5 rounded-lg w-fit">
                                    <i data-lucide="phone" class="w-3.5 h-3.5 text-slate-400"></i> <?php echo htmlspecialchars($msg['phone']); ?>
                                </div>
                            </td>
                            <td class="p-4">
                                <?php if(($msg['status'] ?? 'new') === 'new'): ?>
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/20">
                                        <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Yeni
                                    </span>
                                <?php elseif($msg['status'] === 'replied'): ?>
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-1 ring-green-500/20">
                                        <i data-lucide="check" class="w-3 h-3"></i> Cevaplandı
                                    </span>
                                <?php else: ?>
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400 ring-1 ring-gray-500/20">
                                        Arşiv
                                    </span>
                                <?php endif; ?>
                            </td>
                            <td class="p-4 text-right" x-data>
                                <button @click="$dispatch('open-modal', {id: '<?php echo $msg['id']; ?>'})" 
                                    class="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold text-xs border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-lg transition-all flex items-center gap-2 ml-auto">
                                    <i data-lucide="eye" class="w-3.5 h-3.5"></i> İncele
                                </button>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                        
                        <?php if (empty($messages)): ?>
                        <tr>
                            <td colspan="6" class="p-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center">
                                <div class="bg-gray-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                                    <i data-lucide="inbox" class="w-8 h-8 text-slate-300 dark:text-slate-600"></i>
                                </div>
                                <span class="font-medium">Henüz hiç talep yok.</span>
                            </td>
                        </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- DETAY MODALI (Alpine.js) -->
    <div x-data="{ open: false, activeMsg: {} }" 
         @open-modal.window="activeMsg = $event.detail; open = true"
         x-show="open" style="display: none;"
         x-transition:enter="transition ease-out duration-200"
         x-transition:enter-start="opacity-0 scale-95"
         x-transition:enter-end="opacity-100 scale-100"
         x-transition:leave="transition ease-in duration-100"
         x-transition:leave-start="opacity-100 scale-100"
         x-transition:leave-end="opacity-0 scale-95"
         class="fixed inset-0 z-[100] flex items-center justify-center px-4">
         
         <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="open = false"></div>

        <!-- Modal Content -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden transform transition-all p-8 border border-gray-200 dark:border-slate-700">
            <button @click="open = false" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-gray-100 dark:bg-slate-800 rounded-full p-2">
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>

            <!-- İçerik JS ile dolacak -->
            <div id="modalContent"></div>

            <script>
                // PHP verisini JS nesnesine aktar
                const messagesData = <?php echo json_encode(array_values($messages)); ?>;
                
                window.addEventListener('open-modal', event => {
                    const id = event.detail.id;
                    const msg = messagesData.find(m => m.id === id);
                    const container = document.getElementById('modalContent');
                    
                    if(msg) {
                        const statusBadge = msg.status === 'new' 
                            ? '<span class="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold ring-1 ring-blue-500/20">Yeni</span>' 
                            : (msg.status === 'replied' 
                                ? '<span class="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold ring-1 ring-green-500/20">Cevaplandı</span>' 
                                : '<span class="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400 text-xs font-bold ring-1 ring-gray-500/20">Arşiv</span>');

                        container.innerHTML = `
                            <div class="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-slate-800 pb-4">
                                <h3 class="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                    <div class="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                                        <i data-lucide="file-text" class="w-5 h-5"></i>
                                    </div>
                                    Talep Detayı
                                </h3>
                                <div>${statusBadge}</div>
                            </div>

                            <div class="grid grid-cols-2 gap-6 mb-6">
                                <div class="space-y-1">
                                    <p class="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Firma</p>
                                    <p class="font-bold text-slate-800 dark:text-white text-lg">${msg.company || '-'}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Yetkili</p>
                                    <p class="font-medium text-slate-800 dark:text-slate-200">${msg.name}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">İletişim</p>
                                    <div class="text-sm text-slate-700 dark:text-slate-300">
                                        <div class="flex items-center gap-2 mb-1"><i data-lucide="mail" class="w-3.5 h-3.5 text-slate-400"></i> ${msg.email}</div>
                                        <div class="flex items-center gap-2"><i data-lucide="phone" class="w-3.5 h-3.5 text-slate-400"></i> ${msg.phone}</div>
                                    </div>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Teknik Detay</p>
                                    <div class="text-sm text-slate-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                                        <div class="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                                            <span class="text-slate-500 dark:text-slate-400 font-medium">ERP:</span> 
                                            <span class="font-bold">${msg.erp || '-'}</span>
                                        </div>
                                        <div class="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                                            <span class="text-slate-500 dark:text-slate-400 font-medium">Sektör:</span> 
                                            <span class="font-bold">${msg.sector || '-'}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-slate-500 dark:text-slate-400 font-medium">Çalışan:</span> 
                                            <span class="font-bold">${msg.employees || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="space-y-2 mb-8">
                                <p class="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Müşteri Mesajı</p>
                                <div class="bg-gray-50 dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner font-medium text-sm">
                                    ${msg.message || '<span class="text-slate-400 italic">Mesaj içeriği yok.</span>'}
                                </div>
                                <div class="text-right text-xs text-slate-400 dark:text-slate-500 font-mono">IP: ${msg.ip}</div>
                            </div>

                            <div class="grid grid-cols-3 gap-3 pt-6 border-t border-gray-100 dark:border-slate-800">
                                <form method="POST" class="col-span-1">
                                    <input type="hidden" name="id" value="${msg.id}">
                                    <input type="hidden" name="action" value="reply">
                                    <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-600/20 hover:shadow-green-600/30 flex items-center justify-center gap-2 text-sm">
                                        <i data-lucide="check-circle" class="w-4 h-4"></i> Cevaplandı
                                    </button>
                                </form>
                                <form method="POST" class="col-span-1">
                                    <input type="hidden" name="id" value="${msg.id}">
                                    <input type="hidden" name="action" value="archive">
                                    <button type="submit" class="w-full bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm" title="Arşivle">
                                        <i data-lucide="archive" class="w-4 h-4"></i> Arşivle
                                    </button>
                                </form>
                                <form method="POST" onsubmit="return confirm('Bu kaydı silmek istediğinize emin misiniz?');" class="col-span-1">
                                    <input type="hidden" name="id" value="${msg.id}">
                                    <input type="hidden" name="action" value="delete">
                                    <button type="submit" class="w-full bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 border border-gray-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm" title="Sil">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i> Sil
                                    </button>
                                </form>
                            </div>
                        `;
                        lucide.createIcons();
                    }
                });
            </script>
        </div>
    </div>
</body>
</html>
