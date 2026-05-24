import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Map } from '@/components/ui/map-cn';
import { Camera, CameraOff, AlertCircle, Loader2, Video, ShieldAlert, Volume2, VolumeX, Phone, MessageSquare, Save, Activity } from 'lucide-react';
import { analysisApi, profileApi } from '@/db/api';
import { alertService } from '@/services/alertService';
import { toast } from 'sonner';
import type { AnalysisResult } from '@/types';

interface FaceMeshResults {
  multiFaceLandmarks?: Array<Array<{ x: number; y: number }>>;
}

interface FaceAnalysisProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

// Dynamically load MediaPipe from CDN to bypass Vite bundling/optimization issues
const loadMediaPipe = () => {
  return new Promise<void>((resolve, reject) => {
    if ((window as any).FaceMesh) {
      resolve();
      return;
    }
    
    // Add MediaPipe FaceMesh Script
    const scriptMesh = document.createElement('script');
    scriptMesh.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
    scriptMesh.crossOrigin = 'anonymous';
    scriptMesh.onload = () => {
      resolve();
    };
    scriptMesh.onerror = () => reject(new Error('MediaPipe FaceMesh script load failed'));
    document.head.appendChild(scriptMesh);
  });
};

export function FaceAnalysis({ onAnalysisComplete }: FaceAnalysisProps) {
  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(false);
  const [isFaceMeshLoading, setIsFaceMeshLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Camera device selection states
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Live GPS tracking
  const [gpsCoords, setGpsCoords] = useState<[number, number]>([12.9716, 77.5946]); // default Bangalore

  // Emergency contact setup
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyName, setEmergencyName] = useState('Emergency Contact');
  const [smsLogs, setSmsLogs] = useState<string[]>([]);

  // Live sleep calculation stats
  const [earValue, setEarValue] = useState<number>(0.3);
  const [isDrowsy, setIsDrowsy] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceMeshRef = useRef<any>(null);
  const requestRef = useRef<number | null>(null);
  const closedEyesStartTime = useRef<number | null>(null);
  const sessionTimerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  
  // Web Audio Context for alarm beeps
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<any>(null);

  // Load configuration & GPS coordinates on mount
  useEffect(() => {
    loadDevices();
    
    // Fetch emergency contact preferences
    void loadEmergencyContact();

    // Retrieve live location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoords([position.coords.latitude, position.coords.longitude]);
        },
        (err) => {
          console.warn('GPS access denied or unavailable. Mapping default location.', err);
        }
      );
    }

    return () => {
      stopMonitoring();
    };
  }, []);

  const loadEmergencyContact = async () => {
    const savedPhone = localStorage.getItem('emergency_contact_phone');
    const savedName = localStorage.getItem('emergency_contact_name');
    const profile = await profileApi.getCurrentProfile();

    if (profile?.emergency_contact_number) {
      setEmergencyPhone(profile.emergency_contact_number);
    } else if (savedPhone) {
      setEmergencyPhone(savedPhone);
    }

    if (savedName) setEmergencyName(savedName);
  };

  const saveEmergencyContact = async () => {
    const normalizedPhone = normalizePhoneNumber(emergencyPhone);
    if (!normalizedPhone) {
      toast.error('Enter a valid phone number with country code or 10-digit Indian number.');
      return;
    }

    localStorage.setItem('emergency_contact_phone', normalizedPhone);
    localStorage.setItem('emergency_contact_name', emergencyName);
    await profileApi.updateProfile({
      emergency_contact_number: normalizedPhone,
      alert_enabled: true,
    });
    toast.success('Driver emergency contact saved.');
  };

  // Load available camera devices
  const loadDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
      
      const savedDeviceId = localStorage.getItem('selected_camera_device_id');
      if (savedDeviceId && videoDevices.some(d => d.deviceId === savedDeviceId)) {
        setSelectedDeviceId(savedDeviceId);
      } else if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.warn('Failed to enumerate media devices:', err);
    }
  };

  // Web Audio Alarm controller
  const startAudioAlarm = () => {
    if (isMuted || alarmIntervalRef.current) return;
    
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    alarmIntervalRef.current = setInterval(() => {
      try {
        const ctx = audioCtxRef.current;
        if (!ctx) return;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth'; // piercing sound
        osc.frequency.setValueAtTime(1200, ctx.currentTime); // High pitch alarm
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.05); // High volume
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } catch (e) {
        console.warn('Web Audio playback failed:', e);
      }
    }, 250); // very fast pulses
  };

  const stopAudioAlarm = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  };

  const buildSleepDetectionMetrics = (avgEAR: number, alertCount: number, sessionDuration: number) => {
    const eyeOpenness = Math.round(Math.min(100, Math.max(0, ((avgEAR - 0.08) / 0.22) * 100)));
    const blinkRate = Math.round(Math.min(30, Math.max(8, 18 + (0.18 - avgEAR) * 70)));
    const facialTension = Math.round(Math.min(100, Math.max(0, (0.26 - avgEAR) * 420)));
    const skinTone = Math.round(Math.min(100, Math.max(25, 80 - (avgEAR - 0.12) * 120)));
    const darkCircles = Math.round(Math.min(100, Math.max(10, (0.18 - avgEAR) * 320)));

    return { eyeOpenness, blinkRate, facialTension, skinTone, darkCircles };
  };

  // Dispatch emergency SOS message
  const triggerEmergencySOS = async () => {
    const targetPhone = normalizePhoneNumber(emergencyPhone);
    if (!targetPhone) {
      toast.error('No valid driver emergency number set. Enter and save a valid phone number first.', { duration: 6000 });
      return;
    }

    let sleepEstimateMessage = '';
    try {
      const metrics = buildSleepDetectionMetrics(earValue, alertCount, sessionDuration);
      const estimate = await alertService.getSleepEstimate(metrics);
      sleepEstimateMessage = `\n
Sleep estimate: ${estimate.estimatedSleepHours.toFixed(1)}h (${estimate.alertLevel.toUpperCase()}) - ${estimate.alertMessage}`;
    } catch (err) {
      console.warn('Python sleep estimate failed:', err);
    }

    const message = `EMERGENCY ALERT: Sleep Deprivation app detected that driver has fallen asleep.${sleepEstimateMessage} Location: Lat ${gpsCoords[0].toFixed(5)}, Lng ${gpsCoords[1].toFixed(5)}. Please check immediately!`;
    const smsResult = await alertService.sendSMSWithDetails(targetPhone, message);
    const callResult = await alertService.sendCallWithDetails(targetPhone, message);
    const smsSent = smsResult.success;
    const callSent = callResult.success;
    const logStatus = [
      smsSent ? 'SMS sent' : 'SMS failed',
      callSent ? 'call sent' : 'call failed',
    ].join(', ');
    const log = `[${new Date().toLocaleTimeString()}] ${logStatus} to ${emergencyName} (${targetPhone}): "${message}"`;
    
    setSmsLogs(prev => [log, ...prev]);
    if (smsSent || callSent) {
      toast.error(`Emergency alert sent to ${emergencyName}.`, { duration: 6000 });
    } else {
      toast.error('Emergency SMS/call failed.', {
        description: smsResult.error || callResult.error || 'Check backend/Twilio setup.',
        duration: 8000,
      });
    }
  };

  // EAR calculation helper
  const calculateEAR = (topIdx: number, bottomIdx: number, innerIdx: number, outerIdx: number, landmarks: any[]) => {
    const top = landmarks[topIdx];
    const bottom = landmarks[bottomIdx];
    const inner = landmarks[innerIdx];
    const outer = landmarks[outerIdx];
    
    if (!top || !bottom || !inner || !outer) return 0.3;
    
    const vertical = Math.sqrt(
      Math.pow(top.x - bottom.x, 2) +
      Math.pow(top.y - bottom.y, 2)
    );
    
    const horizontal = Math.sqrt(
      Math.pow(inner.x - outer.x, 2) +
      Math.pow(inner.y - outer.y, 2)
    );
    
    return vertical / horizontal;
  };

  // Start real-time drowsiness monitor
  const startMonitoring = async (deviceIdToUse?: string) => {
    try {
      setError(null);
      setIsFaceMeshLoading(true);

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API not supported in this browser.');
      }

      // Load MediaPipe dynamically
      await loadMediaPipe();

      // Initialize FaceMesh from CDN global constructor
      if (!faceMeshRef.current) {
        const FaceMeshClass = (window as any).FaceMesh;
        if (!FaceMeshClass) {
          throw new Error('MediaPipe FaceMesh constructor not found in window.');
        }

        const faceMesh = new FaceMeshClass({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        faceMesh.onResults(handleFaceMeshResults);
        faceMeshRef.current = faceMesh;
      }

      // Stream Constraints
      const activeDeviceId = deviceIdToUse || selectedDeviceId || localStorage.getItem('selected_camera_device_id') || undefined;
      const constraints: MediaStreamConstraints = {
        video: activeDeviceId
          ? { deviceId: { exact: activeDeviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsActive(true);
      isActiveRef.current = true;
      setIsFaceMeshLoading(false);
      
      // Start session stats
      setAlertCount(0);
      setSessionDuration(0);
      setSmsLogs([]);
      startTimeRef.current = Date.now();

      sessionTimerRef.current = setInterval(() => {
        setSessionDuration(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // Bind stream to video ref
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
              // Start frame loop
              runFrameLoop();
            }).catch(e => console.warn('Video play interrupted:', e));
          };
        }
      }, 200);

    } catch (err: any) {
      console.error('Camera/FaceMesh start failed:', err);
      setError(err?.message || 'Failed to start camera or drowsiness detector.');
      setIsFaceMeshLoading(false);
    }
  };

  // FaceMesh frame process loop with safety check
  const runFrameLoop = () => {
    const process = async () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && faceMeshRef.current) {
        try {
          await faceMeshRef.current.send({ image: videoRef.current });
        } catch (e) {
          console.warn('Frame processing failed:', e);
        }
      }
      if (isActiveRef.current) {
        requestRef.current = requestAnimationFrame(process);
      }
    };
    requestRef.current = requestAnimationFrame(process);
  };

  // Results callback from FaceMesh
  const handleFaceMeshResults = (results: FaceMeshResults) => {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      
      // Calculate Left Eye & Right Eye EAR
      const leftEAR = calculateEAR(386, 374, 362, 263, landmarks);
      const rightEAR = calculateEAR(159, 145, 33, 133, landmarks);
      const avgEAR = (leftEAR + rightEAR) / 2;

      setEarValue(avgEAR);

      // Check if eyes are closed (EAR < 0.16)
      if (avgEAR < 0.16) {
        if (closedEyesStartTime.current === null) {
          closedEyesStartTime.current = Date.now();
        } else {
          const duration = Date.now() - closedEyesStartTime.current;
          // Trigger IMMEDIATELY (100ms threshold instead of 1.5s delay)
          if (duration > 100) {
            setIsDrowsy((prev) => {
              if (!prev) {
                setAlertCount(c => c + 1);
                toast.error('DANGER: SLEEP DETECTED! WAKE UP!', { duration: 3000 });
                void triggerEmergencySOS();
              }
              return true;
            });
            startAudioAlarm();
          }
        }
      } else {
        closedEyesStartTime.current = null;
        setIsDrowsy(false);
        stopAudioAlarm();
      }
    }
  };

  // Stop real-time monitoring
  const stopMonitoring = async () => {
    setIsActive(false);
    isActiveRef.current = false;
    stopAudioAlarm();
    
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }

    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Save result if a session actually ran
    if (sessionDuration > 2) {
      try {
        const peakFatigue = alertCount > 0 ? 98 : Math.round((0.3 - Math.min(0.3, earValue)) * 300);
        const fatigueLevel = Math.max(10, Math.min(99, peakFatigue));
        const alertnessScore = 100 - fatigueLevel;
        const recommendedRestMinutes = alertCount > 0 ? 60 : 0;
        
        const result = await analysisApi.createAnalysisResult(
          'driving',
          fatigueLevel,
          alertnessScore,
          recommendedRestMinutes,
          undefined, // no sleep hours for driver safety
          sessionDuration,
          alertCount,
          {
            avgEAR: earValue,
            alertCount,
            sessionDurationSeconds: sessionDuration,
            timestamp: Date.now()
          }
        );
        
        onAnalysisComplete(result);
        toast.success('Session saved to safety logs');
      } catch (err) {
        console.error('Failed to save session result:', err);
      }
    }

    // Clear stats
    setIsDrowsy(false);
    closedEyesStartTime.current = null;
  };

  // Handle switching camera input
  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    localStorage.setItem('selected_camera_device_id', deviceId);
    if (isActiveRef.current) {
      await stopMonitoring();
      await startMonitoring(deviceId);
    }
  };

  // Toggle Mute Audio Alarm
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      stopAudioAlarm();
    }
  };

  const earPercentage = Math.min(100, Math.max(0, Math.round(((earValue - 0.1) / 0.25) * 100)));
  const liveFatigueLevel = Math.max(10, Math.min(99, Math.round((0.3 - Math.min(0.3, earValue)) * 350)));

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Emergency Contact Form */}
      <div className="bg-slate-900/40 p-4 border border-border/30 rounded-2xl flex flex-col md:flex-row gap-4 items-end justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-red-500" />
              Emergency Contact Name
            </label>
            <Input
              type="text"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              placeholder="e.g. Spouse / Operator"
              className="bg-slate-950 border-border/40 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3 text-indigo-400" />
              Emergency Mobile Number
            </label>
            <Input
              type="text"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="Enter phone number to call/text (use +country code for non-India numbers)"
              className="bg-slate-950 border-border/40 rounded-xl"
            />
          </div>
        </div>
        <Button
          onClick={saveEmergencyContact}
          className="w-full md:w-auto rounded-xl gap-2 font-semibold h-10 bg-indigo-600 hover:bg-indigo-700"
        >
          <Save className="h-4 w-4" />
          Save SOS Contact
        </Button>
      </div>

      {/* Camera device selection dropdown */}
      {devices.length > 0 && (
        <div className="flex flex-col md:flex-row gap-3 p-3 rounded-xl bg-slate-900/50 border border-border/30 justify-between items-center">
          <div className="flex flex-col gap-1.5 w-full md:w-2/3">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Video className="h-3 w-3 text-primary" />
              Select Camera Source
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="w-full bg-slate-900 text-white border border-border/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:border-primary/50 transition-colors"
            >
              {devices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${index + 1} (${device.deviceId.slice(0, 5)}...)`}
                </option>
              ))}
            </select>
          </div>
          
          <Button
            onClick={toggleMute}
            variant="outline"
            className="w-full md:w-auto h-10 px-4 rounded-xl gap-2 font-semibold"
          >
            {isMuted ? (
              <>
                <VolumeX className="h-4 w-4 text-destructive" />
                Muted
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 text-emerald-500" />
                Alarm Sound On
              </>
            )}
          </Button>
        </div>
      )}

      {/* Main Video feed overlayed with drowsiness status */}
      <div className={`relative aspect-video bg-black rounded-2xl overflow-hidden border-4 transition-all duration-300 shadow-2xl ${
        isDrowsy ? 'border-red-600 ring-4 ring-red-600/50 animate-pulse' : 'border-slate-800'
      }`}>
        {isActive ? (
          <>
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full h-full object-cover transform -scale-x-100"
            />
            
            {/* Visual HUD overlay */}
            <div className="absolute top-4 left-4 p-3 bg-slate-950/80 backdrop-blur-md rounded-xl border border-white/10 text-white text-xs space-y-1.5 shadow-lg z-20">
              <p className="font-bold flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5 text-orange-500" />
                Real-Time Telemetry
              </p>
              <p>EAR value: <span className="font-bold font-mono text-indigo-300">{earValue.toFixed(3)}</span></p>
              <p>Alerts Triggered: <span className="font-bold text-red-500 font-mono">{alertCount}</span></p>
              <p>Duration: <span className="font-bold font-mono">{Math.floor(sessionDuration / 60)}m {sessionDuration % 60}s</span></p>
              <p>GPS Coordinates: <span className="font-bold text-emerald-400 font-mono">{gpsCoords[0].toFixed(4)}, {gpsCoords[1].toFixed(4)}</span></p>
            </div>

            {/* Live blinks indicator slider & live fatigue */}
            <div className="absolute bottom-4 left-4 right-4 p-3 bg-slate-950/85 backdrop-blur-md rounded-xl border border-white/10 text-white shadow-lg space-y-2 z-20">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-red-500" />
                  Live Fatigue Level: <span className={liveFatigueLevel > 50 ? 'text-red-400' : 'text-emerald-400'}>{liveFatigueLevel}%</span>
                </span>
                <span>Eye Openness ({earPercentage}%)</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 ${
                    earValue < 0.16 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${earPercentage}%` }}
                />
              </div>
            </div>

            {/* Drowsiness Danger Overlay (Immediate Red SOS Mode) */}
            {isDrowsy && (
              <div className="absolute inset-0 bg-red-950/45 flex items-center justify-center backdrop-blur-sm z-30">
                <div className="bg-red-950/95 border-4 border-red-500 px-6 py-6 rounded-2xl text-center text-white shadow-2xl max-w-sm space-y-4">
                  <div>
                    <AlertCircle className="h-14 w-14 text-red-500 mx-auto mb-2 animate-ping" />
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-red-500">SLEEP DETECTED!</h3>
                    <p className="text-xs text-red-300 font-bold uppercase">Immediate alarm is active</p>
                  </div>
                  
                  {/* Immediate Emergency SOS Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button
                      asChild
                      className="bg-red-600 hover:bg-red-700 font-black h-12 text-white rounded-xl gap-2 animate-bounce shadow-xl"
                    >
                      <a href={`tel:${emergencyPhone}`}>
                        <Phone className="h-5 w-5" />
                        CALL {emergencyName.toUpperCase()}
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="border-orange-500 text-orange-400 hover:bg-orange-500/10 font-bold h-10 rounded-xl gap-2"
                    >
                      <a href={`sms:${emergencyPhone}?body=EMERGENCY! Driver fatigue/sleep detected at GPS Location: ${gpsCoords[0].toFixed(5)}, ${gpsCoords[1].toFixed(5)}`}>
                        <MessageSquare className="h-4 w-4" />
                        SEND SOS SMS
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
            {isFaceMeshLoading ? (
              <div className="space-y-4 flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <div>
                  <p className="text-sm font-bold text-slate-200">Initializing MediaPipe...</p>
                  <p className="text-xs text-muted-foreground">Loading AI models & webcam constraints</p>
                </div>
              </div>
            ) : (
              <>
                <Camera className="h-14 w-14 text-muted-foreground animate-pulse" />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Driver Safety System Inactive</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Click Start Monitoring to begin real-time eye tracking, immediate fatigue calculations, and emergency alerts.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Live Rest Stops Map component */}
      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          🗺️ Live GPS Location & Nearby Rest Areas
        </h3>
        <Map userCoords={gpsCoords} />
      </div>

      {/* Live Emergency Logs */}
      {smsLogs.length > 0 && (
        <div className="bg-slate-900/60 border border-red-500/20 p-4 rounded-2xl space-y-2 max-h-40 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            SOS Dispatch Logs
          </p>
          <div className="space-y-1 font-mono text-xs">
            {smsLogs.map((log, idx) => (
              <p key={idx} className="text-slate-300">{log}</p>
            ))}
          </div>
        </div>
      )}

      {/* Start / Stop Monitoring Buttons */}
      <div className="flex gap-3">
        {!isActive ? (
          <Button
            onClick={() => startMonitoring()}
            disabled={isFaceMeshLoading}
            className="flex-1 rounded-xl h-12 font-bold bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-700 hover:to-indigo-700 shadow-xl"
          >
            <Camera className="mr-2 h-5 w-5" />
            Start Live Monitoring
          </Button>
        ) : (
          <Button
            onClick={stopMonitoring}
            variant="outline"
            className="flex-1 rounded-xl h-12 font-bold border-red-600/30 text-red-500 hover:bg-red-500/5 hover:text-red-600"
          >
            <CameraOff className="mr-2 h-5 w-5" />
            Stop & Save Session
          </Button>
        )}
      </div>

      <Alert className="rounded-xl border-red-500/20 bg-red-500/5">
        <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
        <AlertDescription className="text-xs text-slate-400">
          <strong>Immediate Alarm Active:</strong> If your eyes close, the alarm will sound <strong>instantly</strong> (100ms threshold) and dispatch a mock emergency SMS to your operator containing your GPS coordinates.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function normalizePhoneNumber(phoneNumber: string): string | null {
  const trimmed = phoneNumber.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('+')) {
    const cleaned = `+${trimmed.slice(1).replace(/\D/g, '')}`;
    return cleaned.length >= 8 ? cleaned : null;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length >= 11) {
    return `+${digits}`;
  }

  return null;
}
