import { useState, useEffect } from 'react';
import { Camera, X, Check, RotateCw, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface BarcodeScannerProps {
  onScanComplete: (isbn: string) => void;
  onCancel: () => void;
}

export function BarcodeScanner({ onScanComplete, onCancel }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [scannerInstance, setScannerInstance] = useState<Html5Qrcode | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    setScannerInstance(html5QrCode);

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        }).catch(err => console.error("Failed to stop scanner", err));
      } else {
        try { html5QrCode.clear(); } catch(e) {}
      }
    };
  }, []);

  const handleStartScan = () => {
    setIsScanning(true);
    setErrorText('');
    
    if (scannerInstance) {
      scannerInstance.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13]
        },
        (decodedText) => {
          // Success
          setScannedCode(decodedText);
          setShowSuccess(true);
          setIsScanning(false);
          
          if (scannerInstance.isScanning) {
            scannerInstance.stop().catch(err => console.error("Stop failed", err));
          }

          setTimeout(() => {
            onScanComplete(decodedText);
          }, 1500);
        },
        (errorMessage) => {
          // Internal decoding failures can be safely ignored until a barcode is locked
        }
      ).catch((err) => {
         console.error(err);
         setErrorText("Failed to access camera.");
         setIsScanning(false);
      });
    }
  };

  const handleStopScan = () => {
    if (scannerInstance && scannerInstance.isScanning) {
        scannerInstance.stop().then(() => {
             setIsScanning(false);
        }).catch(err => console.error(err));
    } else {
        setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#C4A672] to-[#8B7355] text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Scan ISBN Barcode</h2>
            <button
              onClick={() => { handleStopScan(); onCancel(); }}
              className="text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Camera View */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-6" style={{ aspectRatio: '4/3' }}>
            
            {/* The html5-qrcode reader needs to be permanently in DOM, just hidden if not scanning to avoid breaking instance */}
            <div 
              id="reader" 
              className={`absolute inset-0 w-full h-full object-cover flex items-center justify-center [&>video]:object-cover [&>video]:w-full [&>video]:h-full ${isScanning && !showSuccess ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
            />

            {!isScanning && !showSuccess && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gray-900 z-20">
                <Camera className="w-16 h-16 mb-4 text-white/60" />
                <p className="text-sm text-white/80">Position the barcode in the frame</p>
              </div>
            )}

            {isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                {/* Scanning overlay */}
                <div className="relative z-10 w-64 h-40 border-4 border-[#C4A672] rounded-lg">
                  <div className="absolute inset-0 border-2 border-dashed border-white/30 rounded-lg animate-pulse" />
                  
                  {/* Scanning line animation */}
                  <div className="absolute left-0 right-0 h-1 bg-[#C4A672] shadow-lg shadow-[#C4A672]/50 animate-scan" />
                </div>

                <p className="text-white mt-6 animate-pulse bg-black/50 px-3 py-1 rounded">
                   {errorText || 'Scanning...'}
                </p>
              </div>
            )}

            {showSuccess && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-600/90 z-20">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-12 h-12 text-white" />
                </div>
                <p className="text-white text-lg">Barcode Scanned!</p>
                <p className="text-white/80 text-sm mt-2">{scannedCode}</p>
              </div>
            )}

            {/* Corner markers */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#C4A672] z-10 pointer-events-none" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#C4A672] z-10 pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#C4A672] z-10 pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#C4A672] z-10 pointer-events-none" />
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="mb-2">Tips for best results:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Ensure good lighting</li>
                  <li>Hold the book steady</li>
                  <li>Position barcode within the frame</li>
                  <li>Keep camera focused</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => { handleStopScan(); onCancel(); }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            {!isScanning && !showSuccess && (
              <Button
                onClick={handleStartScan}
                className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                Start Scanning
              </Button>
            )}
            {isScanning && (
              <Button
                onClick={handleStopScan}
                variant="outline"
                className="flex-1"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </Card>

      <style>{`
        @keyframes scan {
          0% {
            top: 0;
          }
          50% {
            top: 100%;
          }
          100% {
            top: 0;
          }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
