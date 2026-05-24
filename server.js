import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn(
    'Twilio is not fully configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your .env file.'
  );
}

const isTwilioConfigured = () => Boolean(accountSid && authToken && twilioPhoneNumber);
const getTwilioClient = () => twilio(accountSid, authToken);
const pythonSleepServiceUrl = process.env.PYTHON_SLEEP_SERVICE_URL || 'http://localhost:8000/sleep-estimate';

const normalizePhoneNumber = (phoneNumber) => {
  const trimmed = phoneNumber?.toString().trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('+')) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
};

app.get('/api/alerts/health', (_req, res) => {
  res.json({
    success: true,
    twilioConfigured: isTwilioConfigured(),
    hasAccountSid: Boolean(accountSid),
    hasAuthToken: Boolean(authToken),
    hasTwilioPhoneNumber: Boolean(twilioPhoneNumber),
    expectedPhoneFormat: '+919449659766',
  });
});

app.post('/api/alerts/send-sms', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    const to = normalizePhoneNumber(phoneNumber);

    if (!to || !message) {
      return res.status(400).json({ success: false, error: 'phoneNumber and message are required' });
    }

    if (!isTwilioConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Twilio is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to .env, then restart npm run backend.',
      });
    }

    const result = await getTwilioClient().messages.create({
      body: message,
      from: twilioPhoneNumber,
      to,
    });

    return res.json({ success: true, messageId: result.sid, status: result.status });
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to send SMS' });
  }
});

app.post('/api/alerts/send-call', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    const to = normalizePhoneNumber(phoneNumber);

    if (!to || !message) {
      return res.status(400).json({ success: false, error: 'phoneNumber and message are required' });
    }

    if (!isTwilioConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Twilio is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to .env, then restart npm run backend.',
      });
    }

    const safeMessage = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const result = await getTwilioClient().calls.create({
      twiml: `<Response><Say voice="alice">${safeMessage}</Say></Response>`,
      from: twilioPhoneNumber,
      to,
    });

    return res.json({ success: true, callId: result.sid, status: result.status });
  } catch (error) {
    console.error('Failed to send call:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to send call' });
  }
});

app.post('/api/alerts/estimate-sleep', async (req, res) => {
  try {
    const { eyeOpenness, blinkRate, facialTension, skinTone, darkCircles } = req.body;

    if (
      eyeOpenness === undefined ||
      blinkRate === undefined ||
      facialTension === undefined ||
      skinTone === undefined ||
      darkCircles === undefined
    ) {
      return res.status(400).json({ success: false, error: 'All sleep estimation fields are required' });
    }

    const response = await fetch(pythonSleepServiceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eyeOpenness, blinkRate, facialTension, skinTone, darkCircles }),
    });

    const payload = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: payload.error || 'Python sleep service error' });
    }

    return res.json({ success: true, ...payload });
  } catch (error) {
    console.error('Sleep estimate routing failed:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to route sleep estimate request' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Twilio backend running on http://localhost:${PORT}`);
});
