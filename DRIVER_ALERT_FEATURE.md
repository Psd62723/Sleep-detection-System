# Driver Sleep Detection Alert System

## Overview

The Driver Sleep Detection Alert System is an automated safety feature that sends SMS/call notifications to an emergency contact when critical sleep deprivation is detected during facial analysis. This helps prevent accidents by alerting drivers and their emergency contacts about dangerous fatigue levels.

## Features

### 1. **Automatic Sleep Deprivation Detection**
- Analyzes facial indicators during each analysis
- Calculates estimated sleep hours based on facial metrics
- Detects critical and warning level sleep deprivation

### 2. **Emergency Contact Management**
- Store emergency contact phone number in profile
- Enable/disable alerts from profile settings
- One-time setup in the Profile Settings page

### 3. **Intelligent Alert Triggering**
- **Critical Alert**: Triggered when sleep < 5 hours AND alertness < 50%
- **Warning Alert**: Triggered when sleep 5-6 hours AND alertness < 60%
- **Rate Limiting**: Maximum 1 alert per 30 minutes to prevent spam

### 4. **Alert Delivery**
- SMS notifications to emergency contact
- Alert confirmation displayed to user
- Alert history tracking
- Console logging for debugging

## How It Works

### Setup

1. **Configure Emergency Contact**
   - Go to Profile Settings page
   - Enter emergency contact phone number in "+1234567890" format
   - Toggle "Enable Sleep Deprivation Alerts" to ON
   - Click "Save Changes"

### During Analysis

1. User starts camera and performs face analysis
2. System analyzes facial indicators:
   - Eye openness
   - Blink rate
   - Facial tension
3. System calculates:
   - Fatigue level (0-100%)
   - Alertness score (0-100%)
   - Estimated sleep hours (2-8 hours)
4. System checks alert thresholds
5. If critical/warning detected AND emergency contact configured:
   - SMS sent to emergency contact with alert message
   - Alert status displayed to user
   - Alert logged to history

### Alert Thresholds

```
Critical Level:
  - Sleep Hours: < 5 hours
  - Alertness: < 50%
  - Alert Type: CRITICAL - Severe sleep deprivation

Warning Level:
  - Sleep Hours: 5-6 hours
  - Alertness: < 60%
  - Alert Type: WARNING - Moderate sleep deprivation
```

## User Interface

### Profile Settings
- Emergency Contact Number input field
- Alert Enable/Disable toggle
- Helper text explaining alert functionality

### Analysis Results
- Alert Status badge (if alert was sent)
- Alert confirmation message
- Link to configure emergency contact if not set up

## Alert Messages

### Critical Alert
```
⚠️ CRITICAL: Severe sleep deprivation detected (X.X hours sleep, Y% alertness). 
Driver should rest immediately.
```

### Warning Alert
```
⚠️ WARNING: Moderate sleep deprivation detected (X.X hours sleep). 
Recommend rest soon.
```

## Technical Architecture

### Alert Service (`src/services/alertService.ts`)

```typescript
interface AlertLog {
  id: string;
  timestamp: number;
  phone_number: string;
  type: 'sms' | 'call';
  message: string;
  status: 'sent' | 'failed';
}

// Main methods:
- shouldTriggerAlert() - Check if alert threshold met
- canSendAlert() - Rate limiting check
- sendSMS() - Send SMS alert
- sendCall() - Send call alert (future)
- getAlertHistory() - Retrieve alert logs
- getMinutesUntilNextAlert() - Time until next alert allowed
```

### Data Models

**Profile Type Update:**
```typescript
interface Profile {
  emergency_contact_number?: string | null;
  alert_enabled?: boolean;
  // ... existing fields
}
```

**AnalysisResult Type Update:**
```typescript
interface AnalysisResult {
  alert_triggered?: boolean;
  alert_message?: string | null;
  // ... existing fields
}
```

## Configuration

### Environment Variables (Future - for Twilio)
```
VITE_TWILIO_ACCOUNT_SID=your_account_sid
VITE_TWILIO_AUTH_TOKEN=your_auth_token
VITE_TWILIO_PHONE_NUMBER=+1234567890
```

### Alert Thresholds (in `src/services/alertService.ts`)
```typescript
const ALERT_THRESHOLDS = {
  CRITICAL_SLEEP_HOURS: 5,
  CRITICAL_ALERTNESS_SCORE: 50,
  WARNING_SLEEP_HOURS: 6,
  WARNING_ALERTNESS_SCORE: 60,
  RATE_LIMIT_MINUTES: 30,
};
```

## Production Implementation

### Current Status
- ✅ Alert logic implemented
- ✅ Rate limiting implemented
- ✅ Local storage for alert history
- ⏳ SMS/Call integration (simulated, ready for Twilio)

### To Enable Real SMS/Calls

1. **Set up Twilio Account**
   - Create account at twilio.com
   - Get Account SID, Auth Token, and phone number

2. **Backend Endpoint Required**
   ```typescript
   // POST /api/send-sms
   // POST /api/send-call
   // Must verify emergency contact is valid
   // Must implement rate limiting on server
   ```

3. **Update alertService.ts**
   - Uncomment Twilio API calls
   - Replace simulated sends with real API requests

4. **Add Environment Variables**
   - Configure Twilio credentials in .env

## Testing

### Test Scenarios

1. **No Emergency Contact Set**
   - Run analysis with low sleep hours
   - Should show warning: "No emergency contact configured"
   - No alert sent

2. **Emergency Contact Set, Alerts Enabled**
   - Set emergency contact in profile
   - Run analysis with sleep < 5 hours
   - Should show alert confirmation
   - Check console for alert log

3. **Rate Limiting**
   - Send alert
   - Immediately run another analysis with critical sleep
   - Should show: "Rate limited - next alert in X minutes"

4. **Alerts Disabled**
   - Set emergency contact but disable alerts
   - Run analysis with critical sleep
   - Should show results only, no alert sent

## Privacy & Security

### Data Handling
- ✅ Emergency contact stored in local storage (encrypted by browser)
- ✅ Alert history stored locally
- ✅ No facial images transmitted
- ✅ Only anonymized metrics used for alert decision

### Compliance Considerations
- Inform users about alert sending before collection
- Allow users to disable alerts anytime
- Provide alert history for audit trail
- Respect user preferences

## Troubleshooting

### Alert Not Sending
1. Check if emergency contact is configured
2. Verify alerts are enabled in profile
3. Check browser console for errors
4. Ensure sleep hours < 5 and alertness < 50

### Rate Limiting
- System limits 1 alert per 30 minutes
- Check `getMinutesUntilNextAlert()` for remaining time
- Reduce rate limit in ALERT_THRESHOLDS if needed

### Alert History Not Showing
- Check browser localStorage for alerts
- Clear old history if storage limit reached

## Future Enhancements

### Short-term
- [ ] Email alerts as alternative to SMS
- [ ] Configurable alert thresholds
- [ ] Alert delivery confirmation
- [ ] Customize alert message

### Medium-term
- [ ] Integrate with Twilio for real SMS/calls
- [ ] Multiple emergency contacts
- [ ] Escalating alerts (SMS → Call → Email)
- [ ] Alert scheduling (disable alerts during sleep hours)

### Long-term
- [ ] Integration with vehicle telematics
- [ ] Real-time monitoring dashboard for fleet managers
- [ ] Machine learning for personalized alert thresholds
- [ ] Biometric wearable device integration

## API Integration Points

### Current (Local Storage)
```
✅ Alert history saved to localStorage
✅ Profile settings persisted
✅ Alert decisions made client-side
```

### Ready for Backend Integration
```
⏳ POST /api/send-sms - Send SMS via Twilio
⏳ POST /api/send-call - Send call via Twilio
⏳ POST /api/alerts/log - Log alerts to database
⏳ GET /api/alerts/history - Retrieve alert history
```

## Support

For issues or questions:
1. Check browser console for error logs
2. Verify profile settings are saved
3. Test with manual alert thresholds
4. Review alert history in localStorage

## References

### Related Documentation
- Sleep Estimation Feature: `SLEEP_ESTIMATION_FEATURE.md`
- Camera Implementation: `CAMERA_IMPLEMENTATION.md`
- Profile API: `src/db/api.ts`

### Key Files
- Alert Service: `src/services/alertService.ts`
- FaceAnalysis Component: `src/pages/FaceAnalysis.tsx`
- Profile Page: `src/pages/ProfilePage.tsx`
- Analysis Results: `src/components/analysis/AnalysisResults.tsx`
- Type Definitions: `src/types/types.ts`
