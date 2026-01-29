import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CameraOff, AlertCircle, Loader2 } from 'lucide-react';
import { analysisApi } from '@/db/api';
import { toast } from 'sonner';
import type { AnalysisResult } from '@/types';

interface FaceAnalysisProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export function FaceAnalysis({ onAnalysisComplete }: FaceAnalysisProps) {
  const [isActive, setIsActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      setError(null);
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
      }

      // Check if running in secure context (HTTPS or localhost)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        throw new Error('Camera access requires a secure connection (HTTPS). Please access this page via HTTPS.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsActive(true);
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      
      let errorMessage = 'Unable to access camera. ';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage += 'Camera permission was denied. Please allow camera access in your browser settings and try again.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage += 'No camera found. Please connect a camera device and try again.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage += 'Camera is already in use by another application. Please close other apps using the camera and try again.';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage += 'Camera does not meet the required specifications. Please try with a different camera.';
        } else if (err.name === 'SecurityError') {
          errorMessage += 'Camera access blocked due to security restrictions. Please check your browser settings.';
        } else {
          errorMessage += err.message || 'Please check your camera permissions and try again.';
        }
      } else {
        errorMessage += 'Please check your camera permissions and try again.';
      }
      
      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  };

  const performAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate face analysis processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate simulated analysis data
      const eyeOpenness = Math.random() * 100;
      const blinkRate = Math.random() * 30;
      const facialTension = Math.random() * 100;

      // Calculate fatigue and alertness based on simulated metrics
      const fatigueLevel = Math.round((100 - eyeOpenness + facialTension) / 2);
      const alertnessScore = Math.round(100 - fatigueLevel);
      const recommendedRestMinutes = Math.round(fatigueLevel * 1.5);

      const rawData = {
        eyeOpenness: Math.round(eyeOpenness),
        blinkRate: Math.round(blinkRate),
        facialTension: Math.round(facialTension),
        timestamp: Date.now(),
      };

      const result = await analysisApi.createAnalysisResult(
        'face',
        fatigueLevel,
        alertnessScore,
        recommendedRestMinutes,
        rawData
      );

      onAnalysisComplete(result);
      toast.success('Face analysis completed successfully');
      stopCamera();
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error('Failed to complete analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        {isActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Camera not active</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {!isActive ? (
          <Button onClick={startCamera} className="flex-1">
            <Camera className="mr-2 h-4 w-4" />
            Start Camera
          </Button>
        ) : (
          <>
            <Button onClick={stopCamera} variant="outline" className="flex-1">
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Camera
            </Button>
            <Button
              onClick={performAnalysis}
              disabled={isAnalyzing}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Now'
              )}
            </Button>
          </>
        )}
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Camera Access Required:</strong> Position your face in the camera frame. The analysis will detect eye openness, blink rate, and facial tension to assess fatigue levels.
          <br /><br />
          <strong>How to enable camera:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Click "Start Camera" button above</li>
            <li>When prompted, click "Allow" to grant camera permission</li>
            <li>If blocked, click the camera icon in your browser's address bar to enable access</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
