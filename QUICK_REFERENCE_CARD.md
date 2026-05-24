# Driver Sleep Alert System - Quick Reference Card

## 🎯 What Was Built

Automatic SMS/call alerts when drivers show critical signs of sleep deprivation during facial analysis.

## 📋 Quick Facts

| Aspect | Details |
|--------|---------|
| **Feature** | Driver Sleep Detection Alerts |
| **Trigger** | Sleep < 5h AND Alertness < 50% |
| **Delivery** | SMS to emergency contact |
| **Rate Limit** | Max 1 alert per 30 minutes |
| **Setup Time** | ~2 minutes |
| **Storage** | Local (localStorage) |
| **Cost** | Free (simulated), ~$0.0075/SMS real |

## 🚀 Getting Started

```
1. Profile Page → Add Emergency Contact → Save
2. Run Analysis with low sleep detection
3. Alert sent automatically to contact
4. See alert status in results
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/services/alertService.ts` | Alert logic & SMS handling |
| `src/pages/FaceAnalysis.tsx` | Alert triggering |
| `src/components/analysis/AnalysisResults.tsx` | Alert display |
| `src/pages/ProfilePage.tsx` | Contact configuration |
| `src/types/types.ts` | Type definitions |
| `src/db/api.ts` | Profile API |

## 🎓 Alert Thresholds

```typescript
CRITICAL: sleep < 5h    AND alertness < 50%  → 🔴 CRITICAL ALERT
WARNING:  sleep 5-6h    AND alertness < 60%  → 🟡 WARNING ALERT
OK:       sleep >= 7h   OR  alertness >= 60% → ✅ NO ALERT
```

## 💾 Data Storage

**Profile Fields:**
```typescript
emergency_contact_number: "+1234567890"
alert_enabled: true
```

**Alert Log:**
```typescript
{
  id: "alert-1716291228",
  timestamp: 1716291228000,
  phone_number: "+1234567890",
  type: "sms",
  message: "⚠️ CRITICAL: Severe sleep...",
  status: "sent"
}
```

## 🔧 Configuration Points

**Alert Thresholds** (`alertService.ts` line 18-23):
```typescript
CRITICAL_SLEEP_HOURS: 5,          // Adjust threshold
CRITICAL_ALERTNESS_SCORE: 50,     // Adjust threshold
WARNING_SLEEP_HOURS: 6,           // Adjust threshold
WARNING_ALERTNESS_SCORE: 60,      // Adjust threshold
RATE_LIMIT_MINUTES: 30,           // Adjust rate limit
```

**Local Storage Keys:**
```typescript
ALERT_HISTORY_KEY = 'DRIVER_ALERT_HISTORY'
LAST_ALERT_TIME_KEY = 'DRIVER_LAST_ALERT_TIME'
```

## 🧪 Testing Commands

**Check Alert History:**
```javascript
// In browser console (F12)
const alerts = localStorage.getItem('DRIVER_ALERT_HISTORY');
console.log(JSON.parse(alerts));
```

**Check Last Alert Time:**
```javascript
const lastTime = localStorage.getItem('DRIVER_LAST_ALERT_TIME');
const now = Date.now();
const minutesElapsed = (now - lastTime) / (1000 * 60);
console.log(`Minutes since last alert: ${minutesElapsed}`);
```

**Clear History:**
```javascript
localStorage.removeItem('DRIVER_ALERT_HISTORY');
localStorage.removeItem('DRIVER_LAST_ALERT_TIME');
```

## 📞 Twilio Integration (When Ready)

**Steps:**
1. Create Twilio account → Get credentials
2. Create backend endpoint `/api/send-sms`
3. Update `.env` with Twilio config
4. Uncomment API calls in `alertService.ts`
5. Deploy and test

**Example SMS Cost:**
- 100 alerts/month = ~$0.75/month

## 🎨 UI Components

### Profile Settings
```
📱 Emergency Contact Number: [___________]
🔔 Enable Sleep Alerts [Toggle: ON/OFF]
   [Save Changes]
```

### Analysis Results (Alert Sent)
```
🔔 Alert Sent
Emergency alert sent to +1234567890
```

## 🔐 Security Notes

- ✅ Phone stored locally only
- ✅ No images transmitted
- ✅ Rate limiting prevents abuse
- ✅ Alerts are optional
- ✅ User controls enable/disable

## 📊 Integration Checklist

- [x] Alert service created
- [x] Profile fields added
- [x] FaceAnalysis component updated
- [x] AnalysisResults component updated
- [x] ProfilePage form updated
- [x] Type definitions extended
- [x] API support added
- [x] Documentation complete
- [ ] Twilio integration (next step)
- [ ] Backend endpoint (next step)
- [ ] Production deployment

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Alert not sending | Check profile settings, verify emergency contact |
| Can't find Profile page | Click username → Profile in top nav |
| Alert history empty | Run analysis, check localStorage |
| Rate limit error | Wait 30 min before next alert |
| No alert despite low sleep | Check alert toggle is ON |

## 📚 Documentation Files

| File | Content |
|------|---------|
| `DRIVER_ALERT_FEATURE.md` | Complete technical docs |
| `ALERT_SETUP_GUIDE.md` | User-friendly setup |
| `ALERT_IMPLEMENTATION_SUMMARY.md` | High-level overview |
| `TWILIO_INTEGRATION_GUIDE.md` | SMS/call setup guide |
| `IMPLEMENTATION_CHECKLIST.md` | Verification checklist |
| `QUICK_REFERENCE_CARD.md` | This file! |

## 🚦 Status Indicators

| Icon | Meaning |
|------|---------|
| 🟢 | Ready for use |
| 🟡 | Needs testing |
| 🔴 | Critical alert sent |
| ⏳ | In progress |
| ✅ | Completed |
| ⏸️ | Rate limited |

## 💡 Pro Tips

1. **Test without SMS**: Use console logs to verify alerts work
2. **Monitor Battery**: Frequent facial analysis uses camera power
3. **Validate Numbers**: Use format `+1234567890` for SMS
4. **Check Timezone**: Timestamps in milliseconds (UTC)
5. **Review Logs**: Always check browser console (F12) for errors

## 🎯 Next Steps

**Short-term:**
- [ ] Test alert flow end-to-end
- [ ] Configure real emergency contact
- [ ] Review console logs during testing

**Medium-term:**
- [ ] Set up Twilio account
- [ ] Create backend SMS endpoint
- [ ] Add real SMS integration

**Long-term:**
- [ ] Multi-contact support
- [ ] Email alerts
- [ ] Dashboard for monitoring
- [ ] Fleet management features

## 📈 Metrics to Track

- Alerts sent per day
- False positive rate
- Average response time
- SMS delivery success rate
- User engagement with alerts

## 🔗 Related Features

- Sleep Estimation: `SLEEP_ESTIMATION_FEATURE.md`
- Camera Setup: `CAMERA_IMPLEMENTATION.md`
- Face Analysis: `src/pages/FaceAnalysis.tsx`
- Dashboard: `src/pages/DashboardPage.tsx`

## 💬 Code Snippets

**Check if alert should trigger:**
```typescript
import { alertService } from '@/services/alertService';

const { shouldAlert, level, message } = 
  alertService.shouldTriggerAlert(estimatedSleepHours, alertnessScore);

if (shouldAlert) {
  console.log(`Alert: ${message}`);
}
```

**Get remaining time until next alert:**
```typescript
const minutes = alertService.getMinutesUntilNextAlert();
console.log(`Next alert available in ${minutes} minutes`);
```

**Get alert history:**
```typescript
const history = alertService.getAlertHistory(10);
history.forEach(alert => {
  console.log(`${new Date(alert.timestamp).toLocaleString()}: ${alert.message}`);
});
```

## ✨ Features At a Glance

✅ Automatic sleep detection  
✅ Emergency contact configuration  
✅ Smart alert triggering  
✅ Rate limiting (prevents spam)  
✅ Alert history tracking  
✅ User-friendly UI  
✅ Type-safe implementation  
✅ Comprehensive documentation  
✅ Ready for Twilio integration  
⏳ Real SMS/call support (needs backend)  

## 📞 Support

**For developers:**
- Check `DRIVER_ALERT_FEATURE.md` for technical details
- Review `TWILIO_INTEGRATION_GUIDE.md` for SMS setup

**For users:**
- Read `ALERT_SETUP_GUIDE.md` for setup instructions
- Check FAQ section for common questions

---

**Remember:** This is a safety feature designed to prevent accidents. Always prioritize driver safety!

*Last Updated: May 21, 2026*
