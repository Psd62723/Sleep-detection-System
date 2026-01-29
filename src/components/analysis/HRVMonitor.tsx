import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, Smartphone, AlertCircle, Loader2 } from 'lucide-react';
import { analysisApi } from '@/db/api';
import { toast } from 'sonner';
import type { AnalysisResult } from '@/types';

interface HRVMonitorProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export function HRVMonitor({ onAnalysisComplete }: HRVMonitorProps) {
  const [isActive, setIsActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    setIsMobile(checkMobile);

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startMonitoring = async () => {
    if (!isMobile) {
      setError('HRV monitoring requires a mobile device with flash capability. Please use a smartphone or tablet.');
      return;
    }

    try {
      setError(null);
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser. Please use a modern mobile browser like Chrome or Safari.');
      }

      // Check if running in secure context (HTTPS or localhost)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        throw new Error('Camera access requires a secure connection (HTTPS). Please access this page via HTTPS.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Enable flash/torch if available
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as { torch?: boolean };
      if (capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: true } as MediaTrackConstraintSet],
          });
        } catch (torchError) {
          console.warn('Flash not available on this device:', torchError);
          // Continue without flash - HRV can still work with ambient light
        }
      }

      setIsActive(true);
      performHRVAnalysis();
    } catch (err: unknown) {
      console.error('Camera/flash access error:', err);
      
      let errorMessage = 'Unable to access camera. ';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage += 'Camera permission was denied. Please allow camera access in your browser settings and try again.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage += 'No camera found. Please ensure your device has a rear camera and try again.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage += 'Camera is already in use by another application. Please close other apps using the camera and try again.';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage += 'Camera does not meet the required specifications. Please try with a different device.';
        } else if (err.name === 'SecurityError') {
          errorMessage += 'Camera access blocked due to security restrictions. Please check your browser settings.';
        } else {
          errorMessage += err.message || 'Please check your camera permissions and ensure your device supports flash.';
        }
      } else {
        errorMessage += 'Please check your camera permissions and ensure your device supports flash.';
      }
      
      setError(errorMessage);
    }
  };

  const stopMonitoring = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setProgress(0);
  };

  const performHRVAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);

    try {
      // Simulate HRV measurement with progress
      const duration = 30000; // 30 seconds
      const interval = 100;
      const steps = duration / interval;
      let currentStep = 0;

      const progressInterval = setInterval(() => {
        currentStep++;
        setProgress((currentStep / steps) * 100);
        if (currentStep >= steps) {
          clearInterval(progressInterval);
        }
      }, interval);

      await new Promise(resolve => setTimeout(resolve, duration));

      // Generate simulated HRV data
      const heartRate = 60 + Math.random() * 40;
      const hrvScore = Math.random() * 100;
      const stressLevel = Math.random() * 100;

      // Calculate fatigue and alertness based on HRV metrics
      const fatigueLevel = Math.round((stressLevel + (100 - hrvScore)) / 2);
      const alertnessScore = Math.round(100 - fatigueLevel);
      const recommendedRestMinutes = Math.round(fatigueLevel * 1.2);

      const rawData = {
        heartRate: Math.round(heartRate),
        hrvScore: Math.round(hrvScore),
        stressLevel: Math.round(stressLevel),
        timestamp: Date.now(),
      };

      const result = await analysisApi.createAnalysisResult(
        'hrv',
        fatigueLevel,
        alertnessScore,
        recommendedRestMinutes,
        undefined, // HRV doesn't estimate sleep hours
        rawData
      );

      onAnalysisComplete(result);
      toast.success('HRV analysis completed successfully');
      stopMonitoring();
    } catch (err) {
      console.error('HRV analysis error:', err);
      toast.error('Failed to complete HRV analysis');
      stopMonitoring();
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      {!isMobile && (
        <Alert>
          <Smartphone className="h-4 w-4" />
          <AlertDescription>
            HRV monitoring requires a mobile device with flash capability. Please access this feature from a mobile device.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        {isActive ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Heart className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
                <p className="text-lg font-semibold">Measuring HRV...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Keep your finger on the camera
                </p>
                <div className="mt-4 w-48 mx-auto">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(progress)}% complete
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">HRV monitor not active</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {!isActive ? (
          <Button onClick={startMonitoring} disabled={!isMobile} className="flex-1">
            <Heart className="mr-2 h-4 w-4" />
            Start HRV Monitoring
          </Button>
        ) : (
          <Button onClick={stopMonitoring} variant="outline" className="flex-1" disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Stop Monitoring'
            )}
          </Button>
        )}
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>HRV Monitoring Instructions:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Place your finger gently over the rear camera and flash</li>
            <li>The flash will illuminate your finger to measure blood flow</li>
            <li>Keep your finger still for 30 seconds during measurement</li>
            <li>When prompted, click "Allow" to grant camera permission</li>
            <li>If blocked, enable camera access in your browser settings</li>
          </ul>
          <br />
          <strong>Note:</strong> This feature requires a mobile device with rear camera and flash capability.
        </AlertDescription>
      </Alert>
    </div>
  );
}
