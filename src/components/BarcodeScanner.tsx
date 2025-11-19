import { useState, useEffect } from 'react';
import { Camera, X, Check, RotateCw, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface BarcodeScannerProps {
  onScanComplete: (isbn: string) => void;
  onCancel: () => void;
}

export function BarcodeScanner({ onScanComplete, onCancel }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleStartScan = () => {
    setIsScanning(true);
    
    // Simulate barcode scanning
    setTimeout(() => {
      const mockISBN = '978-' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
      setScannedCode(mockISBN);
      setIsScanning(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        onScanComplete(mockISBN);
      }, 1500);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#C4A672] to-[#8B7355] text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Scan ISBN Barcode</h2>
            <button
              onClick={onCancel}
              className="text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Camera View */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-6" style={{ aspectRatio: '4/3' }}>
            {!isScanning && !showSuccess && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <Camera className="w-16 h-16 mb-4 text-white/60" />
                <p className="text-sm text-white/80">Position the barcode in the frame</p>
              </div>
            )}

            {isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* Simulated camera feed */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                
                {/* Scanning overlay */}
                <div className="relative z-10 w-64 h-40 border-4 border-[#C4A672] rounded-lg">
                  <div className="absolute inset-0 border-2 border-dashed border-white/30 rounded-lg animate-pulse" />
                  
                  {/* Scanning line animation */}
                  <div className="absolute left-0 right-0 h-1 bg-[#C4A672] shadow-lg shadow-[#C4A672]/50 animate-scan" />
                </div>

                <p className="text-white mt-6 animate-pulse">Scanning...</p>
              </div>
            )}

            {showSuccess && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-600/20">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-12 h-12 text-white" />
                </div>
                <p className="text-white text-lg">Barcode Scanned!</p>
                <p className="text-white/80 text-sm mt-2">{scannedCode}</p>
              </div>
            )}

            {/* Corner markers */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#C4A672]" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#C4A672]" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#C4A672]" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#C4A672]" />
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
              onClick={onCancel}
              variant="outline"
              className="flex-1"
              disabled={isScanning}
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
                onClick={() => setIsScanning(false)}
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
