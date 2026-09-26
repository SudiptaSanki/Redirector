import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, QrCode } from 'lucide-react';

interface QrCodeModalProps {
  url: string;
  slug: string;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ url, slug, onClose }) => {
  const svgRef = useRef<HTMLDivElement>(null);

  const downloadQr = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 32, 32, 448, 448);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `redirector-qr-${slug}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm rounded-2xl glass-panel p-6 border border-slate-800 shadow-2xl text-center relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-slate-100 text-sm">QR Code — /r/{slug}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div ref={svgRef} className="p-5 bg-white rounded-2xl inline-block shadow-inner mb-4">
          <QRCodeSVG value={url} size={200} level="H" />
        </div>

        <p className="text-xs text-slate-400 mb-5 break-all font-mono">
          {url}
        </p>

        <button
          onClick={downloadQr}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/20 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Download High-Res PNG</span>
        </button>
      </div>
    </div>
  );
};
