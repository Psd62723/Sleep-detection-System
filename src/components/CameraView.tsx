import { useEffect, useRef, useState } from "react";
import { Video } from "lucide-react";

const CameraView = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  
  // Camera device selection states
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  useEffect(() => {
    loadDevices();
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  // Enumerate video devices
  const loadDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === "videoinput");
      setDevices(videoDevices);
      
      const savedDeviceId = localStorage.getItem("selected_camera_device_id");
      if (savedDeviceId && videoDevices.some(d => d.deviceId === savedDeviceId)) {
        setSelectedDeviceId(savedDeviceId);
      } else if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.warn("Failed to enumerate devices:", err);
    }
  };

  const startCamera = async (deviceIdToUse?: string) => {
    try {
      setError("");
      
      const targetDeviceId = deviceIdToUse || selectedDeviceId || localStorage.getItem("selected_camera_device_id") || undefined;

      const constraints: MediaStreamConstraints = {
        video: targetDeviceId
          ? { deviceId: { exact: targetDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Stop old stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }

      // Populate device list (permissions are now granted, labels will be populated)
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === "videoinput");
      setDevices(videoDevices);

      // Save selected device
      const activeTrack = stream.getVideoTracks()[0];
      if (activeTrack) {
        const settings = activeTrack.getSettings();
        if (settings.deviceId) {
          setSelectedDeviceId(settings.deviceId);
          localStorage.setItem("selected_camera_device_id", settings.deviceId);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Camera permission denied or camera not available");
    }
  };

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    localStorage.setItem("selected_camera_device_id", deviceId);
    await startCamera(deviceId);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  return (
    <div style={{ textAlign: "center" }} className="space-y-4">
      <h2>Live Camera</h2>

      {/* Camera device selection dropdown */}
      {devices.length > 0 && (
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/50 border border-border/30 max-w-[640px] mx-auto text-left">
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
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          maxWidth: "640px",
          borderRadius: "12px",
          border: "2px solid #333"
        }}
      />
    </div>
  );
};

export default CameraView;
