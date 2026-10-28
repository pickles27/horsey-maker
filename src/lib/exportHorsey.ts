import { fileSafeName, type Horsey } from "@/lib/horsey";
import { layoutHorseyPage } from "@/lib/pdfLayout";

export const PRINT_SIZES = {
  small: { label: "Small (3 in)", inches: 3 },
  medium: { label: "Medium (5 in)", inches: 5 },
  large: { label: "Large (7 in)", inches: 7 },
} as const;
export type PrintSize = keyof typeof PRINT_SIZES;

/** Draws the horsey SVG onto a canvas whose longest side is `longest` pixels. */
async function svgToCanvas(svg: SVGSVGElement, longest: number) {
  const [, , vw, vh] = (svg.getAttribute("viewBox") ?? "0 0 100 100").split(/\s+/).map(Number);
  const scale = longest / Math.max(vw, vh);
  const width = Math.round(vw * scale);
  const height = Math.round(vh * scale);

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.removeAttribute("class");
  const markup = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));

  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Couldn't draw the horsey"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas isn't available");
    ctx.drawImage(img, 0, 0, width, height);
    return { canvas, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadPng(svg: SVGSVGElement, horsey: Horsey) {
  const { canvas } = await svgToCanvas(svg, 1600);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Couldn't make the PNG");
  const url = URL.createObjectURL(blob);
  download(url, `${fileSafeName(horsey)}.png`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** One horsey per US Letter page, sized to fit a square of the chosen size. */
export async function downloadPdf(svg: SVGSVGElement, horsey: Horsey, size: PrintSize) {
  const { jsPDF } = await import("jspdf");
  const box = PRINT_SIZES[size].inches;
  const { canvas, width, height } = await svgToCanvas(svg, Math.round(box * 300));

  const doc = new jsPDF({ unit: "in", format: "letter", orientation: "portrait", compress: true });
  layoutHorseyPage(doc, { dataUrl: canvas.toDataURL("image/png"), width, height }, horsey.name, box);
  doc.save(`${fileSafeName(horsey)}.pdf`);
}
