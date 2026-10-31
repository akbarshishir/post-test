/**
 * Data types matching Android Room database entities and relationships
 * for the Offline POS Manager application.
 */

export type Currency = 'BDT' | 'USD' | 'EUR' | 'INR' | 'GBP';

export type UserRole = 'ADMIN' | 'MANAGER' | 'SALESMAN' | 'ACCOUNTANT';

export interface AppUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  pin: string; // 4-digit PIN for quick switch
  active: boolean;
  avatar?: string; // Custom user photo base64 or URL
  createdAt: number;
}

export interface BusinessSettings {
  id: number;
  businessName: string;
  businessNameBn: string;
  ownerName: string;
  phone: string;
  email?: string;
  address: string;
  slogan?: string;
  logoUrl?: string; // Custom store logo data URL
  currencySymbol: string;
  currencyCode: Currency;
  language: 'bn' | 'en';
  themeMode: 'light' | 'dark';
  activeUserId: string;
  invoicePrefix: string;
  defaultLowStockThreshold: number;
  allowNegativeStock: boolean;
  enableVatTax: boolean;
  vatRatePercent: number;
  receiptFooterMessage: string;
  pinLockEnabled: boolean;
  appPin: string;
  appVersion: string; // e.g. "v1.2.0"
  revisionCount: number; // Increments on every edit
  lastEditedAt: number; // Timestamp of latest modification
}

export interface Category {
  id: string;
  name: string;
  nameBn: string;
  colorHex: string;
}

export interface Product {
  id: string;
  name: string;
  nameBn: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  purchasePrice: number; // Cost of goods
  sellingPrice: number;  // Retail price
  stockQuantity: number;
  lowStockThreshold: number;
  unit: string; // e.g. "পিস / Pcs", "কেজি / Kg", "প্যাকেট / Pkt"
  createdAt: number;
  updatedAt: number;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  type: 'INITIAL' | 'SALE' | 'PURCHASE' | 'MANUAL_ADJUSTMENT' | 'RETURN';
  quantityChange: number; // positive or negative
  previousStock: number;
  newStock: number;
  reason: string;
  referenceId?: string; // saleId or purchaseId
  createdAt: number;
}

export type PaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'BANK' | 'CREDIT';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalBalanceDue: number; // Amount customer owes the shop
  notes?: string;
  createdAt: number;
}

export interface CustomerLedgerEntry {
  id: string;
  customerId: string;
  type: 'CREDIT_SALE' | 'PAYMENT_RECEIVED' | 'RETURN_CREDIT';
  amount: number;
  previousBalance: number;
  newBalance: number;
  referenceId?: string; // saleId or receiptId
  note: string;
  createdAt: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  purchaseCost: number; // stored purchase cost at sale time for accurate COGS
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
}

export type SaleStatus = 'COMPLETED' | 'REFUNDED' | 'CANCELLED';

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  discountTotal: number;
  vatTaxTotal: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  balanceDue: number; // if > 0, recorded into customer credit ledger
  paymentMethod: PaymentMethod;
  totalCostOfGoods: number; // sum of (item.purchaseCost * item.quantity)
  grossProfit: number;      // grandTotal - totalCostOfGoods
  status: SaleStatus;
  notes?: string;
  createdAt: number;
  items: SaleItem[];
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  companyName: string;
  totalPayableDue: number; // What the store owes the supplier
  address?: string;
  createdAt: number;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface Purchase {
  id: string;
  purchaseBillNumber: string;
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: number;
  items: PurchaseItem[];
}

export type ExpenseCategory = 
  | 'RENT' 
  | 'ELECTRICITY_UTILITY' 
  | 'STAFF_SALARY' 
  | 'TRANSPORT' 
  | 'PACKAGING' 
  | 'TEA_SNACKS' 
  | 'REPAIR_MAINTENANCE' 
  | 'OTHER';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  categoryCustomName?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  date: number;
  createdAt: number;
}

export interface DashboardMetrics {
  todaySales: number;
  todaySalesCount: number;
  todayExpenses: number;
  todayEstimatedGrossProfit: number;
  totalCustomerCreditDue: number;
  totalSupplierPayableDue: number;
  totalProductsCount: number;
  lowStockProductsCount: number;
  totalInventoryValuation: number;
}
