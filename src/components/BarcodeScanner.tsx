
import { useEffect, useRef } from 'react';
import Quagga from 'quagga';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Camera, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner = ({ onDetected, onClose }: BarcodeScannerProps) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scannerRef.current) {
      Quagga.init(
        {
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerRef.current,
            constraints: {
              facingMode: "environment",
            },
          },
          decoder: {
            readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"],
          },
        },
        (err) => {
          if (err) {
            toast({
              variant: "destructive",
              title: "Camera Error",
              description: "Could not access camera. Please make sure you've granted permission.",
            });
            return;
          }
          Quagga.start();
        }
      );

      Quagga.onDetected((result) => {
        if (result.codeResult.code) {
          onDetected(result.codeResult.code);
          Quagga.stop();
        }
      });

      return () => {
        Quagga.stop();
      };
    }
  }, [onDetected, toast]);

  return (
    <Card className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-lg font-semibold">Scan Barcode</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <XCircle className="h-6 w-6" />
        </Button>
      </div>
      <div ref={scannerRef} className="flex-1 relative">
        <div className="absolute inset-0 pointer-events-none border-2 border-primary m-12 rounded-lg"></div>
      </div>
    </Card>
  );
};
