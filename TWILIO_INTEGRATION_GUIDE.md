# Twilio Integration Guide - SMS/Call Alerts

## Overview

This guide explains how to integrate Twilio with the Driver Sleep Detection Alert System to send real SMS and voice call alerts.

## Prerequisites

- Twilio account (free tier available)
- Node.js backend (Express, Next.js, etc.)
- Environment variables configured

## Step 1: Create Twilio Account

### 1.1 Sign Up
1. Go to [twilio.com](https://www.twilio.com)
2. Click "Sign up" and create account
3. Verify email address
4. Choose use case: "Communications - SMS, Voice, etc."

### 1.2 Get Credentials

After signup, you'll get:
```
Account SID:    ACxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token:     your_auth_token_here
Phone Number:   +1234567890  (trial number)
```

Save these securely!

### 1.3 Get a Phone Number

1. Go to Twilio Console → Phone Numbers
2. Click "Get a number"
3. Choose a number (US, UK, etc.)
4. Verify and save

## Step 2: Backend Setup

### 2.1 Install Twilio SDK

```bash
npm install twilio
# or
yarn add twilio
```

### 2.2 Create SMS Endpoint

**File: `server/routes/alerts.ts` (or similar)**

```typescript
import express from 'express';
import twilio from 'twilio';

const router = express.Router();

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS Alert
router.post('/send-sms', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    // Validate phone number format
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Send SMS via Twilio
    const messageResult = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio number
      to: phoneNumber, // Recipient
    });

    console.log(`SMS sent to ${phoneNumber}: ${messageResult.sid}`);

    res.json({
      success: true,
      messageId: messageResult.sid,
      status: messageResult.status,
    });
  } catch (error) {
    console.error('SMS send failed:', error);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
});

// Send Voice Call Alert
router.post('/send-call', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    // Validate phone number
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Create TwiML (Twilio Markup Language) for voice
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(message, { voice: 'alice' }); // TTS voice

    // Initiate call
    const call = await client.calls.create({
      url: `${process.env.BACKEND_URL}/twiml/alert-call`, // Webhook for call
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    console.log(`Call initiated to ${phoneNumber}: ${call.sid}`);

    res.json({
      success: true,
      callId: call.sid,
      status: call.status,
    });
  } catch (error) {
    console.error('Call failed:', error);
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});

// TwiML Response for Calls
router.post('/twiml/alert-call', (req, res) => {
  const { message } = req.body;
  const twiml = new twilio.twiml.VoiceResponse();
  
  twiml.say(message, { voice: 'alice' });
  twiml.say('Press any key to acknowledge this alert.');
  twiml.gather({ numDigits: 1 });

  res.type('text/xml');
  res.send(twiml.toString());
});

export default router;
```

### 2.3 Add Routes to Server

**In your main server file (e.g., `server.ts`):**

```typescript
import alertRoutes from './routes/alerts';

app.use('/api/alerts', alertRoutes);
```

## Step 3: Environment Variables

### 3.1 Backend `.env` File

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Frontend
VITE_ALERT_API_URL=http://localhost:3000/api/alerts
BACKEND_URL=http://localhost:3000
```

### 3.2 Frontend `.env` File

```bash
VITE_ALERT_API_URL=https://your-api.com/api/alerts
```

## Step 4: Update Frontend Alert Service

### 4.1 Modify `src/services/alertService.ts`

Replace the simulated SMS/call functions:

```typescript
/**
 * Send alert via SMS (Real Twilio)
 */
async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  try {
    const apiUrl = import.meta.env.VITE_ALERT_API_URL;
    
    const response = await fetch(`${apiUrl}/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phoneNumber, 
        message 
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
      
      console.log(`[SMS ALERT SENT] To: ${phoneNumber}, ID: ${result.messageId}`);
      return true;
    }

    throw new Error(result.error || 'Unknown error');
  } catch (error) {
    console.error('[SMS ALERT FAILED]', error);
    
    // Log failed alert
    const alert: AlertLog = {
      id: `alert-${Date.now()}`,
      timestamp: Date.now(),
      phone_number: phoneNumber,
      type: 'sms',
      message,
      status: 'failed',
    };
    this.logAlert(alert);
    
    return false;
  }
}

/**
 * Send alert via Call (Real Twilio)
 */
async sendCall(phoneNumber: string, message: string): Promise<boolean> {
  try {
    const apiUrl = import.meta.env.VITE_ALERT_API_URL;
    
    const response = await fetch(`${apiUrl}/send-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phoneNumber, 
        message 
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
        type: 'call',
        message,
        status: 'sent',
      };

      this.logAlert(alert);
      lsSet(LAST_ALERT_TIME_KEY, Date.now());
      
      console.log(`[CALL ALERT INITIATED] To: ${phoneNumber}, ID: ${result.callId}`);
      return true;
    }

    throw new Error(result.error || 'Unknown error');
  } catch (error) {
    console.error('[CALL ALERT FAILED]', error);
    
    // Log failed alert
    const alert: AlertLog = {
      id: `alert-${Date.now()}`,
      timestamp: Date.now(),
      phone_number: phoneNumber,
      type: 'call',
      message,
      status: 'failed',
    };
    this.logAlert(alert);
    
    return false;
  }
}
```

## Step 5: Testing

### 5.1 Test SMS

```bash
# Using curl
curl -X POST http://localhost:3000/api/alerts/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "message": "Test SMS from Twilio"
  }'

# Response:
{
  "success": true,
  "messageId": "SMxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "queued"
}
```

### 5.2 Test Voice Call

```bash
curl -X POST http://localhost:3000/api/alerts/send-call \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "message": "Critical sleep deprivation alert from driver monitoring system"
  }'

# Response:
{
  "success": true,
  "callId": "CAxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "initiated"
}
```

### 5.3 Test from App

1. Set emergency contact in Profile
2. Enable alerts
3. Run sleep analysis with low sleep hours
4. Check:
   - Phone receives SMS/call
   - Alert logged in localStorage
   - Console shows success message

## Step 6: Production Deployment

### 6.1 Deploy Backend
```bash
# Build and deploy your backend
npm run build
npm run deploy

# Or use your hosting platform (Heroku, AWS, Vercel, etc.)
```

### 6.2 Deploy Frontend
```bash
# Update .env with production API URL
VITE_ALERT_API_URL=https://your-api.com/api/alerts

npm run build
npm run deploy
```

### 6.3 Security Checklist
- [ ] Credentials in `.env` (never commit)
- [ ] API keys validated on backend
- [ ] HTTPS/TLS enabled
- [ ] Rate limiting on backend
- [ ] Input validation on all endpoints
- [ ] Phone numbers verified
- [ ] Logging configured
- [ ] Error handling robust
- [ ] CORS properly configured

## Step 7: Advanced Features

### 7.1 SMS Cost Optimization

```typescript
// Check balance before sending
async checkBalance() {
  const balance = await client.api.accounts(accountSid).balance.fetch();
  console.log(`Balance: $${balance.balance}`);
  
  if (balance.balance < 0.50) {
    console.warn('Low Twilio balance!');
  }
}
```

### 7.2 Delivery Status Webhooks

```typescript
// Handle delivery status updates
router.post('/webhooks/sms-status', (req, res) => {
  const { MessageSid, MessageStatus } = req.body;
  
  console.log(`SMS ${MessageSid} status: ${MessageStatus}`);
  
  // Update database with status
  // 'queued', 'sending', 'sent', 'failed', 'delivered', 'undelivered', 'rejected'
  
  res.sendStatus(200);
});
```

### 7.3 Inbound Message Handling

```typescript
// Handle replies to SMS alerts
router.post('/webhooks/sms-reply', (req, res) => {
  const { From, Body, MessageSid } = req.body;
  
  console.log(`Reply from ${From}: ${Body}`);
  
  // Process acknowledgment
  if (Body.toLowerCase().includes('ack') || Body === '1') {
    console.log('Alert acknowledged!');
  }
  
  res.sendStatus(200);
});
```

## Troubleshooting

### SMS Not Sending
- [ ] Check Twilio balance (must be > $0)
- [ ] Verify phone numbers in E.164 format (+1234567890)
- [ ] Check firewall/CORS settings
- [ ] Review Twilio logs in dashboard
- [ ] Check backend environment variables

### Voice Calls Not Working
- [ ] Verify TwiML URL is correct
- [ ] Check backend is publicly accessible
- [ ] Test webhook endpoint with curl
- [ ] Review Twilio call logs

### High Costs
- [ ] Implement rate limiting (already in place)
- [ ] Check for test numbers
- [ ] Monitor usage in Twilio dashboard
- [ ] Set spending limits in Twilio console

## Cost Estimates

### SMS
- US: ~$0.0075 per SMS
- International: ~$0.02-0.10 per SMS

### Voice Calls
- US: ~$0.012 per minute
- International: ~$0.05-0.15 per minute

### Example: 100 alerts/month
- SMS: 100 × $0.0075 = **$0.75/month**
- Calls: 100 × 2 min × $0.012 = **$2.40/month**

## Resources

- [Twilio Docs](https://www.twilio.com/docs)
- [SMS API Reference](https://www.twilio.com/docs/sms/api)
- [Voice API Reference](https://www.twilio.com/docs/voice/api)
- [Node.js SDK](https://www.twilio.com/docs/libraries/node)
- [TwiML Reference](https://www.twilio.com/docs/voice/twiml)

## Support

For issues:
1. Check Twilio documentation
2. Review error messages in logs
3. Test with Twilio CLI
4. Contact Twilio support

## Next Steps

1. Create Twilio account
2. Get credentials
3. Set up backend endpoint
4. Update environment variables
5. Test SMS/call sending
6. Deploy to production
7. Monitor usage and costs
8. Scale as needed

---

**Note:** The alert system is currently in **simulation mode**. This guide provides everything needed to activate real SMS/call functionality!
