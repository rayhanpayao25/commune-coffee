"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  drinkReceipts,
  itemCount,
  receiptWhen,
  type PaperWidth,
  type ReceiptTicket,
} from "@/lib/escpos";

type ReceiptPreviewProps = {
  ticket: ReceiptTicket;
  paperWidth: PaperWidth;
  printerReady: boolean;
  testPrinterEnabled: boolean;
  pending: boolean;
  onClose: () => void;
  onPrint: () => void;
};

function Slip({
  title,
  paperWidth,
  children,
}: {
  title: string;
  paperWidth: PaperWidth;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center">
      <p className="mb-2 text-[11px] tracking-[0.18em] text-neutral-500 uppercase">
        {title}
      </p>
      <div
        className="bg-white px-4 py-5 text-black shadow-xl"
        style={{ width: paperWidth === 58 ? 220 : 300 }}
      >
        <div className="font-mono text-[11px] leading-4">{children}</div>
      </div>
    </div>
  );
}

function Rule() {
  return <p className="my-2 overflow-hidden text-neutral-400">{"-".repeat(42)}</p>;
}

function BaristaSlip({ ticket }: { ticket: ReceiptTicket }) {
  const drinks = itemCount(ticket.items);
  return (
    <>
      <p className="text-center text-[10px]">MAKE THESE DRINKS</p>
      <Rule />
      <p className="text-center font-bold">ORDER NO. {ticket.ticketNo}</p>
      <p className="text-center">{receiptWhen(ticket.at)}</p>
      <Rule />
      <p className="flex gap-2 font-semibold text-neutral-500">
        <span className="w-8 shrink-0">Qty</span>
        <span>Drink</span>
      </p>
      <ul className="mt-1">
        {ticket.items.map((item) => (
          <li
            key={item.productId}
            className="flex items-baseline gap-2 border-b border-dashed border-neutral-200 py-1"
          >
            <span className="w-8 shrink-0 font-bold">{item.qty}x</span>
            <span className="min-w-0 leading-4 uppercase">{item.name}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center text-[10px] font-semibold">
        {drinks} {drinks === 1 ? "DRINK" : "DRINKS"} TO MAKE
      </p>
    </>
  );
}

function TestLabel({
  ticket,
  index,
}: {
  ticket: ReceiptTicket;
  index: number;
}) {
  return (
    <div className="test-print-label flex w-full max-w-[400px] flex-col items-center">
      <p className="test-print-screen-only mb-2 text-[11px] tracking-[0.18em] text-neutral-500 uppercase">
        Label {index + 1}
      </p>
      <div className="test-print-page aspect-[5/3] w-full overflow-hidden rounded-md border border-neutral-300 bg-[#fdfdf8] text-black shadow-xl">
        <div className="mx-auto h-full w-[96%] px-4 py-3 font-mono text-[10px] leading-3">
          <BaristaSlip ticket={ticket} />
        </div>
      </div>
      <p className="test-print-screen-only mt-2 text-[10px] text-neutral-500">
        50 × 30 mm · 48 mm printable width · 384 dots
      </p>
    </div>
  );
}

export function ReceiptPreview({
  ticket,
  paperWidth,
  printerReady,
  testPrinterEnabled,
  pending,
  onClose,
  onPrint,
}: ReceiptPreviewProps) {
  const receipts = drinkReceipts(ticket);
  const [showTestOutput, setShowTestOutput] = useState(false);
  const labelsRef = useRef<HTMLDivElement>(null);

  function printTestLabels() {
    const pages = labelsRef.current?.querySelectorAll<HTMLElement>(
      ".test-print-page",
    );
    if (!pages?.length) return;

    const styles = Array.from(
      document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>(
        'link[rel="stylesheet"], style',
      ),
    )
      .map((node) => node.outerHTML)
      .join("\n");
    const labels = Array.from(pages)
      .map((page) => `<section class="test-print-sheet">${page.outerHTML}</section>`)
      .join("\n");
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "1px";
    frame.style.height = "1px";
    frame.style.border = "0";

    frame.onload = () => {
      const printWindow = frame.contentWindow;
      if (!printWindow) {
        frame.remove();
        return;
      }
      printWindow.addEventListener("afterprint", () => frame.remove(), {
        once: true,
      });
      printWindow.focus();
      printWindow.print();
    };
    frame.srcdoc = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Test drink labels</title>
    ${styles}
    <style>
      @page { size: 50mm 30mm; margin: 0; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #fff; }
      body { width: 50mm; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .test-print-sheet {
        display: block;
        width: 50mm;
        height: 30mm;
        margin: 0;
        overflow: hidden;
        break-after: page;
        page-break-after: always;
      }
      .test-print-sheet:last-child {
        break-after: auto;
        page-break-after: auto;
      }
      .test-print-page {
        width: 400px !important;
        height: 240px !important;
        max-width: none !important;
        transform: scale(0.472440945);
        transform-origin: top left;
      }
    </style>
  </head>
  <body>${labels}</body>
</html>`;
    document.body.append(frame);
  }

  return (
    <div
      className={`absolute inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center ${
        showTestOutput ? "test-print-active" : ""
      }`}
    >
      <div className="receipt-preview-dialog flex max-h-[90svh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-neutral-200 text-black shadow-2xl">
        <div className="receipt-preview-header flex shrink-0 items-center justify-between px-4 py-3">
          <div>
            <h3 className="text-lg font-semibold">
              {showTestOutput ? "Test printer output" : "Receipt preview"}
            </h3>
            <p className="text-xs text-neutral-500">
              {showTestOutput ? (
                <>
                  {receipts.length} virtual {receipts.length === 1 ? "label" : "labels"} ·
                  NIIMBOT B1 · 50 × 30 mm
                </>
              ) : (
                <>
                  {receipts.length} {receipts.length === 1 ? "drink receipt" : "drink receipts"} · {paperWidth}mm
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close preview"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
              <path d="M6 6l12 12M18 6L6 18" strokeWidth="1.8" />
            </svg>
          </button>
        </div>
        <div className="receipt-preview-body min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <div
            ref={labelsRef}
            className="receipt-preview-labels flex flex-wrap items-start justify-center gap-8 py-2"
          >
            {showTestOutput
              ? receipts.map((receipt, index) => (
                  <TestLabel
                    key={`${receipt.items[0].productId}-${index}`}
                    ticket={receipt}
                    index={index}
                  />
                ))
              : receipts.map((receipt, index) => (
                  <Slip
                    key={`${receipt.items[0].productId}-${index}`}
                    title={`Drink ${index + 1}`}
                    paperWidth={paperWidth}
                  >
                    <BaristaSlip ticket={receipt} />
                  </Slip>
                ))}
          </div>
        </div>
        <div className="receipt-preview-footer flex shrink-0 gap-2 border-t border-neutral-300 bg-white p-4">
          {showTestOutput ? (
            <>
              <button
                type="button"
                onClick={() => setShowTestOutput(false)}
                className="flex-1 rounded-xl border border-neutral-300 py-2.5 text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={printTestLabels}
                className="flex-1 rounded-xl bg-black py-2.5 text-sm text-white"
              >
                Print test labels
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-neutral-300 py-2.5 text-sm"
              >
                Close
              </button>
              {testPrinterEnabled ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setShowTestOutput(true)}
                  className="flex-1 rounded-xl border border-black py-2.5 text-sm disabled:opacity-40"
                >
                  Test print
                </button>
              ) : null}
              <button
                type="button"
                disabled={pending || !printerReady}
                onClick={onPrint}
                className="flex-1 rounded-xl bg-black py-2.5 text-sm text-white disabled:opacity-40"
              >
                {printerReady
                  ? `Print ${receipts.length} ${receipts.length === 1 ? "receipt" : "receipts"}`
                  : "Connect printer to print"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
