import type { jsPDF } from "jspdf";

/**
 * Lays out one horsey on a US Letter page: the picture fits a square of `box` inches,
 * with the name underneath and a dotted cut line around both.
 */
export function layoutHorseyPage(
  doc: jsPDF,
  image: { dataUrl: string; width: number; height: number },
  name: string,
  box: number,
) {
  const pageW = 8.5;
  const imgW = image.width >= image.height ? box : (box * image.width) / image.height;
  const imgH = image.width >= image.height ? (box * image.height) / image.width : box;
  const x = (pageW - imgW) / 2;
  const y = 1;
  doc.addImage(image.dataUrl, "PNG", x, y, imgW, imgH, undefined, "FAST");

  // Standard PDF fonts only cover Latin-1, so drop anything else (emoji etc).
  const label = name.replace(/[^\x20-\xFF]/g, "").trim();
  const nameSize = Math.max(12, Math.min(28, box * 5));
  let bottom = y + imgH;
  if (label) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(nameSize);
    doc.setTextColor(31, 31, 31);
    bottom += 0.15 + nameSize / 72;
    doc.text(label, pageW / 2, bottom, { align: "center" });
  }

  const pad = 0.25;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.015);
  doc.setLineDashPattern([0.08, 0.06], 0);
  const cutW = Math.max(imgW, label ? doc.getTextWidth(label) : 0) + pad * 2;
  doc.roundedRect((pageW - cutW) / 2, y - pad, cutW, bottom - y + pad * 2, 0.15, 0.15, "S");

  doc.setLineDashPattern([], 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text("Cut along the dotted line, add a magnet, and let them race.", pageW / 2, 10.5, { align: "center" });
}
