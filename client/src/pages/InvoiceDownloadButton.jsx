"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DEFAULT_COMPANY = {
  COMPANY_NAME: "REVON JEANS",
  TAGLINE: "Premium Men's wear",
  GSTIN: "27ETNPK4151G1ZH",
  ADDRESS: "SHOP NO. 1 OM SAI GANESH KPIRA CHAWL NEAR CHIRAG HOTEL,NEAR BASANT BAHAR ROAD ULHASNAGAR 421005",
  EMAIL: "factorysaleusadata@gmail.com",
  PHONE: "+91 8830155383",
  STATE: "MAHARASHTRA",
};

const InvoiceDownloadButton = ({ order, company = {} }) => {
  const [loading, setLoading] = useState(false);
  const co = { ...DEFAULT_COMPANY, ...company };

  const inr = (n) =>
    `Rs. ${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // ---------- Helpers ----------
  const getPaymentStatusLabel = (order) => {
    const s = (order?.paymentInfo?.status || "").toUpperCase();
    if (s === "PAID") return { text: "PAID", color: [16, 145, 80] };
    if (s === "PARTIALLY_PAID")
      return { text: "PARTIALLY PAID", color: [200, 120, 0] };
    if (s === "PENDING" && order?.paymentInfo?.method?.toUpperCase() === "COD")
      return { text: "COD - PAY ON DELIVERY", color: [200, 120, 0] };
    if (s === "FAILED") return { text: "FAILED", color: [200, 30, 30] };
    return { text: s || "PENDING", color: [120, 120, 120] };
  };

  const getOrderType = (order) =>
    order?.items?.some((i) => i.isBulkProduct) ? "BULK ORDER" : "REGULAR";

  const getItemQtyDetail = (it) => {
    if (it.isBulkProduct) {
      const sets = it.totalSets || it.quantity || 1;
      const perSet = it.piecesPerSet || 0;
      const totalPieces = it.totalPieces || perSet * sets;
      return {
        qtyText: `${sets} Set(s)`,
        piecesText: `${perSet}/set · ${totalPieces} pcs`,
        unitPrice: it.pricePerSet || it.price || 0,
        unitLabel: "/set",
        lineTotal: (it.pricePerSet || it.price || 0) * sets,
      };
    }
    const qty = it.quantity || 1;
    return {
      qtyText: String(qty),
      piecesText: "-",
      unitPrice: it.price || 0,
      unitLabel: "/pc",
      lineTotal: (it.price || 0) * qty,
    };
  };

  const generatePDF = async () => {
    if (!order) return;
    setLoading(true);

    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const M = 36;

      // ============ HEADER BAR ============
      doc.setFillColor(220, 38, 38);
      doc.rect(0, 0, pageW, 85, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(co.COMPANY_NAME, M, 32);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(co.TAGLINE, M, 46);
      
      // ✅ Address ko multiple lines me wrap karna
      doc.setFontSize(6.5);
      const addressLines = doc.splitTextToSize(co.ADDRESS, pageW - M * 2 - 100);
      let addrY = 56;
      addressLines.forEach((line) => {
        doc.text(line, M, addrY);
        addrY += 8;
      });
      doc.text(`GSTIN: ${co.GSTIN}`, M, addrY + 4);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("TAX INVOICE", pageW - M, 32, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text("Original for Recipient", pageW - M, 46, { align: "right" });
      doc.text(`${co.EMAIL} | ${co.PHONE}`, pageW - M, 58, { align: "right" });
      doc.text(`State: ${co.STATE}`, pageW - M, 68, { align: "right" });

      // ============ ORDER META STRIP ============
      let y = 110;
      const orderId = order.orderNumber || order.orderId || order._id || order.id || "-";
      const invoiceNo = `INV-${String(orderId).slice(-8).toUpperCase()}`;
      const orderDate = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "-";
      const invoiceDate = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      doc.setFillColor(245, 245, 245);
      doc.rect(M, y, pageW - M * 2, 44, "F");
      doc.setDrawColor(220, 220, 220);
      doc.rect(M, y, pageW - M * 2, 44, "S");

      const metaCol = (label, value, x, yy) => {
        doc.setTextColor(110, 110, 110);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.text(label.toUpperCase(), x, yy);
        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(String(value), x, yy + 11);
      };

      const colW = (pageW - M * 2) / 4;
      metaCol("Invoice No.", invoiceNo, M + 12, y + 14);
      metaCol("Order ID", `#${orderId}`, M + 12 + colW, y + 14);
      metaCol("Order Date", orderDate, M + 12 + colW * 2, y + 14);
      metaCol("Invoice Date", invoiceDate, M + 12 + colW * 3, y + 14);

      // ============ ORDER TYPE + PAYMENT STATUS BADGES ============
      y += 58;
      const orderType = getOrderType(order);
      const payStatus = getPaymentStatusLabel(order);

      // Order type badge
      doc.setFillColor(orderType === "BULK ORDER" ? 220 : 60, orderType === "BULK ORDER" ? 38 : 60, orderType === "BULK ORDER" ? 38 : 60);
      doc.roundedRect(M, y, 100, 20, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(orderType, M + 50, y + 13, { align: "center" });

      // Payment status badge
      doc.setFillColor(payStatus.color[0], payStatus.color[1], payStatus.color[2]);
      doc.roundedRect(M + 115, y, 160, 20, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.text(payStatus.text, M + 195, y + 13, { align: "center" });

      // Payment method on right
      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        `Payment: ${(order.paymentInfo?.method || order.paymentMethod || "N/A").toUpperCase()}`,
        pageW - M,
        y + 13,
        { align: "right" }
      );

      // ============ BILLING / SHIPPING ============
      y += 34;
      const addr = order.shippingAddress || {};
      const boxW = (pageW - M * 2 - 12) / 2;

      const addrBox = (x, title, lines) => {
        doc.setFillColor(252, 252, 252);
        doc.rect(x, y, boxW, 85, "F");
        doc.setDrawColor(220, 220, 220);
        doc.rect(x, y, boxW, 85, "S");
        doc.setFillColor(220, 38, 38);
        doc.rect(x, y, boxW, 18, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(title, x + 10, y + 13);
        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        let ly = y + 28;
        lines.filter(Boolean).forEach((l) => {
          const wrapped = doc.splitTextToSize(String(l), boxW - 20);
          wrapped.forEach((w) => {
            if (ly < y + 82) {
              doc.text(w, x + 10, ly);
              ly += 10;
            }
          });
        });
      };

      const addrLines = [
        addr.fullName || order.user?.name || "Customer",
        addr.phoneNumber || addr.phone || "",
        addr.email || order.user?.email || "",
        [addr.addressLine1, addr.addressLine2].filter(Boolean).join(", "),
        [addr.city, addr.state, addr.pinCode || addr.pincode].filter(Boolean).join(", "),
      ];

      addrBox(M, "BILLING ADDRESS", addrLines);
      addrBox(M + boxW + 12, "SHIPPING ADDRESS", addrLines);

      // ============ ITEMS TABLE ============
      y += 100;
      const items = order.items || order.products || [];

      const body = items.map((it, idx) => {
        const d = getItemQtyDetail(it);
        const name = it.name || it.productName || it.title || "Item";
        const variant = [
          it.size ? `${it.size}` : null,
          it.color ? `${it.color}` : null,
        ]
          .filter(Boolean)
          .join(" | ");
        const desc = name + (variant ? `\n(${variant})` : "");
        const hsn = it.hsn || it.hsnCode || it.product?.hsn || "6109";
        return [
          String(idx + 1),
          desc,
          hsn,
          d.qtyText,
          `${inr(d.unitPrice)}\n(${d.unitLabel})`,
          inr(d.lineTotal),
        ];
      });

      autoTable(doc, {
        startY: y,
        head: [["#", "DESCRIPTION", "HSN", "QTY", "UNIT", "AMOUNT"]],
        body: body.length ? body : [["-", "No items", "-", "-", "-", "-"]],
        theme: "grid",
        headStyles: {
          fillColor: [40, 40, 40],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8,
          halign: "center",
          cellPadding: 5,
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [50, 50, 50],
          cellPadding: 5,
          valign: "middle",
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: {
          0: { cellWidth: 22, halign: "center" },
          1: { cellWidth: 210 },
          2: { cellWidth: 45, halign: "center" },
          3: { cellWidth: 45, halign: "center" },
          4: { cellWidth: 75, halign: "right" },
          5: { cellWidth: 75, halign: "right", fontStyle: "bold" },
        },
        margin: { left: M, right: M },
      });

      // ============ TOTALS ============
      let ty = doc.lastAutoTable.finalY + 12;

      const subtotal =
        order.pricing?.subtotal ??
        order.subtotal ??
        items.reduce((s, it) => s + getItemQtyDetail(it).lineTotal, 0);
      const shipping = order.pricing?.shipping ?? order.shippingCharge ?? order.shippingCost ?? 0;
      const freeDisc = order.pricing?.freediscount ?? order.freediscount ?? 0;
      const couponDisc = order.discount ?? 0;
      const total = order.pricing?.total ?? order.totalAmount ?? order.total ?? subtotal + shipping - freeDisc - couponDisc;

      // Page-break safety
      if (ty > pageH - 220) {
        doc.addPage();
        ty = M + 20;
      }

      // ✅ FIX: Payment box aur total box ka height same rakhna
      const totalsX = pageW - M - 220;
      const totalsW = 220;
      const rowsCount = 2 + (freeDisc > 0 ? 1 : 0) + (couponDisc > 0 ? 1 : 0);
      const boxH = Math.max(rowsCount * 18 + 45, 130); // Minimum height set kiya
      
      const payBoxW = pageW - M * 2 - totalsW - 12;
      const payBoxX = M;
      const payBoxY = ty;

      // ✅ Payment Breakdown Box (Left side)
      doc.setFillColor(255, 251, 245);
      doc.rect(payBoxX, payBoxY, payBoxW, boxH, "F");
      doc.setDrawColor(230, 200, 160);
      doc.rect(payBoxX, payBoxY, payBoxW, boxH, "S");

      doc.setFillColor(220, 38, 38);
      doc.rect(payBoxX, payBoxY, payBoxW, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("PAYMENT DETAILS", payBoxX + 10, payBoxY + 13);

      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      let py = payBoxY + 30;

      const payLine = (k, v, bold = false) => {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(110, 110, 110);
        doc.text(k, payBoxX + 10, py);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(40, 40, 40);
        doc.text(String(v), payBoxX + payBoxW - 10, py, { align: "right" });
        py += 13;
      };

      payLine("Method", (order.paymentInfo?.method || order.paymentMethod || "N/A").toUpperCase());
      payLine("Status", payStatus.text, true);

      if (order.partialCod?.enabled) {
        payLine(`Online (${order.partialCod.percentage}%)`, inr(order.partialCod.onlineAmount), true);
        payLine("COD on Delivery", inr(order.partialCod.codAmount), true);
      } else if ((order.paymentInfo?.method || "").toUpperCase() === "COD") {
        payLine("To Pay on Delivery", inr(total), true);
      } else {
        payLine("Amount Paid", inr(total), true);
      }

      // ✅ Total Box (Right side) - Same height as payment box
      doc.setFillColor(250, 250, 250);
      doc.rect(totalsX, ty, totalsW, boxH, "F");
      doc.setDrawColor(220, 220, 220);
      doc.rect(totalsX, ty, totalsW, boxH, "S");

      let ry = ty + 16;
      const row = (label, val, opts = {}) => {
        doc.setFont("helvetica", opts.bold ? "bold" : "normal");
        doc.setFontSize(opts.bold ? 10 : 8);
        doc.setTextColor(...(opts.color || [60, 60, 60]));
        doc.text(label, totalsX + 10, ry);
        doc.text(val, totalsX + totalsW - 10, ry, { align: "right" });
        ry += opts.bold ? 20 : 16;
      };

      row("Subtotal", inr(subtotal));
      row("Shipping", inr(shipping));
      if (freeDisc > 0) row("Free Discount", `- ${inr(freeDisc)}`, { color: [30, 110, 200] });
      if (couponDisc > 0)
        row(
          `Coupon${order.couponCode ? ` (${order.couponCode})` : ""}`,
          `- ${inr(couponDisc)}`,
          { color: [16, 145, 80] }
        );

      doc.setDrawColor(180, 180, 180);
      doc.line(totalsX + 8, ry - 6, totalsX + totalsW - 8, ry - 6);
      row("GRAND TOTAL", inr(total), { bold: true, color: [220, 38, 38] });

      // ============ FOOTER ============
      const fy = pageH - 60;
      doc.setFillColor(245, 245, 245);
      doc.rect(0, fy - 45, pageW, 45, "F");
      doc.setTextColor(90, 90, 90);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text("Terms:", M, fy - 32);
      doc.setFont("helvetica", "normal");
      doc.text("1. Goods once sold will be taken back as per return policy.", M, fy - 22);
      doc.text("2. Computer generated invoice - no signature required.", M, fy - 14);
      doc.text("3. Subject to Mumbai jurisdiction. E.&O.E.", M, fy - 6);

      doc.setFillColor(220, 38, 38);
      doc.rect(0, fy, pageW, 60, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`Thank you for shopping with ${co.COMPANY_NAME}!`, pageW / 2, fy + 20, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(`${co.EMAIL} | ${co.PHONE}`, pageW / 2, fy + 34, { align: "center" });
      doc.setFontSize(6);
      doc.text(
        `Generated on ${new Date().toLocaleString("en-IN")} | GSTIN: ${co.GSTIN}`,
        pageW / 2,
        fy + 48,
        { align: "center" }
      );

      doc.save(`Invoice-${invoiceNo}.pdf`);
    } catch (e) {
      console.error("Invoice generation failed:", e);
      alert("Could not generate invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={generatePDF}
      disabled={loading || !order}
      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-md transition-all duration-300"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Generating...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" /> Download Invoice
        </>
      )}
    </motion.button>
  );
};

export default InvoiceDownloadButton;