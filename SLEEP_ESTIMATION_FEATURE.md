# Sleep Hour Estimation Based on Facial Analysis

## Overview
The Sleep Deprivation Analysis System now includes an advanced feature to estimate sleep hours based on facial analysis. This feature uses multiple facial indicators to calculate how many hours of sleep a person has likely had.

## How It Works

### Facial Indicators Analyzed
The system analyzes five key facial indicators to estimate sleep hours:

1. **Eye Openness** (0-100%)
   - Measures how wide the eyes are open
   - Lower values indicate droopy, tired eyes
   - Strong indicator of sleep deprivation

2. **Blink Rate** (blinks per minute)
   - Tracks frequency of blinking
   - Excessive blinking can indicate fatigue
   - Normal range: 15-20 blinks/minute

3. **Facial Tension** (0-100%)
   - Measures muscle tension in face
   - Higher tension indicates stress and fatigue
   - Relaxed face suggests adequate rest

4. **Skin Tone** (0-100%)
   - Analyzes skin brightness and health
   - Dull skin indicates poor sleep
   - Healthy glow suggests good rest

5. **Dark Circles** (0-100%)
   - Detects darkness under eyes
   - Strong indicator of sleep deprivation
   - Higher values = more prominent dark circles

### Estimation Algorithm

The sleep hour estimation uses a weighted algorithm:

```
Fatigue Level = (100 - Eye Openness + Facial Tension + Dark Circles) / 3

Estimated Sleep Hours = 8 - (Fatigue Level / 100) × 6 + random_variation

Range: 2-8 hours
```

#### Sleep Quality Categories

| Estimated Hours | Quality | Status | Icon |
|----------------|---------|--------|------|
| 7-8 hours | Good | Adequate sleep | 😊 |
| 6-7 hours | Fair | Mild deficit | 😐 |
| 5-6 hours | Poor | Moderate deficit | 😟 |
| 2-5 hours | Critical | Severe deficit | 😴 |

### Accuracy Considerations

This is a **simulated estimation** for demonstration purposes. In a production system, this would use:

- **Computer Vision**: Real facial landmark detection
- **Machine Learning**: Trained models on sleep-deprived faces
- **Historical Data**: User's sleep patterns and baselines
- **Biometric Sensors**: Additional data from wearables

## Features Implemented

### 1. Database Schema Update
Added `estimated_sleep_hours` column to `analysis_results` table:
```sql
ALTER TABLE public.analysis_results 
ADD COLUMN estimated_sleep_hours numeric(4,2);
```

### 2. Enhanced Face Analysis
Updated `FaceAnalysis.tsx` to:
- Calculate sleep hour estimation
- Include additional facial metrics (skin tone, dark circles)
- Store estimation in database
- Display results to user

### 3. Results Display
Enhanced `AnalysisResults.tsx` with:
- **Prominent Sleep Hours Card**: Large display of estimated hours
- **Sleep Quality Badge**: Visual indicator (Good/Fair/Poor/Critical)
- **Sleep Deficit Warning**: Alert when sleep < 7 hours
- **Personalized Recommendations**: Based on estimated sleep

### 4. Dashboard Integration
Updated `DashboardPage.tsx` to:
- Show estimated sleep hours in latest analysis
- Highlight sleep estimation with primary color
- Quick access to run new analysis

## User Experience

### Analysis Flow
1. User navigates to Analysis page
2. Clicks "Start Camera" for face analysis
3. Positions face in camera frame
4. Clicks "Analyze Now"
5. System processes facial indicators (3 seconds)
6. Results displayed with estimated sleep hours

### Results Display
```
┌─────────────────────────────────────┐
│ 🌙 Estimated Sleep Hours            │
│                                     │
│     5.7 hours    [😟 Poor]         │
│                                     │
│ Based on facial analysis            │
│ ⚠️ Sleep deficit: Need 1.3 more hrs │
└─────────────────────────────────────┘
```

## Recommendations System

The system provides personalized recommendations based on estimated sleep:

### Critical (< 6 hours)
- "Critical: You appear severely sleep deprived. Prioritize rest immediately."
- "Avoid operating heavy machinery or driving until well-rested"

### Fair (6-7 hours)
- "You may be experiencing mild sleep deprivation. Aim for 7-9 hours tonight."
- "Consider taking a short nap (20-30 minutes)"

### Good (7+ hours)
- "Good sleep detected! Maintain your current sleep schedule."
- "Continue healthy sleep habits"

### General Recommendations
- Stay hydrated and maintain regular sleep schedule
- Avoid caffeine 6 hours before bedtime
- Create a relaxing bedtime routine

## Technical Implementation

### Type Definitions
```typescript
export interface AnalysisResult {
  id: string;
  user_id: string;
  analysis_type: 'face' | 'hrv';
  fatigue_level: number;
  alertness_score: number;
  recommended_rest_minutes: number;
  estimated_sleep_hours?: number; // NEW
  raw_data: Record<string, unknown> | null;
  created_at: string;
}
```

### API Update
```typescript
async createAnalysisResult(
  analysisType: 'face' | 'hrv',
  fatigueLevel: number,
  alertnessScore: number,
  recommendedRestMinutes: number,
  estimatedSleepHours?: number, // NEW
  rawData?: Record<string, unknown>
): Promise<AnalysisResult>
```

### Raw Data Structure
```typescript
{
  eyeOpenness: 75,           // 0-100
  blinkRate: 18,             // blinks/min
  facialTension: 45,         // 0-100
  skinTone: 68,              // 0-100
  darkCircles: 52,           // 0-100
  estimatedSleepHours: 5.7,  // hours
  timestamp: 1706543210000   // unix timestamp
}
```

## Future Enhancements

### Short-term
- [ ] Compare estimated vs logged sleep hours
- [ ] Track estimation accuracy over time
- [ ] Add sleep trend analysis
- [ ] Export sleep reports

### Medium-term
- [ ] Integrate real computer vision (TensorFlow.js)
- [ ] Train ML model on actual sleep-deprived faces
- [ ] Add confidence score to estimation
- [ ] Support multiple face angles

### Long-term
- [ ] Integrate with wearable devices
- [ ] Real-time sleep quality monitoring
- [ ] Predictive sleep recommendations
- [ ] Sleep coach AI assistant

## Privacy & Security

### Data Handling
- ✅ All analysis performed locally on device
- ✅ No images or videos stored
- ✅ Only numerical metrics saved to database
- ✅ Camera stream stopped immediately after analysis
- ✅ User data encrypted in transit and at rest

### User Control
- Users can delete analysis results anytime
- Camera access requires explicit permission
- Clear explanation of what data is collected
- Transparent about estimation methodology

## Validation & Testing

### Test Scenarios
1. **Well-rested user**: Should estimate 7-8 hours
2. **Tired user**: Should estimate 5-6 hours
3. **Severely fatigued**: Should estimate 2-4 hours
4. **Multiple analyses**: Should show consistent patterns

### Edge Cases
- Poor lighting conditions
- Glasses or face coverings
- Multiple faces in frame
- Camera quality variations

## Usage Statistics

Track these metrics for improvement:
- Number of face analyses performed
- Average estimated sleep hours
- Correlation with user-logged sleep
- User engagement with recommendations

## Support & Troubleshooting

### Common Issues

**Q: Estimation seems inaccurate**
A: This is a simulated demo. Production version would use real computer vision and ML models trained on actual data.

**Q: Can I compare with my logged sleep?**
A: Future update will add comparison feature between estimated and logged sleep hours.

**Q: Does HRV monitoring estimate sleep?**
A: Currently only face analysis estimates sleep hours. HRV focuses on heart rate variability and stress levels.

**Q: How accurate is the estimation?**
A: Current implementation is for demonstration. Real-world accuracy would depend on ML model training and validation.

## References

### Research Basis
- Sleep deprivation affects facial appearance (Sundelin et al., 2013)
- Dark circles correlate with sleep quality (Freitag & Cestari, 2007)
- Facial features indicate fatigue levels (Shen et al., 2006)

### Technologies
- MediaDevices API for camera access
- Canvas API for image processing (future)
- TensorFlow.js for ML models (future)
- Face-api.js for facial landmarks (future)

## Conclusion

The sleep hour estimation feature enhances the Sleep Deprivation Analysis System by providing users with actionable insights about their sleep patterns based on facial analysis. While currently simulated, the architecture supports future integration with real computer vision and machine learning models for production-grade accuracy.
