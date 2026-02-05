import React, { useState, useEffect, useMemo } from 'react';
import {
    FileText, Search, Calendar, ArrowUpRight, ArrowDownLeft, History, Filter,
    CheckCircle, AlertCircle, Clock, Briefcase, Building2, Users, Loader2, RotateCw,
    Save, FolderOpen, Trash2
} from 'lucide-react';
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Sector
} from 'recharts';
import html2pdf from 'html2pdf.js';
import StatCard from '../components/StatCard';

const Checks = () => {
    const [activeTab, setActiveTab] = useState('customer'); // 'customer' | 'own' | 'overdue' | 'recent'
    const printRef = React.useRef(); // Ref for the PDF Template
    const [checks, setChecks] = useState([]);
    const [upcomingChecks, setUpcomingChecks] = useState([]);
    const [activeCheck, setActiveCheck] = useState(null);
    const [upcomingFilter, setUpcomingFilter] = useState('today');
    const [upcomingCheckTab, setUpcomingCheckTab] = useState('all');
    const [recentChecks, setRecentChecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchVal, setSearchVal] = useState('');
    const [period, setPeriod] = useState('weekly');

    // Stats State
    const [checkStats, setCheckStats] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [topIssuers, setTopIssuers] = useState([]);
    const [activePieIndex, setActivePieIndex] = useState(0);

    // Payment Planning State
    const [isPlanningMode, setIsPlanningMode] = useState(false);
    const [targetAmount, setTargetAmount] = useState('');
    const [targetDate, setTargetDate] = useState('');

    // PDF Metadata State
    const [receiverName, setReceiverName] = useState('');
    const [giverName, setGiverName] = useState('ŞEHMUS YAKIŞIKLI ( 533 741 7765 )'); // Default from image
    const [bankName, setBankName] = useState('');

    const [portfolioChecks, setPortfolioChecks] = useState([]);
    const [selectedPaymentChecks, setSelectedPaymentChecks] = useState([]);
    const [planningSearchVal, setPlanningSearchVal] = useState('');

    // Plan Persistence State
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [planName, setPlanName] = useState('');
    const [savedPlans, setSavedPlans] = useState([]);

    // ... existing effects

    // --- PDF Generation (html2pdf) ---
    const generatePDF = () => {
        const element = printRef.current;
        const opt = {
            margin: [5, 5, 5, 5], // MM
            filename: `Odeme_Plani_${new Date().toISOString().slice(0, 10)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(element).save();
    };

    // --- Payment Planning Logic ---
    useEffect(() => {
        fetchChecks();
        fetchUpcomingChecks();
        fetchRecentChecks();
    }, [activeTab]);

    useEffect(() => {
        fetchStats();
    }, [period]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchChecks();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchVal]);

    const fetchStats = async () => {
        try {
            const periodParam = `?period=${period}`;
            const [statsRes, trendRes, issuersRes] = await Promise.all([
                fetch('/api/checks/stats'),
                fetch(`/api/checks/stats/trend${periodParam}`),
                fetch(`/api/checks/stats/top-issuers${periodParam}`)
            ]);

            if (statsRes.ok) setCheckStats(await statsRes.json());
            if (trendRes.ok) setTrendData(await trendRes.json());
            if (issuersRes.ok) setTopIssuers(await issuersRes.json());

        } catch (error) {
            console.error('Error fetching check stats:', error);
        }
    };

    const fetchChecks = async () => {
        setLoading(true);
        try {
            let url = `/api/checks?type=${activeTab}`;
            if (activeTab === 'overdue') url = '/api/checks/overdue';
            else if (activeTab === 'recent') url = '/api/checks/recent';

            if (searchVal && activeTab !== 'recent') url += `${activeTab === 'overdue' ? '?' : '&'}search=${searchVal}`;

            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) setChecks(data);
            else setChecks([]);
        } catch (error) {
            console.error('Error fetching checks:', error);
            setChecks([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/checks/plans');
            if (res.ok) {
                setSavedPlans(await res.json());
            }
        } catch (err) {
            console.error('Error fetching plans:', err);
        }
    };

    const handleSavePlan = async () => {
        if (!planName.trim()) return;
        try {
            const checksToSave = selectedPaymentChecks.map(c => ({
                id: c.id,
                amount: c.amount,
                serialNo: c.serialNo,
                bankName: c.bankName,
                dueDate: c.dueDate,
                clientName: c.clientName // Ensure client name is saved
            }));

            const res = await fetch('/api/checks/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: planName,
                    receiverName,
                    checks: checksToSave
                })
            });

            if (res.ok) {
                setShowSaveModal(false);
                setPlanName('');
                fetchPlans();
            }
        } catch (err) {
            console.error('Error saving plan:', err);
        }
    };

    const handleLoadPlan = (plan) => {
        if (!plan) return;
        setReceiverName(plan.receiverName || '');
        setSelectedPaymentChecks(plan.checks);
        setShowLoadModal(false);
    };

    const handleDeletePlan = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Bu planı silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/checks/plans/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchPlans();
            }
        } catch (err) {
            console.error('Error deleting plan:', err);
        }
    };

    const openLoadModal = () => {
        fetchPlans();
        setShowLoadModal(true);
    };

    const fetchUpcomingChecks = async () => {
        try {
            const res = await fetch('/api/checks/upcoming');
            const data = await res.json();
            if (Array.isArray(data)) setUpcomingChecks(data);
            else setUpcomingChecks([]);
        } catch (error) {
            console.error('Error fetching upcoming checks:', error);
            setUpcomingChecks([]);
        }
    };

    const fetchRecentChecks = async () => {
        try {
            const res = await fetch('/api/checks/recent');
            const data = await res.json();
            if (Array.isArray(data)) setRecentChecks(data);
            else setRecentChecks([]);
        } catch (error) {
            console.error('Error fetching recent checks:', error);
            setRecentChecks([]);
        }
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('tr-TR') : '-';

    const getStatusBadge = (status, type) => {
        const styles = {
            'Portföyde': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'Ciro Edildi': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            'Bankaya Verildi': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            'Tahsil Edildi': 'bg-green-500/20 text-green-400 border-green-500/30',
            'Karşılıksız': 'bg-red-500/20 text-red-400 border-red-500/30',
            'Bekliyor': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
            'Ödendi': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            'Diğer': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        };
        const style = styles[status] || styles['Diğer'];
        return <span className={`px-3 py-1 rounded-full text-xs font-medium border ${style}`}>{status}</span>;
    };

    const renderActiveShape = (props) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, value } = props;
        const total = (checkStats?.portfolio?.total || 0) + (checkStats?.bank?.total || 0) + (checkStats?.endorsed?.total || 0);
        const percent = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
        return (
            <g>
                <text x={cx} y={cy} dy={4} textAnchor="middle" fill="#fff" className="text-xs font-bold">{percent}%</text>
                <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
                <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 8} outerRadius={outerRadius + 10} fill={fill} />
            </g>
        );
    };

    const statusPieData = useMemo(() => {
        if (!checkStats) return [];
        return [
            { name: 'Portföy', value: checkStats.portfolio?.total || 0, color: '#8b5cf6' },
            { name: 'Tahsil', value: checkStats.bank?.total || 0, color: '#10b981' },
            { name: 'Ciro', value: checkStats.endorsed?.total || 0, color: '#f59e0b' },
            { name: 'Karşılıksız', value: (checkStats.protest?.total || 0) + (checkStats.overdue?.total || 0), color: '#f43f5e' }
        ].filter(i => i.value > 0);
    }, [checkStats]);

    const formattedTrendData = useMemo(() => {
        return trendData.map(item => {
            const d = new Date(item.date);
            let fDate = item.date;
            try {
                if (period === 'monthly') fDate = d.toLocaleDateString('tr-TR', { month: 'long' });
                else if (period === 'weekly' || period === 'daily') fDate = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                else if (period === 'yearly') fDate = d.getFullYear().toString();
            } catch (e) { }
            return { ...item, formattedDate: fDate };
        });
    }, [trendData, period]);

    const filteredUpcoming = useMemo(() => {
        if (!upcomingChecks.length) return [];
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);
        const nextMonth = new Date(now); nextMonth.setMonth(now.getMonth() + 1);

        return upcomingChecks.filter(c => {
            if (!c.dueDate) return false;
            const d = new Date(c.dueDate); d.setHours(0, 0, 0, 0);
            if (d < now) return false; // Past
            if (upcomingFilter === 'today') return d.getTime() === now.getTime();
            if (upcomingFilter === 'week') return d <= nextWeek;
            if (upcomingFilter === 'month') return d <= nextMonth;
            return true;
        });
    }, [upcomingChecks, upcomingFilter]);

    // --- Payment Planning Logic ---
    const togglePlanningMode = async () => {
        if (!isPlanningMode) {
            setLoading(true);
            try {
                // Fetch all portfolio checks for planning
                const res = await fetch('/api/checks?type=customer&status=portfolio&limit=1000');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setPortfolioChecks(data.map(c => ({ ...c, selected: false })));
                }
            } catch (err) {
                console.error('Error fetching portfolio for planning:', err);
            } finally {
                setLoading(false);
            }
        } else {
            // Reset
            setTargetAmount('');
            setTargetDate('');
            setSelectedPaymentChecks([]);
        }
        setIsPlanningMode(!isPlanningMode);
    };

    const handleCheckSelect = (check) => {
        if (selectedPaymentChecks.find(c => c.id === check.id)) {
            // Deselect
            setSelectedPaymentChecks(prev => prev.filter(c => c.id !== check.id));
        } else {
            // Select
            setSelectedPaymentChecks(prev => [...prev, check]);
        }
    };

    const autoSelectChecks = () => {
        if (!targetAmount || !portfolioChecks.length) return;

        const target = parseFloat(targetAmount);
        const tDate = targetDate ? new Date(targetDate) : null;

        // --- Improved Algorithm with Strict Constraints ---
        // Constraint 1: Avg Date Deviation <= 5 Days
        // Constraint 2: if Target >= 5M, Max Overshoot = 200k. Else approx 5%.

        const now = new Date();
        const maxDateDev = 5; // days
        const maxOvershoot = target >= 5000000 ? 200000 : target * 0.05;

        let bestSelection = [];
        let bestScore = Number.MAX_VALUE;
        const iterations = 1000; // Increased iterations for harder constraints

        const calculateScore = (selection) => {
            if (selection.length === 0) return Number.MAX_VALUE;

            const total = selection.reduce((sum, c) => sum + c.amount, 0);

            // Hard Constraint: Amount Overshoot
            if (total > target + maxOvershoot) return Number.MAX_VALUE;
            // Hard Constraint: Amount Undershoot (Optional, but let's say we don't want check total < 90% of target unless impossible)
            // But main goal is proximity. Calculate deviations.

            const amountDiff = Math.abs(total - target);

            let dateDiff = 0;
            if (tDate) {
                let weightedSum = 0;
                selection.forEach(c => {
                    const due = new Date(c.dueDate);
                    const diffDays = (due - now) / (1000 * 60 * 60 * 24);
                    weightedSum += (diffDays * c.amount);
                });
                const avgDays = weightedSum / total;
                const targetDays = (tDate - now) / (1000 * 60 * 60 * 24);

                dateDiff = Math.abs(avgDays - targetDays);

                // Hard Constraint: Date Deviation > 5 days -> Discard
                if (dateDiff > maxDateDev) return Number.MAX_VALUE;
            }

            // Score Calculation
            // Priority 1: Amount Proximity (Higher weight)
            // Priority 2: Date Proximity

            const amountPenalty = (amountDiff / target) * 10000;
            const datePenalty = dateDiff * 100;

            return amountPenalty + datePenalty;
        };

        const available = [...portfolioChecks];

        for (let i = 0; i < iterations; i++) {
            const shuffled = [...available].sort(() => 0.5 - Math.random());
            const currentSelection = [];
            let currentSum = 0;

            for (const check of shuffled) {
                // Peek if adding check breaks max overshoot
                if (currentSum + check.amount <= target + maxOvershoot) {
                    currentSelection.push(check);
                    currentSum += check.amount;
                }
            }

            const score = calculateScore(currentSelection);
            if (score < bestScore) {
                bestScore = score;
                bestSelection = currentSelection;
            }
        }

        setSelectedPaymentChecks(bestSelection);
    };

    const planStats = useMemo(() => {
        const total = selectedPaymentChecks.reduce((sum, c) => sum + c.amount, 0);
        const count = selectedPaymentChecks.length;

        let avgDays = 0;
        let weightedSum = 0;
        const now = new Date();

        if (total > 0) {
            selectedPaymentChecks.forEach(c => {
                const due = new Date(c.dueDate);
                const diffTime = Math.abs(due - now);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                weightedSum += (diffDays * c.amount);
            });
            avgDays = Math.ceil(weightedSum / total);
        }

        const avgDate = new Date();
        avgDate.setDate(now.getDate() + avgDays);

        return { total, count, avgDate, avgDays };
    }, [selectedPaymentChecks]);

    // RENDER
    return (
        <div className="p-8 max-w-full mx-auto space-y-8 text-slate-100 pb-24">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Çek / Senet İşlemleri</h1>
                    <p className="text-slate-400 mt-2">Finansal hareketlerin detaylı takibi</p>
                </div>
                <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800 h-fit">
                    {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
                        <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${period === p ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:text-white'}`}>
                            {p === 'daily' ? 'Günlük' : p === 'weekly' ? 'Haftalık' : p === 'monthly' ? 'Aylık' : 'Yıllık'}
                        </button>
                    ))}
                    <button onClick={() => { fetchChecks(); fetchStats(); }} className="p-2 ml-2 text-slate-400 hover:text-white transition-colors" title="Yenile"><RotateCw size={18} /></button>
                    <button
                        onClick={togglePlanningMode}
                        className={`ml-4 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isPlanningMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-500/30'}`}
                    >
                        <Filter size={16} />
                        {isPlanningMode ? 'Planlamayı Kapat' : 'Ödeme Planla'}
                    </button>
                </div>
            </div>

            {/* Payment Planning Overlay */}
            {isPlanningMode && (
                <div className="bg-slate-900/50 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-xl animate-fade-in shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Input & Selected */}
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">Ödeme Hedefi</h2>
                                <p className="text-slate-400 text-sm">Ödemek istediğiniz tutar ve vadeyi girin.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 font-semibold uppercase">Hedef Tutar</label>
                                    <input
                                        type="number"
                                        value={targetAmount}
                                        onChange={e => setTargetAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-semibold uppercase">Hedef Vade</label>
                                    <input
                                        type="date"
                                        value={targetDate}
                                        onChange={e => setTargetDate(e.target.value)}
                                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* PDF Inputs */}
                            <div className="space-y-4 pt-4 border-t border-slate-800/50">
                                <div>
                                    <label className="text-xs text-slate-500 font-semibold uppercase">Alıcı Ünvanı (PDF)</label>
                                    <input
                                        type="text"
                                        value={receiverName}
                                        onChange={e => setReceiverName(e.target.value.toLocaleUpperCase('tr-TR'))}
                                        placeholder="ÖZNUR KABLO A.Ş."
                                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none uppercase"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 font-semibold uppercase">Teslim Alan Banka</label>
                                        <input
                                            type="text"
                                            value={bankName}
                                            onChange={e => setBankName(e.target.value)}
                                            placeholder="BANKA ADI..."
                                            className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-semibold uppercase">Teslim Eden</label>
                                        <input
                                            type="text"
                                            value={giverName}
                                            onChange={e => setGiverName(e.target.value)}
                                            className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none uppercase"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={autoSelectChecks}
                                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98]"
                            >
                                ✨ Uygun Çekleri Seç (Otomatik)
                            </button>

                            <div className="bg-slate-950/50 rounded-xl p-6 border border-slate-800 space-y-4">
                                <h3 className="text-sm font-semibold text-slate-400 border-b border-slate-800 pb-2">Seçilenler Özeti</h3>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Seçilen Adet</span>
                                    <span className="text-white font-bold">{planStats.count}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Toplam Tutar</span>
                                    <span className="text-2xl font-mono font-bold text-emerald-400">{formatCurrency(planStats.total)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Ortalama Vade</span>
                                    <div className="text-right">
                                        <div className="text-white font-bold">{planStats.total > 0 ? planStats.avgDate.toLocaleDateString('tr-TR') : '-'}</div>
                                        <div className="text-xs text-slate-500">{planStats.avgDays} Gün</div>
                                    </div>
                                </div>

                                {targetAmount && (
                                    <div className="pt-2 border-t border-slate-800 mt-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500">Hedef Farkı</span>
                                            <span className={`${(planStats.total - parseFloat(targetAmount)) > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                                {formatCurrency(planStats.total - parseFloat(targetAmount))}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={generatePDF}
                                disabled={selectedPaymentChecks.length === 0}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all"
                            >
                                <FileText size={18} />
                                PDF Çıktısı Oluştur
                            </button>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setShowSaveModal(true)}
                                    disabled={selectedPaymentChecks.length === 0}
                                    className="py-3 bg-indigo-900/50 hover:bg-indigo-900/80 disabled:opacity-50 disabled:cursor-not-allowed text-indigo-200 font-bold rounded-xl border border-indigo-800 flex items-center justify-center gap-2 transition-all"
                                >
                                    <Save size={18} />
                                    Planı Kaydet
                                </button>
                                <button
                                    onClick={openLoadModal}
                                    className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all"
                                >
                                    <FolderOpen size={18} />
                                    Plan Yükle
                                </button>
                            </div>
                        </div>

                        {/* Middle/Right: List */}
                        <div className="lg:col-span-2 flex flex-col h-[500px]">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="font-bold text-white">Portföydeki Çekler</h3>
                                    <div className="text-xs text-slate-400">
                                        Tıklayarak manuel ekle/çıkar yapabilirsiniz.
                                    </div>
                                </div>
                                <div className="relative flex items-center gap-2">
                                    {selectedPaymentChecks.length > 0 && (
                                        <button
                                            onClick={() => setSelectedPaymentChecks([])}
                                            className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
                                            Temizle
                                        </button>
                                    )}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                                        <input
                                            type="text"
                                            value={planningSearchVal}
                                            onChange={e => setPlanningSearchVal(e.target.value)}
                                            placeholder="Çek No ile Ara..."
                                            className="bg-slate-950/50 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:border-indigo-500 outline-none w-48"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-slate-950/30 rounded-xl border border-slate-800">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-900 sticky top-0 text-xs uppercase text-slate-400 font-medium z-10">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Seç</th>
                                            <th className="px-4 py-3 text-left">Çek No</th>
                                            <th className="px-4 py-3 text-left">Vade</th>
                                            <th className="px-4 py-3 text-left">Cari / Banka</th>
                                            <th className="px-4 py-3 text-right">Tutar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {/* Filter then Sort */}
                                        {[...portfolioChecks].filter(c => c.serialNo.toLowerCase().includes(planningSearchVal.toLowerCase())).sort((a, b) => {
                                            const isSelectedA = selectedPaymentChecks.find(c => c.id === a.id);
                                            const isSelectedB = selectedPaymentChecks.find(c => c.id === b.id);
                                            if (isSelectedA && !isSelectedB) return -1;
                                            if (!isSelectedA && isSelectedB) return 1;
                                            return new Date(a.dueDate) - new Date(b.dueDate); // Secondary Sort: Date Asc
                                        }).map(check => {
                                            const isSelected = selectedPaymentChecks.find(c => c.id === check.id);
                                            return (
                                                <tr
                                                    key={check.id}
                                                    onClick={() => handleCheckSelect(check)}
                                                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-600/20 hover:bg-indigo-600/30' : 'hover:bg-slate-800/50 text-slate-400'}`}
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>
                                                            {isSelected && <CheckCircle size={14} className="text-white" />}
                                                        </div>
                                                    </td>
                                                    <td className={`px-4 py-3 font-mono text-xs ${isSelected ? 'text-white' : 'text-slate-400'}`}>{check.serialNo}</td>
                                                    <td className={`px-4 py-3 font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>{formatDate(check.dueDate)}</td>
                                                    <td className="px-4 py-3">
                                                        <div className={isSelected ? 'text-slate-200' : ''}>{check.clientName}</div>
                                                        <div className="text-xs opacity-60">{check.bankName}</div>
                                                    </td>
                                                    <td className={`px-4 py-3 text-right font-mono ${isSelected ? 'text-emerald-400 font-bold' : ''}`}>{formatCurrency(check.amount)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Portföydeki Çekler"
                    value={checkStats?.portfolio?.total || 0}
                    isCurrency={true}
                    icon="briefcase"
                    color="blue"
                />
                <StatCard
                    title="Tahsil Edilen"
                    value={checkStats?.bank?.total || 0}
                    isCurrency={true}
                    icon="check-circle"
                    color="green"
                />
                <StatCard
                    title="Ciro Edilen"
                    value={checkStats?.endorsed?.total || 0}
                    isCurrency={true}
                    icon="refresh-cw"
                    color="orange"
                />
                <StatCard
                    title="Riskli / Karşılıksız"
                    value={(checkStats?.protest?.total || 0) + (checkStats?.overdue?.total || 0)}
                    isCurrency={true}
                    icon="alert-circle"
                    color="red"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. Status Pie */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-slate-400 mb-3">Durum Dağılımı</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie
                                activeIndex={activePieIndex}
                                activeShape={renderActiveShape}
                                data={statusPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                                onMouseEnter={(_, index) => setActivePieIndex(index)}
                            >
                                {statusPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} formatter={(value) => `₺${(value / 1000).toFixed(1)}k`} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* 2. Trend Area */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl md:col-span-2">
                    <h3 className="text-xs font-semibold text-slate-400 mb-3">Vade Trendi</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={formattedTrendData}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="formattedDate"
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                            />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} formatter={(value) => `₺${(value / 1000).toFixed(1)}k`} />
                            <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAmount)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* 3. Top Issuers Bar */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-slate-400 mb-3">En Çok Çek Verenler</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={topIssuers} layout="vertical" margin={{ left: 0, right: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={80}
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '..' : value}
                            />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} formatter={(value) => `₺${(value / 1000).toFixed(0)}k`} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12} fill="#8b5cf6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Upcoming Checks Section (Zebra List) */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400"><Clock size={20} /></div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Yaklaşan Çekler</h3>
                            <p className="text-xs text-slate-400">Önümüzdeki ödemeler ve tahsilatlar</p>
                        </div>
                    </div>
                    <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                        {['today', 'week', 'month'].map((f) => (
                            <button key={f} onClick={() => setUpcomingFilter(f)} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${upcomingFilter === f ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                                {f === 'today' ? 'Bugün' : f === 'week' ? 'Bu Hafta' : 'Bu Ay'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-6 pb-4 bg-slate-900/80 border-b border-slate-800">
                    <div className="flex gap-2">
                        {['all', 'own', 'portfolio', 'endorsed'].map(tab => {
                            const count = filteredUpcoming.filter(check => {
                                if (tab === 'all') return true;
                                if (tab === 'own') return check.type === 'own' || (Number(check.status) >= 7 && Number(check.status) <= 13);
                                if (tab === 'portfolio') return Number(check.status) === 1;
                                if (tab === 'endorsed') return Number(check.status) === 2;
                                return false;
                            }).length;

                            return (
                                <button
                                    key={tab}
                                    onClick={() => setUpcomingCheckTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${upcomingCheckTab === tab ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                >
                                    {tab === 'all' ? `Tümü (${count})` :
                                        tab === 'own' ? `Kendi Çeklerimiz (${count})` :
                                            tab === 'portfolio' ? `Müşteri (Portföy) (${count})` :
                                                `Müşteri (Cirolu) (${count})`}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-950 text-slate-500 uppercase font-medium text-xs">
                            <tr>
                                <th className="px-6 py-3">Seri No</th>
                                <th className="px-6 py-3">Vade</th>
                                <th className="px-6 py-3">Firma Ünvanı</th>
                                <th className="px-6 py-3">Banka</th>
                                <th className="px-6 py-3 text-right">Tutar</th>
                                <th className="px-6 py-3">Ciro Edilen / Ödenen</th>
                                <th className="px-6 py-3 text-center">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {(() => {
                                const visibleChecks = filteredUpcoming.filter(check => {
                                    if (upcomingCheckTab === 'all') return true;
                                    if (upcomingCheckTab === 'own') return check.type === 'own' || (Number(check.status) >= 7 && Number(check.status) <= 13);
                                    if (upcomingCheckTab === 'portfolio') return Number(check.status) === 1;
                                    if (upcomingCheckTab === 'endorsed') return Number(check.status) === 2;
                                    return false;
                                });

                                if (visibleChecks.length === 0) {
                                    return <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">Seçilen kategoride yaklaşan çek bulunmamaktadır.</td></tr>;
                                }

                                return visibleChecks.map((check, idx) => (
                                    <tr key={check.id} onClick={() => setActiveCheck(check)} className={`${idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-900/10'} hover:bg-indigo-900/10 transition-colors cursor-pointer group`}>
                                        <td className="px-6 py-3 font-mono text-slate-100 font-bold text-sm tracking-wide">{check.serialNo}</td>
                                        <td className="px-6 py-3 font-medium text-slate-200">{formatDate(check.dueDate)}</td>
                                        <td className="px-6 py-3 text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <Users size={14} className="text-slate-500" />
                                                <span className="truncate max-w-[200px]" title={check.clientName}>{check.clientName || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={14} className="text-slate-600" />
                                                <span className="truncate max-w-[150px]">{check.bankName || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono text-slate-200 font-medium">{formatCurrency(check.amount)}</td>
                                        <td className="px-6 py-3 text-slate-400">
                                            {check.endorseeName ? <div className="flex items-center gap-2 text-orange-400/80"><ArrowUpRight size={14} /><span className="truncate max-w-[150px]">{check.endorseeName}</span></div> : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-center">{getStatusBadge(check.statusLabel, check.type)}</td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Main Tabs and Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-12">
                <div className="flex p-1 bg-slate-900/50 rounded-xl border border-slate-800">
                    {['customer', 'own', 'overdue', 'recent'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            {tab === 'customer' && 'Müşteri Çekleri'}
                            {tab === 'own' && 'Kendi Çeklerimiz'}
                            {tab === 'overdue' && 'Günü Geçenler'}
                            {tab === 'recent' && 'Son İşlemler'}
                        </button>
                    ))}
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input type="text" placeholder="Çek No / Portföy No / Cari Ünvanı" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                </div>
            </div>

            {/* Main Tables */}
            <div className="space-y-8">
                {/* Customer Portfolio */}
                {(activeTab === 'customer' || activeTab === 'overdue') && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-xl overflow-hidden">
                        <div className="p-4 bg-slate-950/50 flex items-center gap-2 border-b border-slate-800">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <h3 className="font-semibold text-slate-200">Müşteri Çekleri (Portföyde)</h3>
                            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full ml-auto">{checks.filter(c => c.category === 'customer_portfolio').length} Kayıt</span>
                        </div>
                        <table className="w-full">
                            <thead className="bg-slate-950/30 text-xs uppercase text-slate-400 font-medium"><tr><th className="px-6 py-3 text-left">Vade</th><th className="px-6 py-3 text-left">Cari</th><th className="px-6 py-3 text-left">Portföy No</th><th className="px-6 py-3 text-right">Tutar</th></tr></thead>
                            <tbody className="divide-y divide-slate-800">{checks.filter(c => c.category === 'customer_portfolio').map((check) => (
                                <tr key={check.id} onClick={() => setActiveCheck(check)} className="hover:bg-slate-800/30 transition-colors cursor-pointer"><td className="px-6 py-3 text-red-400 font-medium">{formatDate(check.dueDate)}</td><td className="px-6 py-3 text-slate-300">{check.clientName}</td><td className="px-6 py-3 text-slate-400 text-sm">{check.portfolioNo}</td><td className="px-6 py-3 text-right font-mono text-slate-200">{formatCurrency(check.amount)}</td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                )}

                {/* Own Checks Table */}
                {(activeTab === 'own' || activeTab === 'overdue') && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-xl overflow-hidden">
                        <div className="p-4 bg-slate-950/50 flex items-center gap-2 border-b border-slate-800">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <h3 className="font-semibold text-slate-200">Kendi Çeklerimiz {activeTab === 'overdue' ? '(Ödenmemiş)' : ''}</h3>
                            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full ml-auto">{checks.filter(c => c.type === 'own').length} Kayıt</span>
                        </div>
                        <table className="w-full">
                            <thead className="bg-slate-950/30 text-xs uppercase text-slate-400 font-medium"><tr><th className="px-6 py-3 text-left">Vade</th><th className="px-6 py-3 text-left">Banka</th><th className="px-6 py-3 text-left">Seri No</th><th className="px-6 py-3 text-right">Tutar</th></tr></thead>
                            <tbody className="divide-y divide-slate-800">{checks.filter(c => c.type === 'own').map((check) => {
                                // Vade kontrolü
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const dueDate = check.dueDate ? new Date(check.dueDate) : null;
                                if (dueDate) dueDate.setHours(0, 0, 0, 0);
                                const isOverdue = dueDate && dueDate < today;

                                return (
                                    <tr
                                        key={check.id}
                                        onClick={() => setActiveCheck(check)}
                                        className={`hover:bg-slate-800/30 transition-colors cursor-pointer ${isOverdue ? 'bg-red-900/20 hover:bg-red-900/30 border-l-4 border-l-red-500' : ''}`}
                                    >
                                        <td className={`px-6 py-3 font-medium flex items-center gap-2 ${isOverdue ? 'text-red-400' : 'text-slate-300'}`}>
                                            {isOverdue && <AlertCircle size={16} className="text-red-400 animate-pulse" />}
                                            {formatDate(check.dueDate)}
                                            {isOverdue && <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-bold">VADESİ GEÇTİ</span>}
                                        </td>
                                        <td className="px-6 py-3 text-slate-300">{check.bankName}</td>
                                        <td className="px-6 py-3 text-slate-400 text-sm">{check.serialNo}</td>
                                        <td className={`px-6 py-3 text-right font-mono ${isOverdue ? 'text-red-400 font-bold' : 'text-slate-200'}`}>{formatCurrency(check.amount)}</td>
                                    </tr>
                                );
                            })}</tbody>
                        </table>
                    </div>
                )}

                {/* Customer Endorsed */}
                {(activeTab === 'customer' || activeTab === 'overdue') && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-xl overflow-hidden opacity-80">
                        <div className="p-4 bg-slate-950/50 flex items-center gap-2 border-b border-slate-800">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <h3 className="font-semibold text-slate-200">Müşteri Çekleri (Ciro Edildi)</h3>
                            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full ml-auto">{checks.filter(c => c.category === 'customer_endorsed').length} Kayıt</span>
                        </div>
                        <table className="w-full">
                            <thead className="bg-slate-950/30 text-xs uppercase text-slate-400 font-medium"><tr><th className="px-6 py-3 text-left">Vade</th><th className="px-6 py-3 text-left">Cari</th><th className="px-6 py-3 text-left">Portföy No</th><th className="px-6 py-3 text-right">Tutar</th></tr></thead>
                            <tbody className="divide-y divide-slate-800">{checks.filter(c => c.category === 'customer_endorsed').map((check) => (
                                <tr key={check.id} onClick={() => setActiveCheck(check)} className="hover:bg-slate-800/30 transition-colors cursor-pointer"><td className="px-6 py-3 text-red-400 font-medium">{formatDate(check.dueDate)}</td><td className="px-6 py-3 text-slate-300">{check.clientName}</td><td className="px-6 py-3 text-slate-400 text-sm">{check.portfolioNo}</td><td className="px-6 py-3 text-right font-mono text-slate-200">{formatCurrency(check.amount)}</td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                )}

                {/* Recent Table */}
                {activeTab === 'recent' && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-xl overflow-hidden">
                        <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <h3 className="font-semibold text-slate-200">Son 20 İşlem</h3>
                        </div>
                        <table className="w-full">
                            <thead className="bg-slate-950/30 text-xs uppercase text-slate-400 font-medium"><tr><th className="px-6 py-3 text-left">Tip</th><th className="px-6 py-3 text-left">Durum</th><th className="px-6 py-3 text-left">Vade</th><th className="px-6 py-3 text-left">Cari</th><th className="px-6 py-3 text-left">Tutar</th></tr></thead>
                            <tbody className="divide-y divide-slate-800">{checks.map((check) => (
                                <tr key={check.id} onClick={() => setActiveCheck(check)} className="hover:bg-slate-800/30 transition-colors cursor-pointer"><td className="px-6 py-3">{check.type === 'own' ? 'Kendi' : 'Müşteri'}</td><td className="px-6 py-3">{getStatusBadge(check.statusLabel, check.type)}</td><td className="px-6 py-3">{formatDate(check.dueDate)}</td><td className="px-6 py-3">{check.clientName}</td><td className="px-6 py-3 font-mono">{formatCurrency(check.amount)}</td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {activeCheck && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                        <button onClick={() => setActiveCheck(null)} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">✕</button>
                        <div className="p-6 border-b border-slate-800 bg-slate-800/30">
                            <h3 className="text-xl font-bold text-white">Çek Detayı</h3>
                            <div className="flex items-center gap-2 mt-2"><span className="text-slate-400 text-sm">{activeCheck.portfolioNo} / {activeCheck.serialNo}</span></div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div><label className="text-xs text-slate-500 uppercase font-semibold">{activeCheck.type === 'own' ? 'Firma (Alıcı)' : 'Cari Hesap'}</label><p className="text-white font-medium text-lg mt-1 truncate">{activeCheck.clientName || 'Cari Yok'}</p></div>
                                <div className="text-right"><label className="text-xs text-slate-500 uppercase font-semibold">Tutar</label><p className="text-emerald-400 font-bold text-2xl mt-1 font-mono">{formatCurrency(activeCheck.amount)}</p></div>
                            </div>
                            <div className="grid grid-cols-2 gap-6 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                                <div><label className="text-xs text-slate-500 uppercase">Vade Tarihi</label><p className="text-slate-200 mt-1 font-semibold">{formatDate(activeCheck.dueDate)}</p></div>
                                <div><label className="text-xs text-slate-500 uppercase">Banka</label><p className="text-slate-200 mt-1 truncate">{activeCheck.bankName || '-'}</p></div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-slate-800/50"><span className="text-slate-500 text-sm">Çek Durumu</span><span>{getStatusBadge(activeCheck.statusLabel, activeCheck.type)}</span></div>
                                <div className="flex justify-between py-2 border-b border-slate-800/50"><span className="text-slate-500 text-sm">Ciro Edilen</span><span className="text-slate-300 text-sm">{activeCheck.endorseeName || '-'}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* --- HTML PRINT TEMPLATE (Hidden but Rendered) --- */}
            {/* --- Modals --- */}

            {/* Save Plan Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Planı Kaydet</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-400 block mb-1">Plan İsmi</label>
                                <input
                                    type="text"
                                    value={planName}
                                    onChange={e => setPlanName(e.target.value)}
                                    placeholder="Örn: X Firması Kasım Ödemesi"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowSaveModal(false)} className="flex-1 py-2 text-slate-400 hover:text-white font-medium">İptal</button>
                                <button onClick={handleSavePlan} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold">Kaydet</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Load Plan Modal */}
            {showLoadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Kayıtlı Planlar</h3>
                            <button onClick={() => setShowLoadModal(false)} className="text-slate-400 hover:text-white">Kapat</button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {savedPlans.length === 0 ? (
                                <div className="text-center text-slate-500 py-10">Henüz kayıtlı plan bulunmamaktadır.</div>
                            ) : (
                                savedPlans.map(plan => (
                                    <div key={plan.id} onClick={() => handleLoadPlan(plan)} className="bg-slate-950/50 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-900/10 rounded-xl p-4 cursor-pointer transition-all group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-white text-lg">{plan.name}</h4>
                                                <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                                                    <span>{new Date(plan.date).toLocaleDateString('tr-TR')}</span>
                                                    <span>•</span>
                                                    <span>{plan.count} Çek</span>
                                                    <span>•</span>
                                                    <span className="text-emerald-400 font-mono">{formatCurrency(plan.totalAmount)}</span>
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1 uppercase tracking-wide">{plan.receiverName || 'Alıcı Yok'}</div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeletePlan(plan.id, e)}
                                                className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- HTML PRINT TEMPLATE (Hidden but Rendered) --- */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '0px', height: '0px', overflow: 'hidden' }}>
                <div ref={printRef} className="w-[280mm] h-auto bg-white text-slate-900 font-sans relative text-sm leading-normal">
                    {(() => {
                        const MAX_ROWS_FULL = 22;
                        const MAX_ROWS_WITH_FOOTER = 15;
                        const pages = [];
                        // Sort selected checks by Due Date
                        let tempChecks = [...selectedPaymentChecks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

                        // If no checks, create empty page
                        if (tempChecks.length === 0) {
                            pages.push({ type: 'last', checks: [], fillCount: MAX_ROWS_WITH_FOOTER, startIndex: 0 });
                        } else {
                            while (tempChecks.length > 0) {
                                let startIndex = selectedPaymentChecks.length - tempChecks.length;

                                // 1. Check if we can fit remaining items on a "last page" (with footer)
                                if (tempChecks.length <= MAX_ROWS_WITH_FOOTER) {
                                    pages.push({ type: 'last', checks: [...tempChecks], fillCount: MAX_ROWS_WITH_FOOTER - tempChecks.length, startIndex });
                                    tempChecks = []; // Done
                                    break;
                                }

                                let take = Math.min(tempChecks.length, MAX_ROWS_FULL);
                                const slice = tempChecks.slice(0, take);
                                tempChecks = tempChecks.slice(take);

                                pages.push({ type: 'full', checks: slice, fillCount: MAX_ROWS_FULL - slice.length, startIndex });
                            }

                            // If we finished the loop but the last page added wasn't a 'last' type (with footer),
                            // we must add an overflow page for the footer.
                            if (pages.length > 0 && pages[pages.length - 1].type !== 'last') {
                                pages.push({ type: 'last', checks: [], fillCount: MAX_ROWS_WITH_FOOTER, startIndex: selectedPaymentChecks.length });
                            }
                        }

                        return pages.map((page, pIdx) => (
                            <div key={pIdx} className="w-[280mm] h-[190mm] p-2 relative flex flex-col" style={{ pageBreakAfter: pIdx < pages.length - 1 ? 'always' : 'auto' }}>
                                {/* Header: Date + Company Name */}
                                <div className="flex items-center mb-2">
                                    <div className="font-bold text-slate-900 text-lg w-40">
                                        {new Date().toLocaleDateString('tr-TR')}
                                    </div>
                                    <div className="flex-1 text-center font-bold text-xl text-slate-900">
                                        {(receiverName || 'ALICI FİRMA BELİRTİLMEDİ').toLocaleUpperCase('tr-TR')}
                                    </div>
                                    <div className="w-40"></div> {/* Spacer for balance */}
                                </div>


                                {/* Table Container */}
                                <div className={`w-full border-4 border-slate-900 rounded-lg overflow-hidden flex-1 flex flex-col`}>
                                    {/* Table Header */}
                                    <div className="flex bg-slate-100 border-b border-slate-300 font-bold text-slate-700 uppercase text-xs h-[32px] items-center shrink-0">
                                        <div className="w-[5%] border-r border-slate-200 h-full flex items-center justify-center text-center">NO</div>
                                        <div className="w-[30%] px-4 border-r border-slate-200 h-full flex items-center">BANKA ADI</div>
                                        <div className="w-[20%] px-4 border-r border-slate-200 h-full flex items-center justify-center text-center">ÇEK NO</div>
                                        <div className="w-[20%] px-4 border-r border-slate-200 h-full flex items-center justify-center text-center">VADE</div>
                                        <div className="w-[25%] px-4 h-full flex items-center justify-end text-right">TUTAR</div>
                                    </div>

                                    {/* Checks Rows */}
                                    {page.checks.map((check, i) => (
                                        <div key={i} className="flex border-b border-slate-200 h-[28px] items-center text-sm font-semibold odd:bg-white even:bg-slate-50 shrink-0">
                                            <div className="w-[5%] border-r border-slate-200 h-full flex items-center justify-center text-slate-500 text-xs">{page.startIndex + i + 1}</div>
                                            <div className="w-[30%] px-4 border-r border-slate-200 uppercase truncate h-full flex items-center text-slate-800">{check.bankName}</div>
                                            <div className="w-[20%] px-4 border-r border-slate-200 h-full flex items-center justify-center font-mono text-slate-700">{check.serialNo}</div>
                                            <div className="w-[20%] px-4 border-r border-slate-200 h-full flex items-center justify-center text-slate-700">{formatDate(check.dueDate)}</div>
                                            <div className="w-[25%] px-4 h-full flex items-center justify-end font-bold font-mono text-slate-900 text-base">{formatCurrency(check.amount)}</div>
                                        </div>
                                    ))}

                                    {/* Filler Rows */}
                                    {Array.from({ length: page.fillCount }).map((_, i) => (
                                        <div key={`empty-${i}`} className="flex border-b border-slate-200 h-[28px] odd:bg-white even:bg-slate-50 shrink-0">
                                            <div className="w-[5%] border-r border-slate-200 h-full"></div>
                                            <div className="w-[30%] px-4 border-r border-slate-200 h-full"></div>
                                            <div className="w-[20%] px-4 border-r border-slate-200 h-full"></div>
                                            <div className="w-[20%] px-4 border-r border-slate-200 h-full"></div>
                                            <div className="w-[25%] px-4 h-full"></div>
                                        </div>
                                    ))}

                                    {/* Footer (Only if last page) */}
                                    {page.type === 'last' && (
                                        <>
                                            {/* Footer Row 1: TOTAL */}
                                            <div className="flex border-b border-slate-300 h-[32px] items-center text-sm font-bold shrink-0 bg-slate-50">
                                                <div className="w-[5%] border-r border-slate-200 h-full"></div>
                                                <div className="w-[30%] border-r border-slate-200 h-full"></div>
                                                <div className="w-[20%] border-r border-slate-200 h-full"></div>
                                                <div className="w-[20%] border-r border-slate-200 h-full flex items-center justify-end px-2 text-slate-700">TOPLAM TUTAR</div>
                                                <div className="w-[25%] px-4 h-full flex items-center justify-end bg-slate-200 text-slate-900 border-slate-300 text-xl font-extrabold">
                                                    {formatCurrency(planStats.total)}
                                                </div>
                                            </div>

                                            {/* Footer Row 2: COMPANY NAME */}
                                            <div className="flex border-b border-slate-300 h-[28px] items-center px-4 text-xs font-bold text-slate-900 uppercase bg-white shrink-0">
                                                YAKIŞIKLI ELEKTRİK ELEKTRONİK NAK.SAN.TİC.LTD.ŞTİ.
                                            </div>

                                            {/* Footer Row 3: Signature Headers */}
                                            <div className="flex border-b border-slate-300 h-[28px] items-center text-xs font-bold text-slate-900 uppercase bg-white shrink-0">
                                                <div className="w-1/2 px-4 border-r border-slate-300 h-full flex items-center justify-between">
                                                    <span>TESLİM EDEN:</span>
                                                    <span className="font-extrabold">{giverName}</span>
                                                </div>
                                                <div className="w-1/2 px-4 h-full flex items-center justify-between">
                                                    <span>TESLİM ALAN BANKA BİLGİLERİ:</span>
                                                    <span className="font-extrabold">{bankName}</span>
                                                </div>
                                            </div>

                                            {/* Footer Row 4: Signature Values (Space for Stamp/Sign) */}
                                            <div className="flex h-[80px] items-start pt-2 text-xs font-bold text-slate-900 uppercase bg-white border-b border-slate-300 shrink-0">
                                                <div className="w-1/2 px-4 border-r border-slate-300 h-full flex items-start pt-2 opacity-50">
                                                    (İmza / Kaşe)
                                                </div>
                                                <div className="w-1/2 px-4 h-full flex items-start pt-2 opacity-50">
                                                    (İmza / Kaşe)
                                                </div>
                                            </div>

                                            {/* Footer Row 5: Empty Space (Visual) */}
                                            <div className="flex h-[20px] items-center text-xs font-bold text-slate-900 uppercase bg-white border-b-4 border-slate-900 shrink-0">
                                                <div className="w-1/2 px-4 border-r border-slate-300 h-full"></div>
                                                <div className="w-1/2 px-4 h-full"></div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            </div>
        </div>
    );
};
export default Checks;
