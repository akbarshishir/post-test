import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Info,
  DollarSign,
  TrendingUp,
  Receipt,
  Scale,
  CreditCard,
  Building,
} from 'lucide-react';
import { BusinessSettings, Customer, Expense, Product, Sale, Supplier } from '../types/pos';
import { translations } from '../i18n/translations';
import { formatCurrency, formatDate } from '../services/pdfReceipt';

interface ReportsScreenProps {
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  settings: BusinessSettings;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  sales,
  expenses,
  products,
  customers,
  suppliers,
  settings,
}) => {
  const t = translations[settings.language];
  const sym = settings.currencySymbol;

  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

  // Filter by date range
  const filteredData = useMemo(() => {
    const now = new Date();
    let startTime = 0;

    if (period === 'today') {
      startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    } else if (period === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day;
      startTime = new Date(now.getFullYear(), now.getMonth(), diff).getTime();
    } else if (period === 'month') {
      startTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    }

    const validSales = sales.filter((s) => s.createdAt >= startTime);
    const completedSales = validSales.filter((s) => s.status === 'COMPLETED');
    const refundedSales = validSales.filter((s) => s.status === 'REFUNDED');
    const validExpenses = expenses.filter((e) => e.date >= startTime);

    // Financial Metrics
    const grossSalesRevenue = completedSales.reduce((sum, s) => sum + s.subtotal, 0);
    const totalDiscounts = completedSales.reduce((sum, s) => sum + s.discountTotal, 0);
    const netSalesRevenue = grossSalesRevenue - totalDiscounts; // or grandTotal
    const costOfGoodsSold = completedSales.reduce((sum, s) => sum + s.totalCostOfGoods, 0);
    const grossProfit = netSalesRevenue - costOfGoodsSold;

    const totalExpenses = validExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netOperatingResult = grossProfit - totalExpenses;

    // Cash and Credit Audit
    const totalPaidCash = completedSales.reduce((sum, s) => sum + s.paidAmount, 0);
    const uncollectedCreditSales = completedSales.reduce((sum, s) => sum + s.balanceDue, 0);

    return {
      completedSales,
      refundedSales,
      validExpenses,
      grossSalesRevenue,
      totalDiscounts,
      netSalesRevenue,
      costOfGoodsSold,
      grossProfit,
      totalExpenses,
      netOperatingResult,
      totalPaidCash,
      uncollectedCreditSales,
    };
  }, [sales, expenses, period]);

  const totalInventoryValuation = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stockQuantity * p.purchasePrice, 0);
  }, [products]);

  const totalCustomerDues = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.totalBalanceDue || 0), 0);
  }, [customers]);

  const totalSupplierDues = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.totalPayableDue || 0), 0);
  }, [suppliers]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Type',
      'Identifier',
      'Date',
      'Customer/Party',
      'Gross Amount',
      'Discount/COGS',
      'Net Total',
      'Status',
    ];

    const rows = [
      ...filteredData.completedSales.map((s) => [
        'SALE',
        s.invoiceNumber,
        formatDate(s.createdAt, 'en-US'),
        s.customerName || 'Walk-in',
        s.subtotal,
        s.discountTotal,
        s.grandTotal,
        s.status,
      ]),
      ...filteredData.validExpenses.map((e) => [
        'EXPENSE',
        e.id,
        formatDate(e.date, 'en-US'),
        e.category,
        e.amount,
        0,
        e.amount,
        'PAID',
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `POS_Financial_Report_${period}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>{t.reportsTitle}</span>
          </h2>
          <p className="text-xs text-slate-500">
            বিক্রয় আয়, পণ্যের ক্রয়মূল্য (COGS), মোট লাভ এবং পরিচালন ব্যয়ের অডিট স্টেটমেন্ট
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shadow transition self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>{t.exportCsv}</span>
        </button>
      </div>

      {/* Period Selector Tabs */}
      <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold max-w-sm">
        {(['today', 'week', 'month', 'all'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-1.5 rounded-lg transition text-center ${
              period === p
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            {p === 'today'
              ? t.today
              : p === 'week'
              ? t.thisWeek
              : p === 'month'
              ? t.thisMonth
              : t.allTime}
          </button>
        ))}
      </div>

      {/* Financial Accounting Rules Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs flex items-start gap-2 text-blue-900 dark:text-blue-200">
        <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">অডিট ও হিসাববিজ্ঞান নীতিমালা:</span>
          <span>
            {t.profitExplanation} অনাদায়ী বাকি বিক্রয়কে কখনো নগদ হিসেবে গণ্য করা হয় না।
          </span>
        </div>
      </div>

      {/* Core Profit & Loss Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Net Sales */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{t.netSalesRevenue}</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(filteredData.netSalesRevenue, sym)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
              <span>মোট রাজস্ব: {formatCurrency(filteredData.grossSalesRevenue, sym)}</span>
              <span>ছাড়: -{formatCurrency(filteredData.totalDiscounts, sym)}</span>
            </div>
          </div>
        </div>

        {/* Cost of Goods Sold & Gross Profit */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{t.grossProfit}</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(filteredData.grossProfit, sym)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              পণ্য ক্রয় খরচ (COGS): {formatCurrency(filteredData.costOfGoodsSold, sym)}
            </div>
          </div>
        </div>

        {/* Net Operating Profit */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{t.netOperatingResult}</span>
            <Scale className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2">
            <div
              className={`text-2xl font-bold ${
                filteredData.netOperatingResult >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatCurrency(filteredData.netOperatingResult, sym)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              গ্রস প্রফিট - পরিচালন খরচ ({formatCurrency(filteredData.totalExpenses, sym)})
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Audit & Liquidity Breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
          নগদ প্রবাহ ও বাকির বিশ্লেষণ (Cash vs Credit Audit)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200">
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold block">
              {t.cashCollectedTitle}
            </span>
            <span className="text-lg font-bold text-emerald-800 dark:text-emerald-200 block mt-1">
              {formatCurrency(filteredData.totalPaidCash, sym)}
            </span>
            <span className="text-[10px] text-emerald-600">বিক্রয় থেকে তাৎক্ষণিক নগদ প্রাপ্তি</span>
          </div>

          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200">
            <span className="text-rose-700 dark:text-rose-300 font-semibold block">
              {t.unpaidCreditSalesTitle}
            </span>
            <span className="text-lg font-bold text-rose-800 dark:text-rose-200 block mt-1">
              {formatCurrency(filteredData.uncollectedCreditSales, sym)}
            </span>
            <span className="text-[10px] text-rose-600">এই সময়ের বাকিতে দেওয়া বিক্রয়</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200">
            <span className="text-slate-600 dark:text-slate-300 font-semibold block">
              গ্রাহকের কাছে মোট বকেয়া
            </span>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 block mt-1">
              {formatCurrency(totalCustomerDues, sym)}
            </span>
            <span className="text-[10px] text-slate-500">সর্বমোট অনাদায়ী গ্রাহক বাকি</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200">
            <span className="text-slate-600 dark:text-slate-300 font-semibold block">
              বর্তমান মজুদ পণ্যের মূল্য
            </span>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 block mt-1">
              {formatCurrency(totalInventoryValuation, sym)}
            </span>
            <span className="text-[10px] text-slate-500">ক্রয়মূল্য অনুযায়ী গোডাউন স্টক</span>
          </div>
        </div>
      </div>
    </div>
  );
};
