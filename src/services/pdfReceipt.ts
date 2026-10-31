/**
 * Receipt Generation & High-Resolution Bengali PDF Export Utility
 * Uses HTML2Canvas + jsPDF to render 100% pixel-perfect Bengali Unicode (যুক্তাক্ষর / কার)
 * without text distortion, font dropping, or broken character shaping.
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { BusinessSettings, Sale } from '../types/pos';

export function formatCurrency(amount: number, symbol = '৳'): string {
  const formatted = new Intl.NumberFormat('bn-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  return `${symbol}${formatted}`;
}

export function formatDate(timestamp: number, locale = 'bn-BD'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

/**
 * Capture an on-screen HTML receipt and export as high-resolution PDF.
 * Ensures Bengali fonts (Hind Siliguri) are fully loaded and shaped by the browser before capture.
 */
export async function generatePdfReceiptFromElement(
  target: HTMLElement | string,
  filename: string
): Promise<boolean> {
  try {
    const element = typeof target === 'string' ? document.getElementById(target) : target;
    if (!element) {
      console.warn('Target element not found for PDF export:', target);
      return false;
    }

    // Wait for Bengali fonts to be fully ready in browser cache
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // High quality rasterization via html2canvas
    const canvas = await html2canvas(element, {
      scale: 3, // 300 DPI high-res crispness
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdfWidth = 80; // 80mm standard POS roll width
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, Math.max(pdfHeight, 100)],
    });

    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Failed to export Bengali PDF:', error);
    return false;
  }
}

/**
 * Universal PDF receipt generator for a sale:
 * First attempts to use the visible DOM receipt node #thermal-receipt,
 * or constructs an off-screen Bengali receipt container if called headless.
 */
export async function generatePdfReceipt(sale: Sale, settings: BusinessSettings): Promise<void> {
  const existingElement = document.getElementById('thermal-receipt');
  if (existingElement) {
    const success = await generatePdfReceiptFromElement(existingElement, `${sale.invoiceNumber}.pdf`);
    if (success) return;
  }

  // Headless off-screen rendering fallback
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '360px';
  container.style.padding = '18px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Hind Siliguri', 'Inter', sans-serif";
  container.style.fontSize = '12px';
  container.style.lineHeight = '1.4';
  container.style.boxSizing = 'border-box';

  const shopName = settings.language === 'bn' ? settings.businessNameBn : settings.businessName;
  const sym = settings.currencySymbol || '৳';

  let itemsHtml = '';
  for (const item of sale.items) {
    itemsHtml += `
      <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #e2e8f0; font-size: 11px;">
        <span style="flex: 2; word-break: break-word;">${item.productName}</span>
        <span style="flex: 0.6; text-align: center;">${item.quantity}</span>
        <span style="flex: 0.8; text-align: right;">${item.unitPrice}</span>
        <span style="flex: 1; text-align: right; font-weight: bold;">${item.lineTotal}</span>
      </div>
    `;
  }

  container.innerHTML = `
    <div style="text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 10px; margin-bottom: 8px;">
      <h2 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 700; color: #1e293b;">${shopName}</h2>
      ${settings.slogan ? `<p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b; font-style: italic;">${settings.slogan}</p>` : ''}
      <p style="margin: 0; font-size: 11px; color: #475569;">${settings.address}</p>
      <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">ফোন: ${settings.phone}${settings.email ? ` | ${settings.email}` : ''}</p>
    </div>

    <div style="font-size: 11px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px; margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between;"><span>চালান নং:</span><strong>${sale.invoiceNumber}</strong></div>
      <div style="display: flex; justify-content: space-between;"><span>তারিখ:</span><span>${formatDate(sale.createdAt, 'bn-BD')}</span></div>
      ${sale.customerName ? `<div style="display: flex; justify-content: space-between;"><span>গ্রাহকের নাম:</span><span>${sale.customerName}</span></div>` : ''}
      <div style="display: flex; justify-content: space-between;"><span>পরিশোধের মাধ্যম:</span><strong>${sale.paymentMethod}</strong></div>
    </div>

    <div style="border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 4px; font-weight: bold; font-size: 11px; display: flex; justify-content: space-between;">
      <span style="flex: 2;">পণ্য</span>
      <span style="flex: 0.6; text-align: center;">পরিমাণ</span>
      <span style="flex: 0.8; text-align: right;">দর</span>
      <span style="flex: 1; text-align: right;">মোট</span>
    </div>

    ${itemsHtml}

    <div style="margin-top: 8px; border-top: 1px dashed #cbd5e1; padding-top: 6px; font-size: 11px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span>উপমোট (Subtotal):</span>
        <span>${formatCurrency(sale.subtotal, sym)}</span>
      </div>
      ${sale.discountTotal > 0 ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px; color: #64748b;">
        <span>ছাড় (Discount):</span>
        <span>-${formatCurrency(sale.discountTotal, sym)}</span>
      </div>` : ''}
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-weight: 700; font-size: 13px; border-top: 1px solid #cbd5e1; padding-top: 4px;">
        <span>সর্বমোট (Grand Total):</span>
        <span>${formatCurrency(sale.grandTotal, sym)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span>পরিশোধিত (Paid):</span>
        <span>${formatCurrency(sale.paidAmount, sym)}</span>
      </div>
      ${sale.changeAmount > 0 ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px; color: #059669; font-weight: 600;">
        <span>ফেরত (Change):</span>
        <span>${formatCurrency(sale.changeAmount, sym)}</span>
      </div>` : ''}
      ${sale.balanceDue > 0 ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px; color: #e11d48; font-weight: 700;">
        <span>বাকি (Due Balance):</span>
        <span>${formatCurrency(sale.balanceDue, sym)}</span>
      </div>` : ''}
    </div>

    <div style="text-align: center; margin-top: 14px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 10px; color: #64748b;">
      <p style="margin: 0 0 2px 0;">${settings.receiptFooterMessage || 'কাগজ বক্সে কেনাকাটা করার জন্য ধন্যবাদ!'}</p>
      <p style="margin: 0; font-weight: 600;">কাগজ বক্স - অফলাইন পিওএস (${settings.appVersion || 'v1.2'})</p>
    </div>
  `;

  document.body.appendChild(container);

  try {
    await generatePdfReceiptFromElement(container, `${sale.invoiceNumber}.pdf`);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
