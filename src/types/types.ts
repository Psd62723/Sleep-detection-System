// Database types matching SQL schema

export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  username: string;
  email: string | null;
  full_name: string | null;
  age: number | null;
  role: UserRole;
  emergency_contact_number?: string | null;
  alert_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SleepRecord {
  id: string;
  user_id: string;
  sleep_date: string;
  sleep_hours: number;
  sleep_quality: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalysisResult {
  id: string;
  user_id: string;
  analysis_type: 'face' | 'hrv' | 'driving';
  fatigue_level: number;
  alertness_score: number;
  recommended_rest_minutes: number;
  estimated_sleep_hours?: number | null;
  session_duration?: number | null;
  alert_count?: number | null;
  raw_data: Record<string, unknown> | null;
  alert_triggered?: boolean;
  alert_message?: string | null;
  created_at: string;
}

export interface PublicProfile {
  id: string;
  username: string;
  role: UserRole;
}

// Form types
export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  full_name?: string;
  age?: number;
}

export interface SleepRecordFormData {
  sleep_date: string;
  sleep_hours: number;
  sleep_quality?: string;
  notes?: string;
}

export interface ProfileUpdateData {
  full_name?: string;
  age?: number;
  role?: UserRole;
  emergency_contact_number?: string | null;
  alert_enabled?: boolean;
}

// Analysis data types
export interface FaceAnalysisData {
  eyeOpenness: number;
  blinkRate: number;
  facialTension: number;
  timestamp: number;
}

export interface HRVAnalysisData {
  heartRate: number;
  hrvScore: number;
  stressLevel: number;
  timestamp: number;
}
