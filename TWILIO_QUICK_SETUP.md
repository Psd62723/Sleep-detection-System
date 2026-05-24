# Quick Setup: Real SMS/Call Alerts with Twilio

## Step 1: Get Twilio Credentials

### 1.1 Sign Up for Twilio
1. Go to https://www.twilio.com/try-twilio
2. Sign up (free trial includes $15 credit)
3. Verify email
4. In Twilio Dashboard, get:
   - **Account SID**: ACxxxxxxxxxxxxxxxxxxxxxxxxxx
   - **Auth Token**: your_auth_token_here
   - **Phone Number**: +1234567890 (Twilio assigned)

### 1.2 Buy a Phone Number (Optional)
- If trial ends or you want a specific number
- Go to Twilio Console → Phone Numbers → Buy Numbers
- Choose number for India (+91) or US (+1)
- Cost: ~$1-2 per month

## Step 2: Create Backend Endpoint

### Option A: Express.js (Recommended)

**File: `server.ts` (or `app.ts`)**

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Twilio
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS
app.post('/api/alerts/send-sms', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    // Format Indian phone number
    let formattedNumber = phoneNumber.trim();
    if (!formattedNumber.startsWith('+')) {
      formattedNumber = '+91' + formattedNumber;
    }

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber,
    });

    res.json({
      success: true,
      messageId: result.sid,
      status: result.status,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Send Call
app.post('/api/alerts/send-call', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    let formattedNumber = phoneNumber.trim();
    if (!formattedNumber.startsWith('+')) {
      formattedNumber = '+91' + formattedNumber;
    }

    const call = await client.calls.create({
      url: `${process.env.BACKEND_URL}/api/alerts/twiml`,
      to: formattedNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    res.json({
      success: true,
      callId: call.sid,
      status: call.status,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// TwiML for call
app.post('/api/alerts/twiml', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say('Critical sleep deprivation alert. Driver should rest immediately.');
  res.type('text/xml').send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
```

### Option B: Using Vercel Serverless (Easy)

**File: `api/alerts.ts`**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const { phoneNumber, message, type } = req.body;

    let formattedNumber = phoneNumber.trim();
    if (!formattedNumber.startsWith('+')) {
      formattedNumber = '+91' + formattedNumber;
    }

    if (type === 'sms') {
      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedNumber,
      });

      return res.json({ success: true, messageId: result.sid });
    } else if (type === 'call') {
      const call = await client.calls.create({
        url: `${process.env.BACKEND_URL}/api/twiml`,
        to: formattedNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
      });

      return res.json({ success: true, callId: call.sid });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
```

## Step 3: Update Environment Variables

### `.env` (Backend)

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Server
BACKEND_URL=http://localhost:3000        # For development
# BACKEND_URL=https://your-domain.com   # For production
PORT=3000
```

### `.env` (Frontend)

```bash
# API Configuration
VITE_ALERT_API_URL=http://localhost:3000/api/alerts
# VITE_ALERT_API_URL=https://your-domain.com/api/alerts  # Production
```

## Step 4: Update Frontend Alert Service

**File: `src/services/alertService.ts`** - Replace `sendSMS` function:

```typescript
/**
 * Send SMS Alert - Real Twilio Integration
 */
async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  try {
    const apiUrl = import.meta.env.VITE_ALERT_API_URL;

    console.log(`📱 Sending SMS to ${phoneNumber}...`);

    const response = await fetch(`${apiUrl}/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      const alert: AlertLog = {
        id: `alert-${Date.now()}`,
        timestamp: Date.now(),
        phone_number: phoneNumber,
        type: 'sms',
        message,
        status: 'sent',
      };

      this.logAlert(alert);
      lsSet(LAST_ALERT_TIME_KEY, Date.now());

      console.log(`✅ SMS sent! ID: ${result.messageId}`);
      return true;
    }

    throw new Error(result.error || 'Unknown error');
  } catch (error) {
    console.error('❌ SMS failed:', error);
    return false;
  }
}
```

## Step 5: Install Dependencies

### Backend

```bash
npm install express cors dotenv twilio
npm install -D @types/express @types/node typescript
```

### Frontend (Already installed)

```bash
npm list twilio  # Should already be there
```

## Step 6: Test the Integration

### Test SMS

```bash
curl -X POST http://localhost:3000/api/alerts/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9449659766",
    "message": "Test SMS from driver alert system"
  }'

# Response:
# {"success": true, "messageId": "SMxxxxxxxxx", "status": "queued"}
```

### Test from App

1. **Start Backend**
   ```bash
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   npm run dev
   ```

3. **Go to Profile Page**
   - Enter: `9449659766`
   - Toggle alerts ON
   - Save

4. **Run Analysis**
   - Go to Analysis page
   - Click "Start Camera"
   - Click "Analyze Now"
   - System should detect low sleep
   - SMS should be sent to `9449659766`
   - Check your phone! 📱

## Troubleshooting

### SMS Not Sending?

1. **Check Twilio Balance**
   ```bash
   curl https://api.twilio.com/2010-04-01/Accounts/AC{sid}/Balance.json \
     -u {sid}:{token}
   ```
   Must have positive balance!

2. **Check Credentials**
   ```bash
   # Test in backend console
   console.log(process.env.TWILIO_ACCOUNT_SID);
   console.log(process.env.TWILIO_AUTH_TOKEN);
   console.log(process.env.TWILIO_PHONE_NUMBER);
   ```

3. **Check Phone Number Format**
   - Should be: `9449659766` or `+919449659766`
   - Backend will auto-format to `+919449659766`

4. **Check Twilio Logs**
   - Go to Twilio Console
   - Logs → SMS Logs
   - See if message was attempted

### Call Not Working?

1. **TwiML URL must be public**
   - For development: Use ngrok
   - For production: Use your domain

2. **Test TwiML**
   ```bash
   curl http://localhost:3000/api/alerts/twiml
   ```

### High Costs?

- Rate limiting is enabled (max 1 alert per 30 min)
- Monitor usage in Twilio Dashboard
- Set spending limits in Twilio Console

## Cost Information

**Indian Phone Numbers (+91):**
- Outbound SMS: ₹0.50-1.00 per SMS
- Outbound Calls: ₹2-4 per minute

**Example:** 50 alerts/month = ~₹25-50/month

## Deployment

### Heroku

```bash
heroku create your-app-name
heroku config:set TWILIO_ACCOUNT_SID=AC...
heroku config:set TWILIO_AUTH_TOKEN=...
heroku config:set TWILIO_PHONE_NUMBER=+91...
heroku config:set BACKEND_URL=https://your-app-name.herokuapp.com

git push heroku main
```

### Vercel

```bash
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
vercel env add TWILIO_PHONE_NUMBER
vercel env add BACKEND_URL

vercel --prod
```

## Next Steps

1. ✅ Sign up for Twilio
2. ✅ Get credentials
3. ✅ Create backend endpoint
4. ✅ Update `.env` files
5. ✅ Update frontend alert service
6. ✅ Test SMS sending
7. ✅ Deploy to production

---

**Now SMS/Calls will be sent to your phone! 📱** 🎉
