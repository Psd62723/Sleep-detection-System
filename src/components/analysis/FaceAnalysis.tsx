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
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please grant camera permissions.');
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
          Position your face in the camera frame. The analysis will detect eye openness, blink rate, and facial tension to assess fatigue levels.
        </AlertDescription>
      </Alert>
    </div>
  );
}
