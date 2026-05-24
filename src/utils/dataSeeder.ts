import { SLEEP_SAMPLES } from './sampleData';
import { lsGet, lsSet, KEYS } from '@/lib/localStore';
import type { SleepRecord, AnalysisResult, Profile } from '@/types';

export function seedDummyData() {
  const userId = 'dummy-user-id';
  
  // Check if data already exists in localStore
  const existingSleep = lsGet<SleepRecord[]>(KEYS.SLEEP_RECORDS, []);
  const existingAnalysis = lsGet<AnalysisResult[]>(KEYS.ANALYSIS_RESULTS, []);
  
  if (existingSleep.length > 0 && existingAnalysis.length > 0) return;

  console.log('Seeding dummy data for dashboard demo...');

  // Seed Sleep Records
  const sleepRecords = SLEEP_SAMPLES.map((sample, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    return {
      id: `seed-sleep-${index}`,
      user_id: userId,
      sleep_date: date.toISOString().split('T')[0],
      sleep_hours: sample.sleep_hours,
      sleep_quality: sample.sleep_quality,
      notes: 'Sample sleep data for system calibration',
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
    } as SleepRecord;
  });

  // Seed Analysis Results
  const analysisResults = SLEEP_SAMPLES.map((sample, index) => {
    const date = new Date();
    date.setHours(date.getHours() - (index * 4)); // Scans every 4 hours roughly
    
    // Calculate fatigue from eye metrics
    const fatigueLevel = Math.round(100 - (sample.eye_aspect_ratio * 200) + (sample.blink_rate_per_min / 2));
    const clampedFatigue = Math.max(10, Math.min(95, fatigueLevel));
    
    return {
      id: `seed-analysis-${index}`,
      user_id: userId,
      analysis_type: index % 2 === 0 ? 'face' : 'hrv',
      fatigue_level: clampedFatigue,
      alertness_score: 100 - clampedFatigue,
      recommended_rest_minutes: Math.round(clampedFatigue * 1.5),
      raw_data: {
        eyeOpenness: sample.eye_aspect_ratio * 100,
        blinkRate: sample.blink_rate_per_min,
        heartRate: 60 + Math.round(Math.random() * 40),
        stressLevel: Math.round(clampedFatigue * 0.8),
        drowsinessLevel: clampedFatigue,
      },
      created_at: date.toISOString(),
    } as unknown as AnalysisResult;
  });

  lsSet(KEYS.SLEEP_RECORDS, sleepRecords);
  lsSet(KEYS.ANALYSIS_RESULTS, analysisResults);
  
  // Also update dummy profile to look "established"
  const profile = lsGet<Profile | null>(KEYS.PROFILE, null);
  if (profile) {
     profile.full_name = 'Admin Demo User';
     profile.age = 28;
     lsSet(KEYS.PROFILE, profile);
  }
}
