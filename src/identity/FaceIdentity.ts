/**
 * FaceIdentity.ts
 * ----------------
 * Robust face-based identity separation
 * Uses normalized landmark embeddings + cosine similarity
 * No login, no user ID
 */

const STORAGE_KEY = "sleep_app_known_faces_v2";
const SIMILARITY_THRESHOLD = 0.92; // HIGH = stricter separation

export type FaceEmbedding = number[];

interface StoredFace {
  faceId: string;
  embedding: FaceEmbedding;
}

/* ---------------- UTILS ---------------- */

function loadFaces(): StoredFace[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveFaces(faces: StoredFace[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(faces));
}

/* ---------------- EMBEDDING ---------------- */

/**
 * Use multiple stable landmarks for better separation
 */
const LANDMARK_INDEXES = [
  33, 133, 159, 145,     // left eye
  263, 362, 386, 374,   // right eye
  1, 2, 98,              // nose
  61, 291, 13, 14        // mouth
];

export function createFaceEmbedding(landmarks: any[]): FaceEmbedding {
  const vector: number[] = [];

  LANDMARK_INDEXES.forEach(i => {
    const p = landmarks[i];
    vector.push(p.x, p.y, p.z ?? 0);
  });

  return normalize(vector);
}

/* ---------------- MATH ---------------- */

function normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return v.map(x => x / norm);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

/* ---------------- RESOLVE FACE ---------------- */

export function resolveFaceId(embedding: FaceEmbedding): string {
  const faces = loadFaces();

  let bestMatch: { id: string; score: number } | null = null;

  for (const face of faces) {
    const score = cosineSimilarity(face.embedding, embedding);
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { id: face.faceId, score };
    }
  }

  if (bestMatch && bestMatch.score >= SIMILARITY_THRESHOLD) {
    return bestMatch.id; // SAME FACE
  }

  // NEW FACE
  const newFaceId = `face_${faces.length + 1}`;
  faces.push({ faceId: newFaceId, embedding });
  saveFaces(faces);

  return newFaceId;
}

/* ---------------- DEBUG / RESET ---------------- */

export function resetFaceDatabase() {
  localStorage.removeItem(STORAGE_KEY);
}
