import React, { useState } from 'react';
import { X, Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const DiscountUploadModal = ({ onClose }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/orders/upload-discount-pdf', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                setResult(data);
            } else {
                setError(data.error || 'Yükleme başarısız.');
            }
        } catch (err) {
            console.error(err);
            setError('Bir hata oluştu: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl flex flex-col shadow-2xl animate-scale-in">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText className="text-blue-500" />
                        İskonto Dosyası Yükle (Öznur Kablo)
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* File Drop Area */}
                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-800/20 hover:bg-slate-800/40 transition-colors">
                        <FileText size={48} className="text-slate-500 mb-4" />

                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="hidden"
                            id="pdf-upload"
                        />

                        <label htmlFor="pdf-upload" className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors mb-2">
                            PDF Dosyası Seç
                        </label>

                        {file ? (
                            <div className="text-sm text-emerald-400 mt-2 font-mono bg-emerald-500/10 px-3 py-1 rounded">
                                {file.name}
                            </div>
                        ) : (
                            <div className="text-xs text-slate-500">
                                Sadece .pdf dosyaları kabul edilir.
                            </div>
                        )}
                    </div>

                    {/* Progress / Actions */}
                    {uploading && (
                        <div className="flex items-center justify-center gap-2 text-blue-400">
                            <Loader2 className="animate-spin" size={20} />
                            <span>PDF Okunuyor ve Analiz Ediliyor...</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    {/* Result Preview */}
                    {result && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
                                <CheckCircle size={20} />
                                <div>
                                    <div className="font-bold">Dosya Başarıyla Okundu!</div>
                                    <div className="text-xs opacity-80">{result.totalLines} satır bulundu.</div>
                                </div>
                            </div>

                            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-300 max-h-60 overflow-y-auto">
                                <h3 className="text-slate-500 font-bold mb-2 sticky top-0 bg-slate-950 pb-2 border-b border-slate-800">
                                    İÇERİK ÖNİZLEME (İlk 50 Satır):
                                </h3>
                                {result.textPreview.map((line, i) => (
                                    <div key={i} className="border-b border-slate-800/50 py-1 hover:bg-white/5 px-2">
                                        <span className="text-slate-600 mr-3 select-none">{i + 1}</span>
                                        {line}
                                    </div>
                                ))}
                            </div>

                            <div className="text-xs text-slate-400">
                                * Lütfen içeriği kontrol edin. İskonto oranları ve ürün grupları doğru görünüyor mu?
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-slate-900/50 rounded-b-2xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                    >
                        Kapat
                    </button>
                    {!result && (
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                        >
                            <Upload size={18} />
                            Yükle ve Analiz Et
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiscountUploadModal;
