/**
 * Offline-first Database & Repository Service
 * Emulates the Android Room Database with SQLite transactions,
 * relational constraints, audit trails, and persistent LocalStorage.
 */

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
  UserRole,
} from '../types/pos';

const STORAGE_KEY_PREFIX = 'pos_offline_mgr_';

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-1',
    name: 'আকবর হোসেন (মালিক)',
    phone: '01712-345678',
    role: 'ADMIN',
    pin: '1111',
    active: true,
    createdAt: Date.now() - 60 * 86400000,
  },
  {
    id: 'usr-2',
    name: 'রফিকুল ইসলাম',
    phone: '01819-876543',
    role: 'MANAGER',
    pin: '2222',
    active: true,
    createdAt: Date.now() - 40 * 86400000,
  },
  {
    id: 'usr-3',
    name: 'মোঃ তানভীর (কাউন্টার ১)',
    phone: '01912-334455',
    role: 'SALESMAN',
    pin: '3333',
    active: true,
    createdAt: Date.now() - 20 * 86400000,
  },
  {
    id: 'usr-4',
    name: 'কামরুল হাসান (হিসাবরক্ষক)',
    phone: '01611-223344',
    role: 'ACCOUNTANT',
    pin: '4444',
    active: true,
    createdAt: Date.now() - 15 * 86400000,
  },
];

export const INITIAL_SETTINGS: BusinessSettings = {
  id: 1,
  businessName: 'কাগজ বক্স (Kagoj Box)',
  businessNameBn: 'কাগজ বক্স',
  ownerName: 'মোহাম্মদ আকবর হোসেন',
  phone: '01712-345678',
  email: 'kagojbox@gmail.com',
  address: 'দোকান নং ১২, চকবাজার, ঢাকা - ১২১১',
  slogan: 'বিশ্বস্ত কোয়ালিটি পেপার ও কার্টুন বক্সের বিশ্বস্ত ঠিকানা',
  currencySymbol: '৳',
  currencyCode: 'BDT',
  language: 'bn',
  themeMode: 'light',
  activeUserId: 'usr-1',
  invoicePrefix: 'KB',
  defaultLowStockThreshold: 5,
  allowNegativeStock: false,
  enableVatTax: false,
  vatRatePercent: 0,
  receiptFooterMessage: 'কাগজ বক্সে কেনাকাটা করার জন্য ধন্যবাদ! আবার আসবেন।',
  pinLockEnabled: false,
  appPin: '1234',
  appVersion: 'v1.2.1',
  revisionCount: 1,
  lastEditedAt: Date.now(),
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-0', name: 'Packaging & Paper Box', nameBn: 'কাগজ ও প্যাকেজিং বক্স', colorHex: '#2563EB' },
  { id: 'cat-1', name: 'Grocery & Staples', nameBn: 'মুদি ও চাল-ডাল', colorHex: '#0891B2' },
  { id: 'cat-2', name: 'Oils & Spices', nameBn: 'ভোজ্য তেল ও মসলা', colorHex: '#EA580C' },
  { id: 'cat-3', name: 'Beverages & Tea', nameBn: 'চা ও পানীয়', colorHex: '#16A34A' },
  { id: 'cat-4', name: 'Snacks & Biscuits', nameBn: 'বিস্কুট ও স্ন্যাক্স', colorHex: '#9333EA' },
  { id: 'cat-5', name: 'Dairy & Eggs', nameBn: 'দুগ্ধজাত ও ডিম', colorHex: '#0284C7' },
  { id: 'cat-6', name: 'Toiletries & Soap', nameBn: 'সাবান ও প্রসাধন', colorHex: '#D97706' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-box-1',
    name: '3-Ply Corrugated Carton Box (12x10x8 inch)',
    nameBn: '৩ প্লাই করুগেটেড কার্টুন বক্স (১২x১০x৮ ইঞ্চি)',
    sku: 'BOX-3PLY-01',
    barcode: '89420001001',
    categoryId: 'cat-0',
    purchasePrice: 26,
    sellingPrice: 35,
    stockQuantity: 150,
    lowStockThreshold: 20,
    unit: 'পিস (Pcs)',
    createdAt: Date.now() - 35 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'prod-box-2',
    name: 'Food Grade Paper Takeaway Box',
    nameBn: 'ফুড গ্রেড পেপার টেক-অ্যাওয়ে বক্স',
    sku: 'BOX-FOOD-02',
    barcode: '89420001002',
    categoryId: 'cat-0',
    purchasePrice: 8.5,
    sellingPrice: 12,
    stockQuantity: 250,
    lowStockThreshold: 30,
    unit: 'পিস (Pcs)',
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'prod-box-3',
    name: 'Sweetmeat 1kg Premium Paper Box',
    nameBn: 'মিষ্টির ১ কেজি প্রিমিয়াম পেপার বক্স',
    sku: 'BOX-SWEET-1KG',
    barcode: '89420001003',
    categoryId: 'cat-0',
    purchasePrice: 13,
    sellingPrice: 18,
    stockQuantity: 180,
    lowStockThreshold: 25,
    unit: 'পিস (Pcs)',
    createdAt: Date.now() - 25 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'prod-box-4',
    name: 'Eco-friendly Kraft Paper Bag (Large)',
    nameBn: 'ইকো ফ্রেন্ডলি ক্রাফট পেপার ব্যাগ (বড়)',
    sku: 'BAG-KRAFT-LG',
    barcode: '89420001004',
    categoryId: 'cat-0',
    purchasePrice: 10,
    sellingPrice: 15,
    stockQuantity: 4, // Low stock demo!
    lowStockThreshold: 15,
    unit: 'পিস (Pcs)',
    createdAt: Date.now() - 20 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'prod-1',
    name: 'Miniket Rice (50kg Bag)',
    nameBn: 'মিনিকেট চাল (৫০ কেজি বস্তা)',
    sku: 'RICE-MIN-50',
    barcode: '89411001001',
    categoryId: 'cat-1',
    purchasePrice: 3100,
    sellingPrice: 3450,
    stockQuantity: 18,
    lowStockThreshold: 5,
    unit: 'বস্তা (Bag)',
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'prod-2',
    name: 'Rupchanda Soyabean Oil 5L',
    nameBn: 'রূপচাঁদা সয়াবিন তেল ৫ লিটার',
    sku: 'OIL-RUP-5L',
    barcode: '89411001002',
    categoryId: 'cat-2',
    purchasePrice: 790,
    sellingPrice: 850,
    stockQuantity: 12,
    lowStockThreshold: 4,
    unit: 'বোতল (Bottle)',
    createdAt: Date.now() - 25 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'prod-3',
    name: 'Teer White Sugar 1kg',
    nameBn: 'তীর সাদা চিনি ১ কেজি',
    sku: 'SUG-TEER-1',
    barcode: '89411001003',
    categoryId: 'cat-1',
    purchasePrice: 128,
    sellingPrice: 140,
    stockQuantity: 3, // Low stock demo!
    lowStockThreshold: 8,
    unit: 'কেজি (Kg)',
    createdAt: Date.now() - 20 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'prod-4',
    name: 'Ispahani Mirzapore Tea 400g',
    nameBn: 'ইস্পাহানি মির্জাপুর চা ৪০০ গ্রাম',
    sku: 'TEA-ISP-400',
    barcode: '89411001004',
    categoryId: 'cat-3',
    purchasePrice: 215,
    sellingPrice: 245,
    stockQuantity: 24,
    lowStockThreshold: 6,
    unit: 'প্যাকেট (Pkt)',
    createdAt: Date.now() - 15 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'prod-5',
    name: 'Radhuni Turmeric Powder 200g',
    nameBn: 'রাঁধুনী হলুদ গুঁড়া ২০০ গ্রাম',
    sku: 'SPICE-TUR-200',
    barcode: '89411001005',
    categoryId: 'cat-2',
    purchasePrice: 78,
    sellingPrice: 95,
    stockQuantity: 2, // Low stock demo!
    lowStockThreshold: 5,
    unit: 'প্যাকেট (Pkt)',
    createdAt: Date.now() - 10 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'prod-6',
    name: 'Pran Frooto Mango 250ml',
    nameBn: 'প্রাণ ফ্রুটো ম্যাংগো ২৫০ মি.লি.',
    sku: 'BEV-PRAN-250',
    barcode: '89411001006',
    categoryId: 'cat-3',
    purchasePrice: 28,
    sellingPrice: 35,
    stockQuantity: 48,
    lowStockThreshold: 12,
    unit: 'বোতল (Bottle)',
    createdAt: Date.now() - 8 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'prod-7',
    name: 'Olympic Energy Plus Biscuit',
    nameBn: 'অলিম্পিক এনার্জি প্লাস বিস্কুট',
    sku: 'BIS-OLY-NRG',
    barcode: '89411001007',
    categoryId: 'cat-4',
    purchasePrice: 24,
    sellingPrice: 30,
    stockQuantity: 36,
    lowStockThreshold: 10,
    unit: 'প্যাকেট (Pkt)',
    createdAt: Date.now() - 5 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'prod-8',
    name: 'Lifebuoy Total Soap 100g',
    nameBn: 'লাইফবয় টোটাল সাবান ১০০ গ্রাম',
    sku: 'SOAP-LB-100',
    barcode: '89411001008',
    categoryId: 'cat-6',
    purchasePrice: 52,
    sellingPrice: 65,
    stockQuantity: 22,
    lowStockThreshold: 6,
    unit: 'পিস (Pcs)',
    createdAt: Date.now() - 2 * 86400000,
    updatedAt: Date.now(),
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'মোঃ রফিকুল ইসলাম',
    phone: '01819-876543',
    address: 'বাড়ি নং ৪৫, ব্লক-বি, ধানমন্ডি',
    totalBalanceDue: 1450,
    notes: 'মাসিক নিয়মিত খরিদ্দার, প্রতি মাসের ১০ তারিখে পরিশোধ করেন',
    createdAt: Date.now() - 40 * 86400000,
  },
  {
    id: 'cust-2',
    name: 'আনিসুর রহমান',
    phone: '01912-334455',
    address: 'রোড ৭, শুক্রাবাদ',
    totalBalanceDue: 620,
    notes: 'বিশ্বস্ত গ্রাহক',
    createdAt: Date.now() - 25 * 86400000,
  },
  {
    id: 'cust-3',
    name: 'ফাতেমা বেগম',
    phone: '01711-223344',
    address: 'কলাবাগান ১ম লেন',
    totalBalanceDue: 0,
    notes: 'নগদ ক্রেতা',
    createdAt: Date.now() - 15 * 86400000,
  },
];

export const INITIAL_LEDGER: CustomerLedgerEntry[] = [
  {
    id: 'ledg-1',
    customerId: 'cust-1',
    type: 'CREDIT_SALE',
    amount: 1950,
    previousBalance: 0,
    newBalance: 1950,
    referenceId: 'INV-DEMO-001',
    note: 'চালান INV-DEMO-001 এর বাকি বিক্রয়',
    createdAt: Date.now() - 7 * 86400000,
  },
  {
    id: 'ledg-2',
    customerId: 'cust-1',
    type: 'PAYMENT_RECEIVED',
    amount: 500,
    previousBalance: 1950,
    newBalance: 1450,
    referenceId: 'RCPT-001',
    note: 'নগদ বাকি পরিশোধ গ্রহণ',
    createdAt: Date.now() - 2 * 86400000,
  },
  {
    id: 'ledg-3',
    customerId: 'cust-2',
    type: 'CREDIT_SALE',
    amount: 620,
    previousBalance: 0,
    newBalance: 620,
    referenceId: 'INV-DEMO-002',
    note: 'চালান INV-DEMO-002 এর বাকি বিক্রয়',
    createdAt: Date.now() - 3 * 86400000,
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'supp-1',
    name: 'মেসার্স সিটি অটো রাইস মিল',
    companyName: 'সিটি ডিস্ট্রিবিউশন লিমিটেড',
    phone: '01713-998877',
    address: 'বাবুবাজার চালের আড়ত, ঢাকা',
    totalPayableDue: 12500,
    createdAt: Date.now() - 50 * 86400000,
  },
  {
    id: 'supp-2',
    name: 'ইউনিলিভার বাংলাদেশ এজেন্সি',
    companyName: 'মেসার্স রহমান ট্রেডার্স',
    phone: '01815-554433',
    address: 'তেজগাঁও শিল্প এলাকা, ঢাকা',
    totalPayableDue: 4500,
    createdAt: Date.now() - 40 * 86400000,
  },
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-1',
    invoiceNumber: 'INV-202610-001',
    customerId: 'cust-1',
    customerName: 'মোঃ রফিকুল ইসলাম',
    customerPhone: '01819-876543',
    subtotal: 1095,
    discountTotal: 45,
    vatTaxTotal: 0,
    grandTotal: 1050,
    paidAmount: 600,
    changeAmount: 0,
    balanceDue: 450,
    paymentMethod: 'CASH',
    totalCostOfGoods: 868,
    grossProfit: 182,
    status: 'COMPLETED',
    notes: 'নিয়মিত গ্রাহক ছাড়',
    createdAt: Date.now() - 3600000 * 4,
    items: [
      {
        id: 'sitem-1',
        saleId: 'sale-1',
        productId: 'prod-2',
        productName: 'রূপচাঁদা সয়াবিন তেল ৫ লিটার',
        sku: 'OIL-RUP-5L',
        quantity: 1,
        purchaseCost: 790,
        unitPrice: 850,
        discountAmount: 25,
        lineTotal: 825,
      },
      {
        id: 'sitem-2',
        saleId: 'sale-1',
        productId: 'prod-4',
        productName: 'ইস্পাহানি মির্জাপুর চা ৪০০ গ্রাম',
        sku: 'TEA-ISP-400',
        quantity: 1,
        purchaseCost: 215,
        unitPrice: 245,
        discountAmount: 20,
        lineTotal: 225,
      },
    ],
  },
  {
    id: 'sale-2',
    invoiceNumber: 'INV-202610-002',
    customerId: undefined,
    customerName: 'সাধারণ খদ্দের (Walk-in)',
    customerPhone: undefined,
    subtotal: 3450,
    discountTotal: 0,
    vatTaxTotal: 0,
    grandTotal: 3450,
    paidAmount: 3500,
    changeAmount: 50,
    balanceDue: 0,
    paymentMethod: 'CASH',
    totalCostOfGoods: 3100,
    grossProfit: 350,
    status: 'COMPLETED',
    createdAt: Date.now() - 3600000 * 2,
    items: [
      {
        id: 'sitem-3',
        saleId: 'sale-2',
        productId: 'prod-1',
        productName: 'মিনিকেট চাল (৫০ কেজি বস্তা)',
        sku: 'RICE-MIN-50',
        quantity: 1,
        purchaseCost: 3100,
        unitPrice: 3450,
        discountAmount: 0,
        lineTotal: 3450,
      },
    ],
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    category: 'TEA_SNACKS',
    amount: 150,
    paymentMethod: 'CASH',
    notes: 'দোকানের চা ও বিস্কুট খরচ',
    date: Date.now() - 3600000 * 5,
    createdAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'exp-2',
    category: 'TRANSPORT',
    amount: 320,
    paymentMethod: 'CASH',
    notes: 'মালামাল ভ্যান ভাড়া',
    date: Date.now() - 3600000 * 24,
    createdAt: Date.now() - 3600000 * 24,
  },
  {
    id: 'exp-3',
    category: 'ELECTRICITY_UTILITY',
    amount: 1850,
    paymentMethod: 'BKASH',
    notes: 'চলতি মাসের বিদ্যুৎ বিল পরিশোধ',
    date: Date.now() - 86400000 * 4,
    createdAt: Date.now() - 86400000 * 4,
  },
];

export const INITIAL_STOCK_MOVEMENTS: StockAdjustment[] = [
  {
    id: 'adj-1',
    productId: 'prod-1',
    type: 'INITIAL',
    quantityChange: 20,
    previousStock: 0,
    newStock: 20,
    reason: 'প্রারম্ভিক স্টক এন্ট্রি',
    createdAt: Date.now() - 30 * 86400000,
  },
  {
    id: 'adj-2',
    productId: 'prod-1',
    type: 'SALE',
    quantityChange: -1,
    previousStock: 19,
    newStock: 18,
    referenceId: 'sale-2',
    reason: 'চালান INV-202610-002 এ বিক্রয়',
    createdAt: Date.now() - 3600000 * 2,
  },
];

// Safe in-memory storage fallback when localStorage is blocked or unavailable
const memoryStore: Record<string, string> = {};

// Helper for local storage reads/writes with safe fallback
function loadData<T>(key: string, defaultValue: T): T {
  try {
    let raw: string | null = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + key);
      }
    } catch {
      raw = memoryStore[STORAGE_KEY_PREFIX + key] || null;
    }
    if (!raw) {
      raw = memoryStore[STORAGE_KEY_PREFIX + key] || null;
    }
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : defaultValue;
  } catch (e) {
    console.error(`Error loading key ${key}:`, e);
    return defaultValue;
  }
}

function saveData<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    memoryStore[STORAGE_KEY_PREFIX + key] = serialized;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_PREFIX + key, serialized);
      }
    } catch {
      // Memory store already holds the updated value
    }
  } catch (e) {
    console.error(`Error saving key ${key}:`, e);
  }
}

export class PosRepository {
  private static instance: PosRepository;

  private constructor() {
    this.ensureInitialized();
  }

  public static getInstance(): PosRepository {
    if (!PosRepository.instance) {
      PosRepository.instance = new PosRepository();
    }
    return PosRepository.instance;
  }

  private ensureInitialized() {
    try {
      const initialized = loadData<string | null>('initialized', null);
      if (!initialized) {
        this.resetToDemoData();
      }
    } catch (e) {
      console.warn('Storage init fallback:', e);
      this.resetToDemoData();
    }
  }

  public resetToDemoData(): void {
    saveData('settings', INITIAL_SETTINGS);
    saveData('categories', INITIAL_CATEGORIES);
    saveData('products', INITIAL_PRODUCTS);
    saveData('customers', INITIAL_CUSTOMERS);
    saveData('ledger', INITIAL_LEDGER);
    saveData('suppliers', INITIAL_SUPPLIERS);
    saveData('sales', INITIAL_SALES);
    saveData('users', INITIAL_USERS);
    saveData('purchases', [] as Purchase[]);
    saveData('expenses', INITIAL_EXPENSES);
    saveData('stock_movements', INITIAL_STOCK_MOVEMENTS);
    saveData('initialized', 'true');
  }

  // Settings & Version Management
  public getSettings(): BusinessSettings {
    const s = loadData<BusinessSettings>('settings', INITIAL_SETTINGS);
    const merged: BusinessSettings = {
      ...INITIAL_SETTINGS,
      ...(s || {}),
    };
    let changed = false;
    if (!merged.businessNameBn || merged.businessNameBn === 'মেসার্স ভাই ভাই জেনারেল স্টোর') {
      merged.businessNameBn = 'কাগজ বক্স';
      merged.businessName = 'কাগজ বক্স (Kagoj Box)';
      merged.invoicePrefix = 'KB';
      merged.receiptFooterMessage = 'কাগজ বক্সে কেনাকাটা করার জন্য ধন্যবাদ! আবার আসবেন।';
      changed = true;
    }
    if (!merged.themeMode) {
      merged.themeMode = 'light';
      changed = true;
    }
    if (!merged.activeUserId) {
      merged.activeUserId = 'usr-1';
      changed = true;
    }
    if (!merged.language || (merged.language !== 'bn' && merged.language !== 'en')) {
      merged.language = 'bn';
      changed = true;
    }
    if (!merged.revisionCount || isNaN(merged.revisionCount)) {
      merged.revisionCount = 1;
      merged.appVersion = 'v1.2.1';
      merged.lastEditedAt = Date.now();
      changed = true;
    }
    if (!merged.appVersion) {
      merged.appVersion = `v1.2.${merged.revisionCount}`;
      changed = true;
    }
    if (!merged.email) {
      merged.email = 'kagojbox@gmail.com';
      changed = true;
    }
    if (!merged.slogan) {
      merged.slogan = 'বিশ্বস্ত কোয়ালিটি পেপার ও কার্টুন বক্সের বিশ্বস্ত ঠিকানা';
      changed = true;
    }
    if (changed) {
      saveData('settings', merged);
    }
    return merged;
  }

  public bumpVersion(reason = 'edit'): BusinessSettings {
    const current = this.getSettings();
    const nextRevision = (current.revisionCount || 1) + 1;
    const updated: BusinessSettings = {
      ...current,
      revisionCount: nextRevision,
      appVersion: `v1.2.${nextRevision}`,
      lastEditedAt: Date.now(),
    };
    saveData('settings', updated);
    return updated;
  }

  public saveSettings(settings: BusinessSettings, autoBump = true): BusinessSettings {
    let settingsToSave = { ...settings };
    if (autoBump) {
      const nextRevision = (settings.revisionCount || 1) + 1;
      settingsToSave.revisionCount = nextRevision;
      settingsToSave.appVersion = `v1.2.${nextRevision}`;
      settingsToSave.lastEditedAt = Date.now();
    }
    saveData('settings', settingsToSave);
    return settingsToSave;
  }

  // Users & Staff
  public getUsers(): AppUser[] {
    const list = loadData<AppUser[]>('users', INITIAL_USERS);
    if (!list || list.length === 0) {
      saveData('users', INITIAL_USERS);
      return INITIAL_USERS;
    }
    return list;
  }

  public getActiveUser(): AppUser {
    const settings = this.getSettings();
    const users = this.getUsers();
    return (
      users.find((u) => u && u.id === settings.activeUserId && u.active) ||
      users.find((u) => u && u.active) ||
      users[0] ||
      INITIAL_USERS[0]
    );
  }

  public setActiveUser(userId: string): { success: boolean; error?: string } {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId && u.active);
    if (!user) return { success: false, error: 'ইউজার সক্রিয় নয় বা পাওয়া যায়নি!' };

    const settings = this.getSettings();
    settings.activeUserId = userId;
    this.saveSettings(settings);
    return { success: true };
  }

  public saveUser(user: AppUser): { success: boolean; error?: string } {
    if (!user.name.trim()) return { success: false, error: 'ইউজারের নাম আবশ্যক!' };
    if (!user.pin || user.pin.length !== 4) return { success: false, error: 'পিন কোড অবশ্যই ৪ ডিজিটের হতে হবে!' };

    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    saveData('users', users);
    this.bumpVersion('user_change');
    return { success: true };
  }

  public deleteUser(userId: string): { success: boolean; error?: string } {
    const users = this.getUsers();
    const userToDelete = users.find((u) => u.id === userId);
    if (!userToDelete) return { success: false, error: 'ইউজার পাওয়া যায়নি' };

    // Cannot delete last admin
    if (userToDelete.role === 'ADMIN') {
      const adminCount = users.filter((u) => u.role === 'ADMIN' && u.active).length;
      if (adminCount <= 1) {
        return { success: false, error: 'কমপক্ষে একজন সক্রিয় এডমিন থাকা বাধ্যতামূলক!' };
      }
    }

    const filtered = users.filter((u) => u.id !== userId);
    saveData('users', filtered);

    // If currently active user was deleted, fallback to first user
    const settings = this.getSettings();
    if (settings.activeUserId === userId) {
      settings.activeUserId = filtered[0]?.id || 'usr-1';
      this.saveSettings(settings, false);
    }
    this.bumpVersion('user_deleted');

    return { success: true };
  }

  // Categories
  public getCategories(): Category[] {
    const list = loadData<Category[]>('categories', INITIAL_CATEGORIES);
    if (!list.some((c) => c.id === 'cat-0')) {
      list.unshift(INITIAL_CATEGORIES[0]);
      saveData('categories', list);
    }
    return list;
  }

  // Products
  public getProducts(): Product[] {
    const list = loadData<Product[]>('products', INITIAL_PRODUCTS);
    if (!list.some((p) => p.id === 'prod-box-1')) {
      const boxProducts = INITIAL_PRODUCTS.filter((p) => p.id.startsWith('prod-box'));
      list.unshift(...boxProducts);
      saveData('products', list);
    }
    return list;
  }

  public getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  }

  public saveProduct(product: Product): { success: boolean; error?: string } {
    const products = this.getProducts();
    const existingIndex = products.findIndex((p) => p.id === product.id);

    // Validation
    if (!product.name.trim()) return { success: false, error: 'পণ্যের নাম আবশ্যক' };
    if (product.purchasePrice < 0 || product.sellingPrice < 0) {
      return { success: false, error: 'মূল্য ঋণাত্মক হতে পারে না' };
    }

    if (existingIndex >= 0) {
      const prev = products[existingIndex];
      const stockDiff = product.stockQuantity - prev.stockQuantity;
      if (stockDiff !== 0) {
        this.recordStockMovement({
          productId: product.id,
          type: 'MANUAL_ADJUSTMENT',
          quantityChange: stockDiff,
          previousStock: prev.stockQuantity,
          newStock: product.stockQuantity,
          reason: 'ম্যানুয়াল পণ্য সম্পাদনায় স্টক সংশোধন',
        });
      }
      products[existingIndex] = { ...product, updatedAt: Date.now() };
    } else {
      products.unshift({ ...product, createdAt: Date.now(), updatedAt: Date.now() });
      this.recordStockMovement({
        productId: product.id,
        type: 'INITIAL',
        quantityChange: product.stockQuantity,
        previousStock: 0,
        newStock: product.stockQuantity,
        reason: 'নতুন পণ্য এন্ট্রি',
      });
    }

    saveData('products', products);
    this.bumpVersion('product_change');
    return { success: true };
  }

  public deleteProduct(id: string): { success: boolean; error?: string } {
    const sales = this.getSales();
    const hasSaleHistory = sales.some((s) => s.items.some((item) => item.productId === id));
    if (hasSaleHistory) {
      return {
        success: false,
        error: 'এই পণ্যের বিক্রয় ইতিহাস রয়েছে। ডাটা অখণ্ডতা বজায় রাখতে এটি মুছে ফেলা সম্ভব নয়।',
      };
    }

    const products = this.getProducts().filter((p) => p.id !== id);
    saveData('products', products);
    this.bumpVersion('product_deleted');
    return { success: true };
  }

  // Stock Adjustments
  public getStockMovements(productId?: string): StockAdjustment[] {
    const all = loadData<StockAdjustment[]>('stock_movements', INITIAL_STOCK_MOVEMENTS);
    if (productId) {
      return all.filter((m) => m.productId === productId);
    }
    return all.sort((a, b) => b.createdAt - a.createdAt);
  }

  public recordStockMovement(movement: Omit<StockAdjustment, 'id' | 'createdAt'>): void {
    const movements = this.getStockMovements();
    const newMovement: StockAdjustment = {
      ...movement,
      id: 'adj-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      createdAt: Date.now(),
    };
    movements.unshift(newMovement);
    saveData('stock_movements', movements);
  }

  // Sales & POS Transactions (Atomic execution)
  public getSales(): Sale[] {
    return loadData<Sale[]>('sales', INITIAL_SALES).sort((a, b) => b.createdAt - a.createdAt);
  }

  public getSaleById(id: string): Sale | undefined {
    return this.getSales().find((s) => s.id === id);
  }

  public executeSaleTransaction(saleData: Omit<Sale, 'id' | 'createdAt' | 'status'>): {
    success: boolean;
    sale?: Sale;
    error?: string;
  } {
    const products = this.getProducts();
    const settings = this.getSettings();

    // 1. Verify stock availability
    if (!settings.allowNegativeStock) {
      for (const item of saleData.items) {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod || prod.stockQuantity < item.quantity) {
          return {
            success: false,
            error: `পর্যাপ্ত স্টক নেই: ${prod?.nameBn || item.productName} (বর্তমান স্টক: ${prod?.stockQuantity || 0})`,
          };
        }
      }
    }

    // 2. Reduce stock for each item atomically
    for (const item of saleData.items) {
      const pIndex = products.findIndex((p) => p.id === item.productId);
      if (pIndex >= 0) {
        const prevStock = products[pIndex].stockQuantity;
        const newStock = prevStock - item.quantity;
        products[pIndex].stockQuantity = newStock;
        products[pIndex].updatedAt = Date.now();

        this.recordStockMovement({
          productId: item.productId,
          type: 'SALE',
          quantityChange: -item.quantity,
          previousStock: prevStock,
          newStock: newStock,
          reason: `চালান ${saleData.invoiceNumber} এ বিক্রয়`,
          referenceId: saleData.invoiceNumber,
        });
      }
    }
    saveData('products', products);

    // 3. Create the completed sale record
    const newSaleId = 'sale-' + Date.now();
    const completedSale: Sale = {
      ...saleData,
      id: newSaleId,
      status: 'COMPLETED',
      createdAt: Date.now(),
    };

    const sales = this.getSales();
    sales.unshift(completedSale);
    saveData('sales', sales);

    // 4. Update customer credit ledger if there is balanceDue
    if (completedSale.customerId && completedSale.balanceDue > 0) {
      this.recordCustomerLedgerEntry({
        customerId: completedSale.customerId,
        type: 'CREDIT_SALE',
        amount: completedSale.balanceDue,
        referenceId: completedSale.invoiceNumber,
        note: `চালান ${completedSale.invoiceNumber} এর বাকি বিক্রয়`,
      });
    }

    return { success: true, sale: completedSale };
  }

  public refundSaleTransaction(saleId: string, reason: string): { success: boolean; error?: string } {
    const sales = this.getSales();
    const saleIndex = sales.findIndex((s) => s.id === saleId);
    if (saleIndex < 0) return { success: false, error: 'বিক্রয় চালানটি খুঁজে পাওয়া যায়নি' };

    const sale = sales[saleIndex];
    if (sale.status === 'REFUNDED') {
      return { success: false, error: 'এই চালানটি ইতোমধ্যেই ফেরত নেওয়া হয়েছে' };
    }

    // Revert inventory
    const products = this.getProducts();
    for (const item of sale.items) {
      const pIndex = products.findIndex((p) => p.id === item.productId);
      if (pIndex >= 0) {
        const prevStock = products[pIndex].stockQuantity;
        const newStock = prevStock + item.quantity;
        products[pIndex].stockQuantity = newStock;
        products[pIndex].updatedAt = Date.now();

        this.recordStockMovement({
          productId: item.productId,
          type: 'RETURN',
          quantityChange: item.quantity,
          previousStock: prevStock,
          newStock: newStock,
          reason: `চালান ${sale.invoiceNumber} ফেরত (${reason})`,
          referenceId: sale.invoiceNumber,
        });
      }
    }
    saveData('products', products);

    // If customer had balance due from this sale, adjust ledger
    if (sale.customerId && sale.balanceDue > 0) {
      this.recordCustomerLedgerEntry({
        customerId: sale.customerId,
        type: 'RETURN_CREDIT',
        amount: sale.balanceDue,
        referenceId: sale.invoiceNumber,
        note: `চালান ${sale.invoiceNumber} বাতিলের কারণে বাকি সমন্বয়`,
      });
    }

    // Mark sale refunded (preserves original record for financial auditing)
    sales[saleIndex].status = 'REFUNDED';
    sales[saleIndex].notes = (sales[saleIndex].notes ? sales[saleIndex].notes + ' | ' : '') + `বাতিল কারণ: ${reason}`;
    saveData('sales', sales);

    return { success: true };
  }

  // Customers & Ledger
  public getCustomers(): Customer[] {
    return loadData<Customer[]>('customers', INITIAL_CUSTOMERS);
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find((c) => c.id === id);
  }

  public saveCustomer(customer: Customer): void {
    const customers = this.getCustomers();
    const index = customers.findIndex((c) => c.id === customer.id);
    if (index >= 0) {
      customers[index] = customer;
    } else {
      customers.push({ ...customer, createdAt: Date.now() });
    }
    saveData('customers', customers);
  }

  public getLedger(customerId?: string): CustomerLedgerEntry[] {
    const all = loadData<CustomerLedgerEntry[]>('ledger', INITIAL_LEDGER);
    if (customerId) {
      return all.filter((l) => l.customerId === customerId).sort((a, b) => b.createdAt - a.createdAt);
    }
    return all.sort((a, b) => b.createdAt - a.createdAt);
  }

  public recordCustomerLedgerEntry(entry: {
    customerId: string;
    type: 'CREDIT_SALE' | 'PAYMENT_RECEIVED' | 'RETURN_CREDIT';
    amount: number;
    referenceId?: string;
    note: string;
  }): void {
    const customers = this.getCustomers();
    const cIndex = customers.findIndex((c) => c.id === entry.customerId);
    if (cIndex < 0) return;

    const prevBalance = customers[cIndex].totalBalanceDue || 0;
    let newBalance = prevBalance;

    if (entry.type === 'CREDIT_SALE') {
      newBalance = prevBalance + entry.amount;
    } else if (entry.type === 'PAYMENT_RECEIVED' || entry.type === 'RETURN_CREDIT') {
      newBalance = Math.max(0, prevBalance - entry.amount);
    }

    customers[cIndex].totalBalanceDue = newBalance;
    saveData('customers', customers);

    const ledger = this.getLedger();
    const newLedgerEntry: CustomerLedgerEntry = {
      id: 'ledg-' + Date.now() + '-' + Math.floor(Math.random() * 100),
      customerId: entry.customerId,
      type: entry.type,
      amount: entry.amount,
      previousBalance: prevBalance,
      newBalance: newBalance,
      referenceId: entry.referenceId,
      note: entry.note,
      createdAt: Date.now(),
    };
    ledger.unshift(newLedgerEntry);
    saveData('ledger', ledger);
  }

  // Purchases & Suppliers
  public getSuppliers(): Supplier[] {
    return loadData<Supplier[]>('suppliers', INITIAL_SUPPLIERS);
  }

  public saveSupplier(supplier: Supplier): void {
    const suppliers = this.getSuppliers();
    const index = suppliers.findIndex((s) => s.id === supplier.id);
    if (index >= 0) {
      suppliers[index] = supplier;
    } else {
      suppliers.push({ ...supplier, createdAt: Date.now() });
    }
    saveData('suppliers', suppliers);
  }

  public getPurchases(): Purchase[] {
    return loadData<Purchase[]>('purchases', []).sort((a, b) => b.createdAt - a.createdAt);
  }

  public executePurchaseTransaction(purchaseData: Omit<Purchase, 'id' | 'createdAt'>): {
    success: boolean;
    purchase?: Purchase;
  } {
    const products = this.getProducts();

    // Increase product stock & update purchase price if newer
    for (const item of purchaseData.items) {
      const pIndex = products.findIndex((p) => p.id === item.productId);
      if (pIndex >= 0) {
        const prevStock = products[pIndex].stockQuantity;
        const newStock = prevStock + item.quantity;
        products[pIndex].stockQuantity = newStock;
        products[pIndex].purchasePrice = item.unitCost; // update latest cost
        products[pIndex].updatedAt = Date.now();

        this.recordStockMovement({
          productId: item.productId,
          type: 'PURCHASE',
          quantityChange: item.quantity,
          previousStock: prevStock,
          newStock: newStock,
          reason: `ক্রয় চালান ${purchaseData.purchaseBillNumber}`,
          referenceId: purchaseData.purchaseBillNumber,
        });
      }
    }
    saveData('products', products);

    // Update supplier balance due if unpaid
    if (purchaseData.balanceDue > 0) {
      const suppliers = this.getSuppliers();
      const sIndex = suppliers.findIndex((s) => s.id === purchaseData.supplierId);
      if (sIndex >= 0) {
        suppliers[sIndex].totalPayableDue += purchaseData.balanceDue;
        saveData('suppliers', suppliers);
      }
    }

    const purchases = this.getPurchases();
    const completedPurchase: Purchase = {
      ...purchaseData,
      id: 'purch-' + Date.now(),
      createdAt: Date.now(),
    };
    purchases.unshift(completedPurchase);
    saveData('purchases', purchases);

    return { success: true, purchase: completedPurchase };
  }

  // Expenses
  public getExpenses(): Expense[] {
    return loadData<Expense[]>('expenses', INITIAL_EXPENSES).sort((a, b) => b.date - a.date);
  }

  public recordExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Expense {
    const expenses = this.getExpenses();
    const newExpense: Expense = {
      ...expense,
      id: 'exp-' + Date.now(),
      createdAt: Date.now(),
    };
    expenses.unshift(newExpense);
    saveData('expenses', expenses);
    return newExpense;
  }

  // Dashboard & Metrics Calculation
  public getDashboardMetrics(): DashboardMetrics {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const sales = this.getSales().filter((s) => s.status === 'COMPLETED');
    const todaySales = sales.filter((s) => s.createdAt >= startOfToday);

    const todaySalesTotal = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);
    const todayCOGS = todaySales.reduce((sum, s) => sum + s.totalCostOfGoods, 0);
    const todayGrossProfit = todaySalesTotal - todayCOGS;

    const expenses = this.getExpenses();
    const todayExpenses = expenses
      .filter((e) => e.date >= startOfToday)
      .reduce((sum, e) => sum + e.amount, 0);

    const customers = this.getCustomers();
    const totalCustomerCreditDue = customers.reduce((sum, c) => sum + (c.totalBalanceDue || 0), 0);

    const suppliers = this.getSuppliers();
    const totalSupplierPayableDue = suppliers.reduce((sum, s) => sum + (s.totalPayableDue || 0), 0);

    const products = this.getProducts();
    const totalProductsCount = products.length;
    const lowStockProductsCount = products.filter((p) => p.stockQuantity <= p.lowStockThreshold).length;
    const totalInventoryValuation = products.reduce((sum, p) => sum + p.stockQuantity * p.purchasePrice, 0);

    return {
      todaySales: todaySalesTotal,
      todaySalesCount: todaySales.length,
      todayExpenses,
      todayEstimatedGrossProfit: todayGrossProfit,
      totalCustomerCreditDue,
      totalSupplierPayableDue,
      totalProductsCount,
      lowStockProductsCount,
      totalInventoryValuation,
    };
  }

  // Backup & Restore
  public exportFullBackupJson(): string {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      appName: 'Offline POS Manager',
      settings: this.getSettings(),
      users: this.getUsers(),
      categories: this.getCategories(),
      products: this.getProducts(),
      customers: this.getCustomers(),
      ledger: this.getLedger(),
      suppliers: this.getSuppliers(),
      sales: this.getSales(),
      purchases: this.getPurchases(),
      expenses: this.getExpenses(),
      stock_movements: this.getStockMovements(),
    };
    return JSON.stringify(backup, null, 2);
  }

  public importBackupJson(jsonString: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.appName || !data.products || !Array.isArray(data.products)) {
        return { success: false, error: 'অবৈধ ব্যাকআপ ফাইল ফরম্যাট' };
      }

      if (data.settings) saveData('settings', data.settings);
      if (data.users) saveData('users', data.users);
      if (data.categories) saveData('categories', data.categories);
      if (data.products) saveData('products', data.products);
      if (data.customers) saveData('customers', data.customers);
      if (data.ledger) saveData('ledger', data.ledger);
      if (data.suppliers) saveData('suppliers', data.suppliers);
      if (data.sales) saveData('sales', data.sales);
      if (data.purchases) saveData('purchases', data.purchases);
      if (data.expenses) saveData('expenses', data.expenses);
      if (data.stock_movements) saveData('stock_movements', data.stock_movements);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: 'ফাইল পার্সিং ব্যর্থ হয়েছে: ' + (e?.message || '') };
    }
  }
}

export const posDb = PosRepository.getInstance();
