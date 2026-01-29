import { supabase } from './supabase';
import type {
  Profile,
  SleepRecord,
  AnalysisResult,
  SleepRecordFormData,
  ProfileUpdateData,
  PublicProfile,
} from '@/types';

// Profile API
export const profileApi = {
  // Get current user profile
  async getCurrentProfile(): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Update current user profile
  async updateProfile(updates: ProfileUpdateData): Promise<Profile> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all profiles (admin only)
  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  // Update user role (admin only)
  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  },

  // Get public profile
  async getPublicProfile(userId: string): Promise<PublicProfile | null> {
    const { data, error } = await supabase
      .from('public_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};

// Sleep Records API
export const sleepRecordsApi = {
  // Get user's sleep records
  async getUserSleepRecords(limit = 30): Promise<SleepRecord[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('sleep_records')
      .select('*')
      .eq('user_id', userId)
      .order('sleep_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  // Create sleep record
  async createSleepRecord(record: SleepRecordFormData): Promise<SleepRecord> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('sleep_records')
      .insert({
        user_id: userId,
        ...record,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update sleep record
  async updateSleepRecord(
    id: string,
    updates: Partial<SleepRecordFormData>
  ): Promise<SleepRecord> {
    const { data, error } = await supabase
      .from('sleep_records')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete sleep record
  async deleteSleepRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('sleep_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get sleep statistics
  async getSleepStatistics(): Promise<{
    averageSleepHours: number;
    totalRecords: number;
    last7DaysAverage: number;
  }> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('sleep_records')
      .select('sleep_hours, sleep_date')
      .eq('user_id', userId)
      .order('sleep_date', { ascending: false });

    if (error) throw error;

    const records = Array.isArray(data) ? data : [];
    const totalRecords = records.length;
    const averageSleepHours = totalRecords > 0
      ? records.reduce((sum, r) => sum + Number(r.sleep_hours), 0) / totalRecords
      : 0;

    const last7Days = records.slice(0, 7);
    const last7DaysAverage = last7Days.length > 0
      ? last7Days.reduce((sum, r) => sum + Number(r.sleep_hours), 0) / last7Days.length
      : 0;

    return {
      averageSleepHours: Math.round(averageSleepHours * 100) / 100,
      totalRecords,
      last7DaysAverage: Math.round(last7DaysAverage * 100) / 100,
    };
  },
};

// Analysis Results API
export const analysisApi = {
  // Get user's analysis results
  async getUserAnalysisResults(limit = 20): Promise<AnalysisResult[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  // Create analysis result
  async createAnalysisResult(
    analysisType: 'face' | 'hrv',
    fatigueLevel: number,
    alertnessScore: number,
    recommendedRestMinutes: number,
    estimatedSleepHours?: number,
    rawData?: Record<string, unknown>
  ): Promise<AnalysisResult> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('analysis_results')
      .insert({
        user_id: userId,
        analysis_type: analysisType,
        fatigue_level: fatigueLevel,
        alertness_score: alertnessScore,
        recommended_rest_minutes: recommendedRestMinutes,
        estimated_sleep_hours: estimatedSleepHours || null,
        raw_data: rawData || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get latest analysis
  async getLatestAnalysis(): Promise<AnalysisResult | null> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Get analysis statistics
  async getAnalysisStatistics(): Promise<{
    averageFatigueLevel: number;
    averageAlertnessScore: number;
    totalAnalyses: number;
  }> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('analysis_results')
      .select('fatigue_level, alertness_score')
      .eq('user_id', userId);

    if (error) throw error;

    const results = Array.isArray(data) ? data : [];
    const totalAnalyses = results.length;
    const averageFatigueLevel = totalAnalyses > 0
      ? results.reduce((sum, r) => sum + r.fatigue_level, 0) / totalAnalyses
      : 0;
    const averageAlertnessScore = totalAnalyses > 0
      ? results.reduce((sum, r) => sum + r.alertness_score, 0) / totalAnalyses
      : 0;

    return {
      averageFatigueLevel: Math.round(averageFatigueLevel),
      averageAlertnessScore: Math.round(averageAlertnessScore),
      totalAnalyses,
    };
  },
};
