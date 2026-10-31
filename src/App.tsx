/**
 * Offline POS Manager - Main Application Entry
 * Full-featured offline-first POS supporting Bengali (বাংলা) & English,
 * BDT (৳) currency, Day/Night (Light/Dark) themes, multi-user role management
 * (Admin, Manager, Salesman, Accountant), Room/SQLite database model,
 * inventory, credit ledger, thermal printing, and financial auditing.
 */

import React, { useState, useEffect } from 'react';
import { posDb } from './services/db';
import {
  AppUser,
  BusinessSettings,
  Category,
  Customer,
  CustomerLedgerEntry,
  DashboardMetrics,
  Expense,
  Product,
  Purchase,
  Sale,
  StockAdjustment,
  Supplier,
} from './types/pos';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { DashboardScreen } from './components/DashboardScreen';
import { PosScreen } from './components/PosScreen';
import { ProductsScreen } from './components/ProductsScreen';
import { CustomersScreen } from './components/CustomersScreen';
import { ExpensesScreen } from './components/ExpensesScreen';
import { PurchasesScreen } from './components/PurchasesScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { UserManagementScreen } from './components/UserManagementScreen';
import { SwitchUserModal } from './components/SwitchUserModal';
import { ReceiptModal } from './components/ReceiptModal';
import { AndroidCodeViewerModal } from './components/AndroidCodeViewerModal';
import { translations } from './i18n/translations';
import { PromptModal, ToastContainer, ToastItem } from './components/FeedbackModal';
import {
  BarChart3,
  Receipt,
  Truck,
  Settings as SettingsIcon,
  Users,
  ShieldAlert,
  KeyRound,
} from 'lucide-react';

export default function App() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [moreSubTab, setMoreSubTab] = useState<'reports' | 'expenses' | 'purchases' | 'users' | 'settings'>('reports');
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'tablet' | 'full'>('full');
  const [isAndroidCodeOpen, setIsAndroidCodeOpen] = useState(false);
  const [isSwitchUserOpen, setIsSwitchUserOpen] = useState(false);
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);
  const [refundSaleTarget, setRefundSaleTarget] = useState<Sale | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Database States
  const [settings, setSettings] = useState<BusinessSettings>(() => posDb.getSettings());
  const [users, setUsers] = useState<AppUser[]>(() => posDb.getUsers());
  const [activeUser, setActiveUser] = useState<AppUser>(() => posDb.getActiveUser());
  const [categories, setCategories] = useState<Category[]>(() => posDb.getCategories());
  const [products, setProducts] = useState<Product[]>(() => posDb.getProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => posDb.getCustomers());
  const [ledger, setLedger] = useState<CustomerLedgerEntry[]>(() => posDb.getLedger());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => posDb.getSuppliers());
  const [sales, setSales] = useState<Sale[]>(() => posDb.getSales());
  const [purchases, setPurchases] = useState<Purchase[]>(() => posDb.getPurchases());
  const [expenses, setExpenses] = useState<Expense[]>(() => posDb.getExpenses());
  const [stockMovements, setStockMovements] = useState<StockAdjustment[]>(() => posDb.getStockMovements());
  const [metrics, setMetrics] = useState<DashboardMetrics>(() => posDb.getDashboardMetrics());

  // Sync state helper
  const reloadData = () => {
    const s = posDb.getSettings();
    setSettings(s);
    setUsers(posDb.getUsers());
    setActiveUser(posDb.getActiveUser());
    setCategories(posDb.getCategories());
    setProducts(posDb.getProducts());
    setCustomers(posDb.getCustomers());
    setLedger(posDb.getLedger());
    setSuppliers(posDb.getSuppliers());
    setSales(posDb.getSales());
    setPurchases(posDb.getPurchases());
    setExpenses(posDb.getExpenses());
    setStockMovements(posDb.getStockMovements());
    setMetrics(posDb.getDashboardMetrics());
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Sync Day / Night Theme to document classList
  useEffect(() => {
    if (settings.themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.themeMode]);

  // Toggle Day / Night Theme
  const handleToggleTheme = () => {
    const nextTheme: 'light' | 'dark' = settings.themeMode === 'dark' ? 'light' : 'dark';
    const updated: BusinessSettings = { ...settings, themeMode: nextTheme };
    posDb.saveSettings(updated);
    setSettings(updated);
  };

  // Language Toggle
  const handleLanguageToggle = () => {
    const nextLang: 'bn' | 'en' = settings.language === 'bn' ? 'en' : 'bn';
    const updated: BusinessSettings = { ...settings, language: nextLang };
    posDb.saveSettings(updated);
    setSettings(updated);
  };

  // User Management Handlers
  const handleSwitchUser = (userId: string) => {
    posDb.setActiveUser(userId);
    reloadData();
  };

  const handleSaveUser = (user: AppUser) => {
    const res = posDb.saveUser(user);
    if (res.success) reloadData();
    return res;
  };

  const handleDeleteUser = (userId: string) => {
    const res = posDb.deleteUser(userId);
    if (res.success) reloadData();
    return res;
  };

  // Transaction Handlers
  const handleCompleteSale = (saleData: any) => {
    const res = posDb.executeSaleTransaction(saleData);
    if (res.success) {
      reloadData();
    }
    return res;
  };

  const handleRefundSale = (sale: Sale) => {
    if (activeUser.role === 'SALESMAN') {
      showToast('error', 'বিক্রয় চালান বাতিল বা রিফান্ড করার জন্য ম্যানেজার বা এডমিন অনুমতি প্রয়োজন!');
      return;
    }
    setRefundSaleTarget(sale);
  };

  const handleConfirmRefund = (reason: string) => {
    if (!refundSaleTarget) return;
    const finalReason = reason.trim() || 'পণ্য পরিবর্তন বা ভুল চালান';
    const res = posDb.refundSaleTransaction(refundSaleTarget.id, finalReason);
    if (res.success) {
      showToast('success', 'চালানটি সফলভাবে ফেরত নেওয়া হয়েছে এবং পণ্য স্টকে যুক্ত হয়েছে।');
      reloadData();
    } else {
      showToast('error', res.error || 'চালান ফেরত নিতে সমস্যা হয়েছে');
    }
    setRefundSaleTarget(null);
  };

  const handleSaveProduct = (product: Product) => {
    if (activeUser.role === 'SALESMAN') {
      return { success: false, error: 'সেলসম্যান রোলে পণ্য বা মূল্য পরিবর্তনের অনুমতি নেই।' };
    }
    const res = posDb.saveProduct(product);
    if (res.success) reloadData();
    return res;
  };

  const handleDeleteProduct = (id: string) => {
    if (activeUser.role !== 'ADMIN' && activeUser.role !== 'MANAGER') {
      return { success: false, error: 'পণ্য মুছে ফেলার জন্য এডমিন বা ম্যানেজার রোল আবশ্যক।' };
    }
    const res = posDb.deleteProduct(id);
    if (res.success) reloadData();
    return res;
  };

  const handleSaveCustomer = (customer: Customer) => {
    posDb.saveCustomer(customer);
    reloadData();
  };

  const handleRecordPayment = (data: { customerId: string; amount: number; note: string }) => {
    posDb.recordCustomerLedgerEntry({
      customerId: data.customerId,
      type: 'PAYMENT_RECEIVED',
      amount: data.amount,
      note: data.note,
    });
    reloadData();
  };

  const handleRecordExpense = (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    posDb.recordExpense(expense);
    reloadData();
  };

  const handleSaveSupplier = (supplier: Supplier) => {
    posDb.saveSupplier(supplier);
    reloadData();
  };

  const handleExecutePurchase = (purchaseData: any) => {
    const res = posDb.executePurchaseTransaction(purchaseData);
    if (res.success) reloadData();
    return res;
  };

  const handleSaveSettings = (newSettings: BusinessSettings) => {
    if (activeUser.role !== 'ADMIN') {
      showToast('error', 'দোকানের সেটিংস পরিবর্তন করার জন্য এডমিন রোল প্রয়োজন!');
      return;
    }
    posDb.saveSettings(newSettings);
    setSettings(newSettings);
    reloadData();
    showToast('success', 'দোকানের সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
  };

  const handleExportBackup = () => {
    const jsonStr = posDb.exportFullBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Offline_POS_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'ডাটাবেজ ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!');
  };

  const handleImportBackup = (jsonContent: string) => {
    if (activeUser.role !== 'ADMIN') {
      showToast('error', 'ডাটাবেজ রিস্টোর করার জন্য এডমিন অনুমতি প্রয়োজন!');
      return { success: false, error: 'ডাটাবেজ রিস্টোর করার জন্য এডমিন অনুমতি প্রয়োজন!' };
    }
    const res = posDb.importBackupJson(jsonContent);
    if (res.success) {
      reloadData();
      showToast('success', 'ডাটাবেজ রিস্টোর সফল হয়েছে!');
    } else {
      showToast('error', res.error || 'রিস্টোর ব্যর্থ হয়েছে');
    }
    return res;
  };

  const handleResetDemoData = () => {
    if (activeUser.role !== 'ADMIN') {
      showToast('error', 'ডেমো ডাটা রিসেট করার জন্য এডমিন রোল আবশ্যক!');
      return;
    }
    posDb.resetToDemoData();
    reloadData();
    showToast('info', 'প্রাথমিক ডেমো ডাটা রিসেট সম্পন্ন হয়েছে।');
  };

  const t = translations[settings?.language || 'bn'] || translations.bn;
  const lowStockProducts = products.filter((p) => p.stockQuantity <= p.lowStockThreshold);

  // Device frame styles
  const getContainerStyle = () => {
    if (deviceMode === 'mobile') {
      return 'max-w-[420px] mx-auto my-4 rounded-[36px] border-[8px] border-slate-800 shadow-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 min-h-[780px] relative';
    }
    if (deviceMode === 'tablet') {
      return 'max-w-4xl mx-auto my-4 rounded-[28px] border-[10px] border-slate-800 shadow-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 min-h-[750px] relative';
    }
    return 'max-w-6xl mx-auto min-h-screen';
  };

  // Permission helper
  const canAccessReports = activeUser.role === 'ADMIN' || activeUser.role === 'MANAGER' || activeUser.role === 'ACCOUNTANT';
  const canAccessSettings = activeUser.role === 'ADMIN';
  const canAccessUsers = activeUser.role === 'ADMIN' || activeUser.role === 'MANAGER';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white transition-colors duration-200">
      {/* Top Navbar with Day/Night Switch and Active User */}
      <Navbar
        settings={settings}
        activeUser={activeUser}
        onLanguageToggle={handleLanguageToggle}
        onToggleTheme={handleToggleTheme}
        onOpenSwitchUser={() => setIsSwitchUserOpen(true)}
        onOpenAndroidCode={() => setIsAndroidCodeOpen(true)}
        deviceMode={deviceMode}
        onDeviceModeChange={setDeviceMode}
      />

      {/* Main Content Area */}
      <div className={getContainerStyle()}>
        <main className="p-3 sm:p-5">
          {activeTab === 'dashboard' && (
            <DashboardScreen
              metrics={metrics}
              recentSales={sales}
              lowStockProducts={lowStockProducts}
              settings={settings}
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectSaleForReceipt={(sale) => setSelectedReceiptSale(sale)}
              onRefundSale={handleRefundSale}
              onOpenAddProductModal={() => {
                setActiveTab('products');
              }}
              onOpenAddExpenseModal={() => {
                setActiveTab('more');
                setMoreSubTab('expenses');
              }}
            />
          )}

          {activeTab === 'pos' && (
            <PosScreen
              products={products}
              categories={categories}
              customers={customers}
              settings={settings}
              onCompleteSale={handleCompleteSale}
              onShowReceipt={(sale) => setSelectedReceiptSale(sale)}
              onOpenCustomerModal={() => setActiveTab('customers')}
            />
          )}

          {activeTab === 'products' && (
            <ProductsScreen
              products={products}
              categories={categories}
              stockMovements={stockMovements}
              settings={settings}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersScreen
              customers={customers}
              ledger={ledger}
              settings={settings}
              onSaveCustomer={handleSaveCustomer}
              onRecordPayment={handleRecordPayment}
            />
          )}

          {activeTab === 'more' && (
            <div className="space-y-4">
              {/* More Sub-navigation Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setMoreSubTab('reports')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
                    moreSubTab === 'reports'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>{t.reports}</span>
                </button>

                <button
                  onClick={() => setMoreSubTab('expenses')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
                    moreSubTab === 'expenses'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>{t.expenses}</span>
                </button>

                <button
                  onClick={() => setMoreSubTab('purchases')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
                    moreSubTab === 'purchases'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>{t.purchases}</span>
                </button>

                <button
                  onClick={() => setMoreSubTab('users')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
                    moreSubTab === 'users'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>{t.users}</span>
                </button>

                <button
                  onClick={() => setMoreSubTab('settings')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
                    moreSubTab === 'settings'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span>{t.settings}</span>
                </button>
              </div>

              {/* Sub-tab view with RBAC Permission guard */}
              {moreSubTab === 'reports' && (
                canAccessReports ? (
                  <ReportsScreen
                    sales={sales}
                    expenses={expenses}
                    products={products}
                    customers={customers}
                    suppliers={suppliers}
                    settings={settings}
                  />
                ) : (
                  <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                    <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      প্রবেশাধিকার সংরক্ষিত
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {t.permissionDenied} সেলসম্যান অ্যাকাউন্টে দোকানের লাভ-ক্ষতি ও অডিট রিপোর্ট লক রয়েছে।
                    </p>
                    <button
                      onClick={() => setIsSwitchUserOpen(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow inline-flex items-center gap-1.5"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>ম্যানেজার বা এডমিন পিনে সুইচ করুন</span>
                    </button>
                  </div>
                )
              )}

              {moreSubTab === 'expenses' && (
                <ExpensesScreen
                  expenses={expenses}
                  settings={settings}
                  onRecordExpense={handleRecordExpense}
                />
              )}

              {moreSubTab === 'purchases' && (
                <PurchasesScreen
                  suppliers={suppliers}
                  purchases={purchases}
                  products={products}
                  settings={settings}
                  onSaveSupplier={handleSaveSupplier}
                  onExecutePurchase={handleExecutePurchase}
                />
              )}

              {moreSubTab === 'users' && (
                <UserManagementScreen
                  users={users}
                  activeUser={activeUser}
                  language={settings.language}
                  onSaveUser={handleSaveUser}
                  onDeleteUser={handleDeleteUser}
                  onSwitchUser={handleSwitchUser}
                />
              )}

              {moreSubTab === 'settings' && (
                canAccessSettings ? (
                  <SettingsScreen
                    settings={settings}
                    onSaveSettings={handleSaveSettings}
                    onExportBackup={handleExportBackup}
                    onImportBackup={handleImportBackup}
                    onResetDemoData={handleResetDemoData}
                    onBumpVersion={() => {
                      posDb.bumpVersion('manual');
                      reloadData();
                    }}
                  />
                ) : (
                  <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                    <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      এডমিন পারমিশন আবশ্যক
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      দোকানের নাম, ডাটাবেজ ব্যাকআপ ও রিসেট সেটিংসের জন্য শুধুমাত্র এডমিন পিনের অনুমতি রয়েছে।
                    </p>
                    <button
                      onClick={() => setIsSwitchUserOpen(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow inline-flex items-center gap-1.5"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>এডমিন পিনে সুইচ করুন</span>
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </main>

        {/* Bottom Material 3 Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          language={settings.language}
          cartCount={0}
        />
      </div>

      {/* Switch User Modal */}
      {isSwitchUserOpen && (
        <SwitchUserModal
          users={users}
          activeUser={activeUser}
          language={settings.language}
          onSwitchUser={handleSwitchUser}
          onClose={() => setIsSwitchUserOpen(false)}
        />
      )}

      {/* Printable Receipt Modal */}
      {selectedReceiptSale && (
        <ReceiptModal
          sale={selectedReceiptSale}
          settings={settings}
          onClose={() => setSelectedReceiptSale(null)}
        />
      )}

      {/* Android Studio Code & Project Explorer Modal */}
      {isAndroidCodeOpen && (
        <AndroidCodeViewerModal onClose={() => setIsAndroidCodeOpen(false)} />
      )}

      {/* In-App Interactive Prompt Modal for Sale Refund / Cancellation */}
      <PromptModal
        isOpen={Boolean(refundSaleTarget)}
        title="চালান বাতিল ও ফেরত কারণ"
        message={`চালান নং: ${refundSaleTarget?.invoiceNumber} - মূল্য: ${settings.currencySymbol}${refundSaleTarget?.grandTotal}। ফেরত নেওয়ার কারণ লিখুন:`}
        inputLabel="ফেরতের কারণ"
        placeholder="যেমন: মেয়াদোত্তীর্ণ, পণ্য পরিবর্তন বা ভুল চালান"
        defaultValue="পণ্য পরিবর্তন বা ভুল চালান"
        confirmText="ফেরত সম্পন্ন করুন"
        cancelText="বাতিল"
        onConfirm={handleConfirmRefund}
        onCancel={() => setRefundSaleTarget(null)}
      />

      {/* Floating Modern Toast Stack */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}
