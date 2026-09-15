import QRCode from "qrcode";

/** Returns a base64 data-URL PNG suitable for direct use in an <img src>. */
export function generateQrCodeDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { margin: 1, width: 320 });
}
