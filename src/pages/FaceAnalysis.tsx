import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, CameraOff, AlertCircle, Loader2 } from "lucide-react";
import { analysisApi } from "@/db/api";
import { profileApi } from "@/db/api";
import { alertService } from "@/services/alertService";
import { toast } from "sonner";
import type { AnalysisResult } from "@/types";

// 🔹 NEW IMPORTS
import {
  createFaceEmbedding,
  resolveFaceId,
} from "@/identity/FaceIdentity";

interface FaceAnalysisProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export function FaceAnalysis({ onAnalysisComplete }: FaceAnalysisProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // -----------------------------
  // START CAMERA
  // -----------------------------
  const startCamera = async () => {
    try {
      setError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not supported");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setStream(mediaStream);
      setIsActive(true);
    } catch (err: any) {
      setError(err.message || "Camera access failed");
    }
  };

  // -----------------------------
  // STOP CAMERA
  // -----------------------------
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsActive(false);
  };

  // -----------------------------
  // PERFORM ANALYSIS
  // -----------------------------
  const performAnalysis = async () => {
    setIsAnalyzing(true);

    try {
      /**
       * ⚠️ IMPORTANT
       * Replace this `landmarks` variable with your
       * actual MediaPipe FaceMesh landmarks output
       */
      const landmarks: any[] = (window as any).__FACE_LANDMARKS__;

      if (!landmarks) {
        throw new Error("Face landmarks not available");
      }

      // 🔹 NEW FACE ID LOGIC (SAFE)
      const embedding = createFaceEmbedding(landmarks);
      const faceId = resolveFaceId(embedding);

      // ---- Simulated metrics (your existing logic) ----
      const eyeOpenness = Math.random() * 100;
      const blinkRate = Math.random() * 30;
      const facialTension = Math.random() * 100;

      const fatigueLevel = Math.round(
        (100 - eyeOpenness + facialTension) / 2
      );
      const alertnessScore = 100 - fatigueLevel;
      const recommendedRestMinutes = Math.round(fatigueLevel * 1.5);
      const estimatedSleepHours = Math.max(
        2,
        Math.min(8, 8 - fatigueLevel / 20)
      );

      const rawMetrics = {
        eyeOpenness,
        blinkRate,
        facialTension,
      };

      // 🔹 CHECK FOR ALERT TRIGGER
      const alertCheck = alertService.shouldTriggerAlert(
        estimatedSleepHours,
        alertnessScore
      );

      let alertTriggered = false;
      let alertMessage: string | null = null;

      if (alertCheck.shouldAlert && alertService.canSendAlert()) {
        const profile = await profileApi.getCurrentProfile();
        const emergencyNumber = profile?.emergency_contact_number;
        const alertEnabled = profile?.alert_enabled !== false;

        if (emergencyNumber && alertEnabled) {
          // Send SMS alert
          const smsSent = await alertService.sendSMS(
            emergencyNumber,
            alertCheck.message
          );

          if (smsSent) {
            alertTriggered = true;
            alertMessage = `Alert sent to ${emergencyNumber}`;
            toast.error(alertMessage, {
              description: alertCheck.message,
            });
          }
        } else {
          // Show warning even if no emergency contact set
          toast.warning("No emergency contact configured", {
            description:
              "Set an emergency contact number in your profile to receive alerts.",
          });
        }
      }

      // 🔹 STORE RESULT WITH faceId AND ALERT STATUS
      const result = await analysisApi.createAnalysisResult(
        "face",
        fatigueLevel,
        alertnessScore,
        recommendedRestMinutes,
        estimatedSleepHours,
        undefined,
        undefined,
        {
          faceId,
          rawMetrics,
          alertTriggered,
          alertLevel: alertCheck.level,
        }
      );

      // Add alert fields to result
      (result as any).alert_triggered = alertTriggered;
      (result as any).alert_message = alertMessage;

      onAnalysisComplete(result);
      toast.success(`Analysis completed (ID: ${faceId})`);
      stopCamera();
    } catch (err) {
      console.error(err);
      toast.error("Face analysis failed");
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
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Camera className="h-12 w-12 text-muted-foreground" />
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
                "Analyze Now"
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
