import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import type { Results } from "@mediapipe/face_mesh";

import {
  createFaceEmbedding,
  resolveFaceId
} from "@/identity/FaceIdentity";

/**
 * Initialize MediaPipe FaceMesh and attach face identity logic
 */
export function initFaceMesh(
  video: HTMLVideoElement,
  onFaceDetected?: (faceId: string, landmarks: any[]) => void
) {
  const faceMesh = new FaceMesh({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
  });

  faceMesh.onResults((results: Results) => {
    // -------------------------------
    // 🔹 FACE DETECTION + ID RESOLUTION
    // -------------------------------
    if (results.multiFaceLandmarks?.length) {
      const landmarks = results.multiFaceLandmarks[0];

      // 👉 CREATE FACE EMBEDDING
      const embedding = createFaceEmbedding(landmarks);

      // 👉 RESOLVE FACE ID
      const faceId = resolveFaceId(embedding);

      // 👉 STORE ACTIVE FACE
      localStorage.setItem("active_face_id", faceId);

      console.log("Detected faceId:", faceId);

      // Callback for analysis logic
      if (onFaceDetected) {
        onFaceDetected(faceId, landmarks);
      }
    }
  });

  // -------------------------------
  // CAMERA SETUP
  // -------------------------------
  const camera = new Camera(video, {
    onFrame: async () => {
      await faceMesh.send({ image: video });
    },
    width: 640,
    height: 480,
  });

  camera.start();

  return () => {
    camera.stop();
    faceMesh.close();
  };
}
