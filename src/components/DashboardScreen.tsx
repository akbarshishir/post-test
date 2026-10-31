import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Receipt,
  AlertTriangle,
  Users,
  PlusCircle,
  PackagePlus,
  ArrowRight,
  Eye,
  RotateCcw,
  BadgeDollarSign,
  Boxes,
  BellRing,
  X,
  Volume2,
} from 'lucide-react';
import { BusinessSettings, DashboardMetrics, Product, Sale } from '../types/pos';
import { translations } from '../i18n/translations';
import { formatCurrency, formatDate } from '../services/pdfReceipt';

interface DashboardScreenProps {
  metrics: DashboardMetrics;
  recentSales: Sale[];
  lowStockProducts: Product[];
  settings: BusinessSettings;
  onNavigate: (tab: any) => void;
  onSelectSaleForReceipt: (sale: Sale) => void;
  onRefundSale: (sale: Sale) => void;
  onOpenAddProductModal: () => void;
  onOpenAddExpenseModal: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  metrics,
  recentSales,
  lowStockProducts,
  settings,
  onNavigate,
  onSelectSaleForReceipt,
  onRefundSale,
  onOpenAddProductModal,
  onOpenAddExpenseModal,
}) => {
  const t = translations[settings.language];
  const sym = settings.currencySymbol;

  // In-app Toast and Push Alert States
  const [showToast, setShowToast] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const lastAlertStockHash = useRef<string>('');

  // Audio synthesizer chime for offline low-stock alert
  const playAlertChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // Note D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // Note A5
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio autoplay policy
    }
  };

  // Mobile device haptic feedback
  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([120, 70, 120]);
      }
    } catch {
      // Ignore vibration error
    }
  };

  // Push / System Notification Trigger
  const triggerPushNotification = (products: Product[]) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const count = products.length;
    const topProd = products[0];
    const prodName = settings.language === 'bn' ? topProd.nameBn || topProd.name : topProd.name;
    const title = settings.language === 'bn' 
      ? '⚠️ লো-স্টক সতর্কবার্তা!' 
      : '⚠️ Low Stock Alert!';
    const body = settings.language === 'bn'
      ? `${prodName} এর বর্তমান স্টক মাত্র ${topProd.stockQuantity} ${topProd.unit}। মোট ${count} টি পণ্যের স্টক ফুরিয়ে আসছে!`
      : `${prodName} has only ${topProd.stockQuantity} ${topProd.unit} left! Total ${count} items low on stock.`;

    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: './pwa-192x192.png',
          tag: 'low-stock-alert',
        });
      } catch {
        // Fallback
      }
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          try {
            new Notification(title, {
              body,
              icon: './pwa-192x192.png',
              tag: 'low-stock-alert',
            });
          } catch {
            // Fallback
          }
        }
      });
    }
  };

  // Automatic trigger on mount and when low-stock items change
  const currentHash = lowStockProducts.map((p) => `${p.id}:${p.stockQuantity}`).join(',');
  useEffect(() => {
    if (lowStockProducts.length > 0) {
      if (lastAlertStockHash.current !== currentHash) {
        lastAlertStockHash.current = currentHash;
        setShowToast(true);
        setIsDismissed(false);
        playAlertChime();
        triggerHaptic();
        triggerPushNotification(lowStockProducts);
      }
    } else {
      setShowToast(false);
    }
  }, [currentHash, lowStockProducts.length]);

  return (
    <div className="space-y-4 pb-20 animate-fade-in relative">
      {/* Floating In-App Toast Alert for Low Stock */}
      {showToast && !isDismissed && lowStockProducts.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-bounce-short">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border-2 border-amber-500/80 backdrop-blur-md flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <BellRing className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>লো-স্টক সতর্কবার্তা ({lowStockProducts.length} টি পণ্য)</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={playAlertChime}
                  title="সাউন্ড শুনুন"
                  className="p-1 text-slate-400 hover:text-amber-400 transition"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsDismissed(true)}
                  className="p-1 text-slate-400 hover:text-white transition"
                  title="বন্ধ করুন"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-200">
              <p className="font-semibold text-white">
                {settings.language === 'bn' ? lowStockProducts[0].nameBn || lowStockProducts[0].name : lowStockProducts[0].name}
              </p>
              <p className="text-[11px] text-amber-300 mt-0.5">
                বর্তমান স্টক মাত্র {lowStockProducts[0].stockQuantity} {lowStockProducts[0].unit} (সর্বনিম্ন সীমা: {lowStockProducts[0].lowStockThreshold})
                {lowStockProducts.length > 1 && ` এবং আরও ${lowStockProducts.length - 1} টি পণ্যের স্টক ফুরিয়ে আসছে`}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsDismissed(true);
                  onNavigate('products');
                }}
                className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <span>স্টক চেক ও রিস্টক করুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition font-medium"
              >
                পরে দেখব
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">
                {t.appName}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold mt-0.5">
                {settings.language === 'bn' ? settings.businessNameBn : settings.businessName}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-blue-200 block">{t.today}</span>
              <span className="text-sm font-semibold">{new Date().toLocaleDateString(settings.language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
          <p className="text-xs text-blue-100 mt-2 max-w-lg">
            {t.profitExplanation}
          </p>
        </div>
        {/* Subtle decorative circle */}
        <div className="absolute -right-8 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* 4 Primary Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Today's Sales */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{t.todaySales}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(metrics.todaySales, sym)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {metrics.todaySalesCount} টি বিক্রয় সম্পন্ন
            </span>
          </div>
        </div>

        {/* Estimated Gross Profit */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{t.todayProfit}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <BadgeDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(metrics.todayEstimatedGrossProfit, sym)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              বিক্রয় - ক্রয় খরচ (COGS)
            </span>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{t.todayExpenses}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(metrics.todayExpenses, sym)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              দোকান পরিচালন ব্যয়
            </span>
          </div>
        </div>

        {/* Customer Balance Due */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{t.customerDues}</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(metrics.totalCustomerCreditDue, sym)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              বাকির খাতা মোট অনাদায়ী
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">
          {t.quickActions}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl transition text-left font-semibold text-xs border border-blue-200/50"
          >
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <div>
              <div className="leading-tight">{t.newSale}</div>
              <span className="text-[10px] text-blue-500/80 font-normal">ক্যাশ ও বাকি বিক্রয়</span>
            </div>
          </button>

          <button
            onClick={onOpenAddProductModal}
            className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl transition text-left font-semibold text-xs border border-indigo-200/50"
          >
            <PackagePlus className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="leading-tight">{t.addProduct}</div>
              <span className="text-[10px] text-indigo-500/80 font-normal">নতুন পণ্য ও স্টক</span>
            </div>
          </button>

          <button
            onClick={onOpenAddExpenseModal}
            className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-xl transition text-left font-semibold text-xs border border-amber-200/50"
          >
            <Receipt className="w-5 h-5 text-amber-600" />
            <div>
              <div className="leading-tight">{t.addExpense}</div>
              <span className="text-[10px] text-amber-500/80 font-normal">দৈনিক ভাউচার এন্ট্রি</span>
            </div>
          </button>

          <button
            onClick={() => onNavigate('customers')}
            className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded-xl transition text-left font-semibold text-xs border border-purple-200/50"
          >
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <div className="leading-tight">{t.customers}</div>
              <span className="text-[10px] text-purple-500/80 font-normal">বাকির খাতা ও আদায়</span>
            </div>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{t.lowStockAlert} ({lowStockProducts.length} টি পণ্যের স্টক শেষ হওয়ার পথে)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowToast(true);
                  setIsDismissed(false);
                  playAlertChime();
                  triggerHaptic();
                  triggerPushNotification(lowStockProducts);
                }}
                className="text-xs text-amber-700 hover:text-amber-900 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 transition"
                title="এলার্ট নোটিফিকেশন দেখুন"
              >
                <BellRing className="w-3 h-3 text-amber-600" />
                <span>এলার্ট দেখুন</span>
              </button>
              <button
                onClick={() => onNavigate('products')}
                className="text-xs text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1"
              >
                <span>{t.products}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {lowStockProducts.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-amber-200 dark:border-slate-700 flex items-center justify-between text-xs"
              >
                <div className="truncate pr-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                    {settings.language === 'bn' ? p.nameBn : p.name}
                  </span>
                  <span className="text-[10px] text-slate-400">{p.sku}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold text-[11px]">
                    স্টক: {p.stockQuantity} {p.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Valuation & Summary Banner */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Boxes className="w-4 h-4 text-blue-600" />
          <span className="font-medium">{t.inventoryValuation}:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {formatCurrency(metrics.totalInventoryValuation, sym)}
          </span>
          <span className="text-slate-400">({metrics.totalProductsCount} টি পণ্য)</span>
        </div>
        <button
          onClick={() => onNavigate('reports')}
          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
        >
          <span>{t.reports}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Recent Sales Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {t.recentSales}
          </h3>
          <button
            onClick={() => onNavigate('pos')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            <span>নতুন বিক্রয়</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentSales.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            {t.noRecentSales}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {recentSales.slice(0, 5).map((sale) => (
              <div
                key={sale.id}
                className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-750 px-2 rounded-lg transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {sale.invoiceNumber}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        sale.status === 'REFUNDED'
                          ? 'bg-rose-100 text-rose-700'
                          : sale.balanceDue > 0
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {sale.status === 'REFUNDED'
                        ? 'ফেরত/বাতিল'
                        : sale.balanceDue > 0
                        ? `বাকি: ${formatCurrency(sale.balanceDue, sym)}`
                        : 'পরিশোধিত'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{sale.customerName || t.walkInCustomer}</span>
                    <span>•</span>
                    <span>{formatDate(sale.createdAt, settings.language === 'bn' ? 'bn-BD' : 'en-US')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(sale.grandTotal, sym)}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-medium">
                      লাভ: {formatCurrency(sale.grossProfit, sym)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelectSaleForReceipt(sale)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title={t.viewReceipt}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {sale.status !== 'REFUNDED' && (
                      <button
                        onClick={() => onRefundSale(sale)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title={t.returnOrRefund}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
