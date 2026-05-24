import { lsGet, lsSet, KEYS } from '@/lib/localStore';
import type {
  Profile,
  SleepRecord,
  AnalysisResult,
  SleepRecordFormData,
  ProfileUpdateData,
  PublicProfile,
} from '@/types';

// Centralised dummy user ID for local-first operations
const DUMMY_USER_ID = 'dummy-user-id';

// Profile API - 100% Local Storage, No Database Calls
export const profileApi = {
  // Get current user profile
  async getCurrentProfile(): Promise<Profile | null> {
    const localProfile = lsGet<Profile | null>(KEYS.PROFILE, null);
    if (localProfile) {
      return localProfile;
    }

    // Default Fallback Profile if not present
    const fallbackProfile: Profile = {
      id: DUMMY_USER_ID,
      username: 'admin',
      full_name: 'System Admin',
      email: 'admin@miaoda.com',
      age: 28,
      role: 'admin',
      emergency_contact_number: null,
      alert_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    lsSet(KEYS.PROFILE, fallbackProfile);
    return fallbackProfile;
  },

  // Update current user profile
  async updateProfile(updates: ProfileUpdateData): Promise<Profile> {
    const current = await this.getCurrentProfile() || {
      id: DUMMY_USER_ID,
      username: 'admin',
      full_name: 'System Admin',
      email: 'admin@miaoda.com',
      age: 28,
      role: 'admin',
      emergency_contact_number: null,
      alert_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Profile;

    const updated = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    } as Profile;

    lsSet(KEYS.PROFILE, updated);
    return updated;
  },

  // Get all profiles (admin only)
  async getAllProfiles(): Promise<Profile[]> {
    const profile = await this.getCurrentProfile();
    return profile ? [profile] : [];
  },

  // Update user role (admin only)
  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
    const profile = await this.getCurrentProfile();
    if (profile && profile.id === userId) {
      await this.updateProfile({ role } as any);
    }
  },

  // Get public profile
  async getPublicProfile(userId: string): Promise<PublicProfile | null> {
    const profile = await this.getCurrentProfile();
    if (profile && profile.id === userId) {
      return {
        id: profile.id,
        username: profile.username,
        role: profile.role,
      };
    }
    return null;
  },
};

// Sleep Records API - 100% Local Storage, No Database Calls
export const sleepRecordsApi = {
  // Get user's sleep records
  async getUserSleepRecords(limit = 30): Promise<SleepRecord[]> {
    const records = lsGet<SleepRecord[]>(KEYS.SLEEP_RECORDS, []);
    return records
      .sort((a, b) => new Date(b.sleep_date).getTime() - new Date(a.sleep_date).getTime())
      .slice(0, limit);
  },

  // Get sleep statistics
  async getSleepStatistics(): Promise<{averageSleepHours: number; totalRecords: number; last7DaysAverage: number}> {
    const records = lsGet<SleepRecord[]>(KEYS.SLEEP_RECORDS, []);
    const totalRecords = records.length;
    const averageSleepHours = totalRecords > 0
      ? records.reduce((sum, r) => sum + Number(r.sleep_hours), 0) / totalRecords
      : 0;
    
    const sorted = [...records].sort((a, b) => new Date(b.sleep_date).getTime() - new Date(a.sleep_date).getTime());
    const last7Days = sorted.slice(0, 7);
    const last7DaysAverage = last7Days.length > 0
      ? last7Days.reduce((sum, r) => sum + Number(r.sleep_hours), 0) / last7Days.length
      : 0;

    return {
      averageSleepHours: Math.round(averageSleepHours * 100) / 100,
      totalRecords,
      last7DaysAverage: Math.round(last7DaysAverage * 100) / 100,
    };
  },

  // Create sleep record
  async createSleepRecord(record: SleepRecordFormData): Promise<SleepRecord> {
    const newRecord = {
      id: crypto.randomUUID(),
      user_id: DUMMY_USER_ID,
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as SleepRecord;
    
    const existing = lsGet<SleepRecord[]>(KEYS.SLEEP_RECORDS, []);
    lsSet(KEYS.SLEEP_RECORDS, [newRecord, ...existing]);
    return newRecord;
  },

  // Update sleep record
  async updateSleepRecord(id: string, updates: Partial<SleepRecordFormData>): Promise<SleepRecord> {
    const existing = lsGet<SleepRecord[]>(KEYS.SLEEP_RECORDS, []);
    const index = existing.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Record not found");
    
    const updated = { ...existing[index], ...updates, updated_at: new Date().toISOString() };
    existing[index] = updated;
    lsSet(KEYS.SLEEP_RECORDS, existing);
    return updated;
  },

  // Delete sleep record
  async deleteSleepRecord(id: string): Promise<void> {
    const existing = lsGet<SleepRecord[]>(KEYS.SLEEP_RECORDS, []);
    const filtered = existing.filter((r) => r.id !== id);
    lsSet(KEYS.SLEEP_RECORDS, filtered);
  },
};

// Analysis Results API - 100% Local Storage, No Database Calls
export const analysisApi = {
  // Get user's analysis results
  async getUserAnalysisResults(limit = 20): Promise<AnalysisResult[]> {
    const results = lsGet<AnalysisResult[]>(KEYS.ANALYSIS_RESULTS, []);
    return results
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  },

  // Create analysis result
  async createAnalysisResult(
    analysisType: 'face' | 'hrv' | 'driving',
    fatigueLevel: number,
    alertnessScore: number,
    recommendedRestMinutes: number,
    estimatedSleepHours?: number,
    sessionDuration?: number,
    alertCount?: number,
    rawData?: Record<string, unknown>
  ): Promise<AnalysisResult> {
    const payload = {
      user_id: DUMMY_USER_ID,
      analysis_type: analysisType,
      fatigue_level: fatigueLevel,
      alertness_score: alertnessScore,
      recommended_rest_minutes: recommendedRestMinutes,
      estimated_sleep_hours: estimatedSleepHours || null,
      session_duration: sessionDuration || null,
      alert_count: alertCount || null,
      raw_data: rawData || null,
    };

    const newResult = {
      id: crypto.randomUUID(),
      ...payload,
      created_at: new Date().toISOString(),
    } as unknown as AnalysisResult;
    
    const existing = lsGet<AnalysisResult[]>(KEYS.ANALYSIS_RESULTS, []);
    lsSet(KEYS.ANALYSIS_RESULTS, [newResult, ...existing]);
    return newResult;
  },

  // Get latest analysis
  async getLatestAnalysis(): Promise<AnalysisResult | null> {
    const results = await this.getUserAnalysisResults(1);
    return results.length > 0 ? results[0] : null;
  },

  // Get analysis statistics
  async getAnalysisStatistics(): Promise<{
    averageFatigueLevel: number;
    averageAlertnessScore: number;
    totalAnalyses: number;
    totalAlerts: number;
  }> {
    const results = lsGet<AnalysisResult[]>(KEYS.ANALYSIS_RESULTS, []);
    const totalAnalyses = results.length;
    const averageFatigueLevel = totalAnalyses > 0
      ? results.reduce((sum, r) => sum + Number(r.fatigue_level), 0) / totalAnalyses
      : 0;
    const averageAlertnessScore = totalAnalyses > 0
      ? results.reduce((sum, r) => sum + Number(r.alertness_score), 0) / totalAnalyses
      : 0;
    const totalAlerts = results.reduce((sum, r) => sum + (Number(r.alert_count) || 0), 0);

    return {
      averageFatigueLevel: Math.round(averageFatigueLevel),
      averageAlertnessScore: Math.round(averageAlertnessScore),
      totalAnalyses,
      totalAlerts,
    };
  },
};
