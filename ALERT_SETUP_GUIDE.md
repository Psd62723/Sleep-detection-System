# Driver Sleep Detection Alert System - Quick Setup Guide

## 🚀 Quick Start (2 minutes)

### Step 1: Set Emergency Contact
1. Click **Profile** in the top right navigation
2. Scroll down to "Driver Alert Settings"
3. Enter your emergency contact number (format: `+1234567890`)
4. Toggle "Enable Sleep Deprivation Alerts" to **ON**
5. Click **Save Changes**

### Step 2: Run Sleep Analysis
1. Go to **Analysis** page
2. Click "Start Camera" for face analysis
3. Position your face in the frame
4. Click "Analyze Now"
5. Wait for analysis to complete (3 seconds)

### Step 3: Check Alert Status
- If sleep deprivation is detected, you'll see:
  - **Alert notification** at the top of results
  - Confirmation message showing the phone number alert was sent to
  - Alert details in the breakdown

## 📊 Understanding Alert Triggers

### When Will I Get an Alert?

**Critical Alert** 🔴
- Estimated sleep hours: **Less than 5 hours**
- Alertness score: **Less than 50%**
- Message: "CRITICAL: Severe sleep deprivation detected..."

**Warning Alert** 🟡
- Estimated sleep hours: **5-6 hours**
- Alertness score: **Less than 60%**
- Message: "WARNING: Moderate sleep deprivation detected..."

**No Alert**
- Sleep hours above thresholds
- Emergency contact not configured
- Alerts disabled in settings

### Important: Rate Limiting
- ⏱️ **Maximum 1 alert per 30 minutes**
- Prevents spam to emergency contact
- Timer shown if trying to send before limit expires

## 🔧 Configuration

### Profile Settings
```
Emergency Contact Number: +1234567890
Alert Enabled: ON/OFF
```

### Alert Thresholds (in code)
Located in `src/services/alertService.ts`:
```typescript
CRITICAL_SLEEP_HOURS: 5
CRITICAL_ALERTNESS_SCORE: 50
WARNING_SLEEP_HOURS: 6
WARNING_ALERTNESS_SCORE: 60
RATE_LIMIT_MINUTES: 30
```

## 📱 Alert Delivery

### Current Status (Development)
- ✅ Alerts logged to browser console
- ✅ Alert history stored locally
- ✅ Ready for SMS/call integration

### SMS/Call Integration (Future)
To enable real SMS/calls:
1. Set up Twilio account (twilio.com)
2. Add Twilio credentials to `.env`
3. Implement `/api/send-sms` backend endpoint
4. Update `src/services/alertService.ts` to use real API

## 🧪 Testing the System

### Test Without Real SMS
1. Open browser **Developer Tools** (F12)
2. Go to **Console** tab
3. Run analysis with low sleep estimation
4. Check console for: `[SMS ALERT] To: +1234567890`

### Test Alert Thresholds
1. Check the fatigue level in results
2. Expected sleep = 8 - (fatigue/20)
3. If sleep < 5 and alertness < 50 → Alert sent

### Test Rate Limiting
1. Send alert once
2. Run analysis immediately after
3. Should see message: "Rate limited - next alert in X minutes"

## 🔐 Privacy & Security

### Your Data
- ✅ Emergency contact stored locally only
- ✅ No facial images saved
- ✅ Only metrics used for decisions
- ✅ Alert history is local only

### Control
- You can disable alerts anytime
- You can clear alert history
- You can change emergency contact anytime
- No data sent to external services (yet)

## ❓ FAQ

**Q: Will the alert send immediately?**
A: Yes! SMS alert sends within seconds if conditions are met.

**Q: Can I disable alerts temporarily?**
A: Yes, toggle "Enable Sleep Deprivation Alerts" OFF in Profile Settings.

**Q: How do I change my emergency contact?**
A: Go to Profile Settings, update the number, click Save Changes.

**Q: What if I enter a wrong phone number?**
A: Update it in Profile Settings. Once enabled, all future alerts use the new number.

**Q: Can I see my alert history?**
A: Currently stored locally. Open browser DevTools → Application → Local Storage → DRIVER_ALERT_HISTORY

**Q: Why did I get two alerts in a row?**
A: Rate limiting allows 1 alert per 30 minutes. If you ran analyses 30+ minutes apart, both triggered.

**Q: What happens if my emergency contact doesn't have SMS?**
A: Alert is still "sent" (logged), but may not deliver. Consider callback numbers or email (future).

**Q: Can I test the alert without driving?**
A: Yes! Just run the analysis. The system simulates facial fatigue detection.

## 🆘 Troubleshooting

### Alert Not Sending
- [ ] Check emergency contact is entered
- [ ] Check alerts are enabled (toggle ON)
- [ ] Check if 30 minutes passed since last alert
- [ ] Check browser console for errors (F12)

### Alert History Not Showing
- [ ] Open DevTools (F12)
- [ ] Go to Application → Local Storage
- [ ] Search for key: `DRIVER_ALERT_HISTORY`
- [ ] View the stored alert logs

### Can't Find Profile Settings
- [ ] Click username in top right
- [ ] Should see "Profile" option
- [ ] Click to open Profile page
- [ ] Scroll down to "Driver Alert Settings"

### Emergency Contact Format
- Use format: `+1234567890`
- Include country code (+1 for US)
- No spaces or dashes
- 10-15 digits total

## 📞 Real SMS Setup (Future)

When ready to enable real SMS alerts:

1. **Create Twilio Account**
   ```bash
   # Visit https://www.twilio.com/
   # Sign up and verify email
   ```

2. **Get Credentials**
   - Account SID
   - Auth Token
   - Phone number (e.g., +1234567890)

3. **Backend Endpoint**
   ```typescript
   // POST /api/send-sms
   // Body: { phoneNumber, message }
   // Response: { success: true, messageId: '...' }
   ```

4. **Update .env**
   ```
   VITE_TWILIO_ACCOUNT_SID=your_sid
   VITE_TWILIO_AUTH_TOKEN=your_token
   VITE_TWILIO_PHONE_NUMBER=+1234567890
   ```

5. **Uncomment in alertService.ts**
   - Lines ~95-100 (SMS)
   - Lines ~130-135 (Call)

## 📚 Related Documentation

- Full Feature Docs: `DRIVER_ALERT_FEATURE.md`
- Sleep Estimation: `SLEEP_ESTIMATION_FEATURE.md`
- Camera Setup: `CAMERA_IMPLEMENTATION.md`

## ✅ Checklist

Before using alerts in production:

- [ ] Profile page working
- [ ] Emergency contact saved
- [ ] Alerts toggle functional
- [ ] Analysis component running
- [ ] Alert thresholds configured
- [ ] Rate limiting working
- [ ] Alert history tracking
- [ ] Console logs verified
- [ ] Ready for Twilio integration

---

**Need Help?** Check the console logs (F12 → Console) for detailed error messages and alert status.
