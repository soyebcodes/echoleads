import { isXConfigured } from "@/lib/leads-sources";

export function getExternalScannerUrl(): string | null {
  const url = process.env.PYTHON_API_URL || process.env.PYTHON_BACKEND_URL;
  if (!url) return null;
  return url.replace(/\/$/, "");
}

export function isScannerDelegated(): boolean {
  return !!getExternalScannerUrl();
}

export function isXAvailableForScanning(): boolean {
  return isXConfigured() || isScannerDelegated();
}

export function scannerApiKey(): string | null {
  return process.env.SCANNER_API_KEY || null;
}