"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DEFAULT_COMPANY = {
  name: "FACTORY SALE",
  tagline: "Premium Fashion Store",
  gstin: "27ABCDE1234F1Z5",
  address: "123 Fashion Street, Andheri West, Mumbai, Maharashtra - 400058",
  email: "support@factorysale.com",
  phone: "+91 98765 43210",
  website: "www.factorysale.com",
};

const InvoiceDownloadButton = ({ order, company = {} }) => {
  const [loading, setLoading] = useState(false);
  const co = { ...DEFAULT_COMPANY, ...company };

  const formatINR = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const safe = (v, fb = "-") => (v === 0 || v ? v : fb);

  const generatePDF = async () => {
    if (!order) return;
    setLoading(true);

    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;

      // ===== Header =====
      doc.setFillColor(220, 38, 38);
      doc.rect(0, 0, pageWidth, 110, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.text("FACTORY", margin, 45);
      doc.setFontSize(18);
      doc.text("SALE", margin + 90, 45);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Premium Fashion Store", margin, 68);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(255, 215, 0);
      doc.text("TAX INVOICE", pageWidth - margin, 48, { align: "right" });
      
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(`Order #${safe(order.orderId || order._id || order.id)}`, pageWidth - margin, 72, { align: "right" });

      // ===== Company Info =====
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, 130, pageWidth - (margin * 2), 70, "F");
      doc.setDrawColor(220, 220, 220);
      doc.rect(margin, 130, pageWidth - (margin * 2), 70, "D");

      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      
      const companyLines = [
        `${co.name} - ${co.tagline}`,
        `GST: ${co.gstin}`,
        co.address,
        `Email: ${co.email} | Phone: ${co.phone}`,
      ];
      
      let cy = 146;
      companyLines.forEach((line) => {
        doc.text(line, margin + 10, cy);
        cy += 13;
      });

      // ===== Billing & Shipping =====
      let y = 225;
      const colWidth = (pageWidth - (margin * 2) - 30) / 2;
      
      // Billing Address
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, colWidth, 90, "F");
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, y, colWidth, 90, "D");
      
      doc.setTextColor(0, 110, 230);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("BILLING ADDRESS", margin + 12, y + 20);
      
      const addr = order.shippingAddress || {};
      const billLines = [
        addr.fullName || order.userName || "Customer",
        addr.phone || order.userPhone || "",
        addr.addressLine1 || addr.address || "",
        addr.addressLine2 || "",
        [addr.city, addr.state, addr.pincode].filter(Boolean).join(", "),
      ].filter(Boolean);
      
      doc.setTextColor(70, 70, 70);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      let by = y + 38;
      billLines.forEach((line) => {
        doc.text(line, margin + 12, by);
        by += 13;
      });

      // Shipping Address
      doc.rect(pageWidth - margin - colWidth, y, colWidth, 90, "D");
      doc.rect(pageWidth - margin - colWidth, y, colWidth, 90, "F");
      
      doc.setTextColor(0, 110, 230);
      doc.setFont("helvetica", "bold");
      doc.text("SHIPPING ADDRESS", pageWidth - margin - colWidth + 12, y + 20);
      
      doc.setTextColor(70, 70, 70);
      doc.setFont("helvetica", "normal");
      let sy = y + 38;
      billLines.forEach((line) => {
        doc.text(line, pageWidth - margin - colWidth + 12, sy);
        sy += 13;
      });

      // ===== Order Summary =====
      y = y + 110;
      doc.setFillColor(255, 248, 240);
      doc.rect(margin, y, pageWidth - (margin * 2), 45, "F");
      doc.setDrawColor(230, 200, 150);
      doc.rect(margin, y, pageWidth - (margin * 2), 45, "D");
      
      const orderDate = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "-";
      
      const summaryItems = [
        { label: "Order Date", value: orderDate },
        { label: "Status", value: String(order.status || "-").toUpperCase() },
        { label: "Payment", value: String(order.paymentMethod || "-").toUpperCase() },
      ];
      
      let sx = margin + 15;
      summaryItems.forEach((item, idx) => {
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(item.label, sx + (idx * 170), y + 18);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(item.value, sx + (idx * 170) + 80, y + 18, { align: "right" });
      });

      // ===== Items Table =====
      const items = order.items || order.products || [];
      const tableBody = items.map((it, idx) => {
        const name = it.name || it.productName || it.title || "Item";
        const variant = [it.color, it.size].filter(Boolean).join(" · ");
        const qty = it.quantity || it.qty || 1;
        const price = it.price || it.unitPrice || 0;
        const total = price * qty;
        
        const isBulk = it.isBulkProduct;
        const bulkInfo = isBulk ? `\n${it.totalPieces || it.piecesPerSet * it.totalSets} pieces` : "";
        
        return [
          String(idx + 1),
          variant ? `${name}${bulkInfo}\n${variant}` : `${name}${bulkInfo}`,
          String(qty),
          formatINR(price),
          formatINR(total),
        ];
      });

      autoTable(doc, {
        startY: y + 60,
        head: [["#", "DESCRIPTION", "QTY", "UNIT PRICE", "TOTAL"]],
        body: tableBody.length ? tableBody : [["-", "No items", "-", "-", "-"]],
        theme: "striped",
        headStyles: { 
          fillColor: [220, 38, 38], 
          textColor: 255, 
          fontStyle: "bold", 
          fontSize: 9,
          halign: "center",
        },
        bodyStyles: { fontSize: 8.5, textColor: [60, 60, 60] },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: {
          0: { cellWidth: 35, halign: "center" },
          1: { cellWidth: 230 },
          2: { cellWidth: 45, halign: "center" },
          3: { cellWidth: 85, halign: "right" },
          4: { cellWidth: 95, halign: "right" },
        },
        margin: { left: margin, right: margin },
      });

      // ===== Totals Section - Fixed spacing =====
      const subtotal = order.subtotal ?? items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0);
      const shipping = order.shippingCost ?? order.shipping ?? 0;
      const discount = order.discount ?? 0;
      const total = order.totalAmount ?? order.total ?? subtotal + shipping - discount;

      let ty = doc.lastAutoTable.finalY + 25;
      const totalsX = pageWidth - margin - 220;

      // Totals box
      doc.setFillColor(250, 250, 250);
      doc.rect(totalsX - 10, ty - 8, 230, (discount > 0 ? 110 : 95), "F");
      doc.setDrawColor(220, 220, 220);
      doc.rect(totalsX - 10, ty - 8, 230, (discount > 0 ? 110 : 95), "D");

      const drawTotalRow = (label, value, bold = false, color = [60, 60, 60]) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(bold ? 12 : 9);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(label, totalsX, ty);
        doc.text(value, pageWidth - margin, ty, { align: "right" });
        ty += bold ? 24 : 18;
      };

      drawTotalRow("Subtotal", formatINR(subtotal));
      drawTotalRow("Shipping Charges", formatINR(shipping));
      if (discount > 0) drawTotalRow("Discount", `- ${formatINR(discount)}`, false, [220, 53, 69]);
      
      ty += 2;
      doc.setDrawColor(200, 200, 200);
      doc.line(totalsX - 5, ty - 10, pageWidth - margin, ty - 10);
      drawTotalRow("GRAND TOTAL", formatINR(total), true, [220, 38, 38]);

      // ===== Footer =====
      const footerY = pageHeight - 85;
      
      doc.setFillColor(248, 248, 248);
      doc.rect(0, pageHeight - 130, pageWidth, 50, "F");
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.text("* Terms & Conditions:", margin, pageHeight - 115);
      doc.text("1. Goods once sold cannot be returned or exchanged", margin + 10, pageHeight - 103);
      doc.text("2. This is a computer generated invoice and requires no signature", margin + 10, pageHeight - 93);
      doc.text(`3. For any queries, please contact within 7 days of delivery`, margin + 10, pageHeight - 83);

      doc.setFillColor(220, 38, 38);
      doc.rect(0, pageHeight - 70, pageWidth, 70, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Thank you for shopping with FACTORY SALE", margin, pageHeight - 48);
      doc.text("Need help? Contact us at support@factorysale.com | +91 98765 43210", margin, pageHeight - 36);
      
      doc.setFontSize(7);
      doc.text(`Generated on ${new Date().toLocaleString("en-IN")}`, pageWidth - margin, pageHeight - 48, { align: "right" });
      doc.text(`GSTIN: ${co.gstin}`, pageWidth - margin, pageHeight - 36, { align: "right" });

      doc.save(`Invoice-${order.orderId || order._id || "order"}.pdf`);
    } catch (e) {
      console.error("Invoice generation failed:", e);
      alert("Could not generate invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={generatePDF}
      disabled={loading || !order}
      className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg shadow-red-600/20 transition-all duration-300"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Generating Invoice...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" /> Download Tax Invoice
        </>
      )}
    </motion.button>
  );
};

export default InvoiceDownloadButton;