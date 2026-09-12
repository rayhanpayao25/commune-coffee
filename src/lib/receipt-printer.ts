"use client";

import { useCallback, useEffect, useState } from "react";
import {
  encodeOrderSlips,
  sampleTicket,
  type PaperWidth,
  type ReceiptTicket,
} from "@/lib/escpos";

const WIDTH_KEY = "commune_receipt_width";
const BAUD_RATE = 9600;

export type PrinterStatus = "unsupported" | "disconnected" | "connected";

export type ReceiptPrinter = {
  supported: boolean;
  connected: boolean;
  status: PrinterStatus;
  paperWidth: PaperWidth;
  setPaperWidth: (width: PaperWidth) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  print: (ticket: ReceiptTicket) => Promise<void>;
  testPrint: () => Promise<void>;
};

let activePort: SerialPort | null = null;

function serialAvailable(): boolean {
  return typeof navigator !== "undefined" && "serial" in navigator;
}

function readWidth(): PaperWidth {
  if (typeof window === "undefined") return 80;
  return window.localStorage.getItem(WIDTH_KEY) === "58" ? 58 : 80;
}

async function openPort(port: SerialPort) {
  if (!port.writable) {
    await port.open({ baudRate: BAUD_RATE, bufferSize: 4096 });
  }
  try {
    await port.setSignals({ dataTerminalReady: true, requestToSend: true });
  } catch {
    // Some USB printers do not expose modem signals.
  }
  activePort = port;
}

async function closePort() {
  const port = activePort;
  activePort = null;
  if (!port) return;
  try {
    await port.close();
  } catch {
    // Already closed.
  }
}

async function writeBytes(data: Uint8Array) {
  const port = activePort;
  if (!port?.writable) {
    throw new Error("Receipt printer is not connected.");
  }
  const writer = port.writable.getWriter();
  try {
    await writer.write(data);
  } finally {
    writer.releaseLock();
  }
}

export function useReceiptPrinter(): ReceiptPrinter {
  const [status, setStatus] = useState<PrinterStatus>("disconnected");
  const [paperWidth, setPaperWidthState] = useState<PaperWidth>(80);

  useEffect(() => {
    if (!serialAvailable()) {
      setStatus("unsupported");
      return;
    }
    setPaperWidthState(readWidth());
    let cancelled = false;
    navigator.serial
      .getPorts()
      .then(async (ports) => {
        const port = ports[0];
        if (!port || cancelled) return;
        await openPort(port);
        if (!cancelled) setStatus("connected");
      })
      .catch(() => {
        if (!cancelled) setStatus("disconnected");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPaperWidth = useCallback((width: PaperWidth) => {
    setPaperWidthState(width);
    window.localStorage.setItem(WIDTH_KEY, String(width));
  }, []);

  const connect = useCallback(async () => {
    if (!serialAvailable()) {
      throw new Error("Use Chrome or Edge on the POS computer to connect a USB printer.");
    }
    const port = await navigator.serial.requestPort();
    await closePort();
    await openPort(port);
    setStatus("connected");
  }, []);

  const disconnect = useCallback(async () => {
    const port = activePort;
    await closePort();
    if (port) {
      try {
        await port.forget();
      } catch {
        // Older Chromium builds may not support forget().
      }
    }
    setStatus(serialAvailable() ? "disconnected" : "unsupported");
  }, []);

  const print = useCallback(
    async (ticket: ReceiptTicket) => {
      for (const copy of encodeOrderSlips(ticket, paperWidth)) {
        await writeBytes(copy);
      }
    },
    [paperWidth],
  );

  const testPrint = useCallback(async () => {
    for (const copy of encodeOrderSlips(sampleTicket(), paperWidth)) {
      await writeBytes(copy);
    }
  }, [paperWidth]);

  return {
    supported: status !== "unsupported",
    connected: status === "connected",
    status,
    paperWidth,
    setPaperWidth,
    connect,
    disconnect,
    print,
    testPrint,
  };
}
