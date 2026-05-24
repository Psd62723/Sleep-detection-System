import { lsGet, lsSet, KEYS } from '@/lib/localStore';

interface AlertLog {
  id: string;
  timestamp: number;
  phone_number: string;
  type: 'sms' | 'call';
  message: string;
  status: 'sent' | 'failed';
}

interface AlertThresholds {
  CRITICAL_SLEEP_HOURS: number;
  CRITICAL_ALERTNESS_SCORE: number;
  WARNING_SLEEP_HOURS: number;
  WARNING_ALERTNESS_SCORE: number;
  RATE_LIMIT_MINUTES: number;
}

interface AlertSendResult {
  success: boolean;
  error?: string;
}

export interface SleepEstimateRequest {
  eyeOpenness: number;
  blinkRate: number;
  facialTension: number;
  skinTone: number;
  darkCircles: number;
}

export interface SleepEstimateResponse {
  estimatedSleepHours: number;
  fatigueLevel: number;
  alertnessScore: number;
  recommendedRestMinutes: number;
  alertLevel: 'critical' | 'warning' | 'normal';
  alertMessage: string;
}

const ALERT_THRESHOLDS: AlertThresholds = {
  CRITICAL_SLEEP_HOURS: 5,
  CRITICAL_ALERTNESS_SCORE: 50,
  WARNING_SLEEP_HOURS: 6,
  WARNING_ALERTNESS_SCORE: 60,
  RATE_LIMIT_MINUTES: 30,
};

const ALERT_HISTORY_KEY = KEYS.DRIVER_ALERT_HISTORY;
const LAST_ALERT_TIME_KEY = KEYS.DRIVER_LAST_ALERT_TIME;

export const alertService = {
  /**
   * Check if alert should be triggered based on analysis results
   */
  shouldTriggerAlert(sleepHours: number, alertnessScore: number): {
    shouldAlert: boolean;
    level: 'critical' | 'warning' | null;
    message: string;
  } {
    if (
      sleepHours < ALERT_THRESHOLDS.CRITICAL_SLEEP_HOURS &&
      alertnessScore < ALERT_THRESHOLDS.CRITICAL_ALERTNESS_SCORE
    ) {
      return {
        shouldAlert: true,
        level: 'critical',
        message: `⚠️ CRITICAL: Severe sleep deprivation detected (${sleepHours.toFixed(
          1
        )}h sleep, ${alertnessScore.toFixed(1)}% alertness). Driver should rest immediately.`,
      };
    }

    if (
      sleepHours < ALERT_THRESHOLDS.WARNING_SLEEP_HOURS &&
      alertnessScore < ALERT_THRESHOLDS.WARNING_ALERTNESS_SCORE
    ) {
      return {
        shouldAlert: true,
        level: 'warning',
        message: `⚠️ WARNING: Moderate sleep deprivation detected (${sleepHours.toFixed(
          1
        )}h sleep). Recommend rest soon.`,
      };
    }

    return {
      shouldAlert: false,
      level: null,
      message: '',
    };
  },

  /**
   * Check if enough time has passed since last alert (rate limiting)
   */
  canSendAlert(): boolean {
    const lastAlertTime = lsGet<number>(LAST_ALERT_TIME_KEY, 0);
    const now = Date.now();
    const minutesSinceLastAlert = (now - lastAlertTime) / (1000 * 60);

    return minutesSinceLastAlert >= ALERT_THRESHOLDS.RATE_LIMIT_MINUTES;
  },

  /**
   * Send alert via SMS using backend Twilio endpoint
   */
  async sendSMSWithDetails(phoneNumber: string, message: string): Promise<AlertSendResult> {
    try {
      const apiUrl =
        import.meta.env.VITE_ALERT_API_URL || 'http://localhost:3000/api/alerts';

      console.log(`📱 Sending SMS alert to ${phoneNumber}`);

      const response = await fetch(`${apiUrl}/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, message }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || `SMS API responded with ${response.status}`);
      }

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

      console.log(`✅ SMS sent to ${phoneNumber}: ${result.messageId}`);
      return { success: true };
    } catch (error) {
      console.error('SMS Alert failed:', error);
      return { success: false, error: getAlertErrorMessage(error) };
    }
  },

  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    const result = await this.sendSMSWithDetails(phoneNumber, message);
    return result.success;
  },

  /**
   * Send alert via call using backend Twilio endpoint
   */
  async sendCallWithDetails(phoneNumber: string, message: string): Promise<AlertSendResult> {
    try {
      const apiUrl =
        import.meta.env.VITE_ALERT_API_URL || 'http://localhost:3000/api/alerts';

      const response = await fetch(`${apiUrl}/send-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, message }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Call API responded with ${response.status}`);
      }

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

      console.log(`Call sent to ${phoneNumber}: ${result.callId}`);
      return { success: true };
    } catch (error) {
      console.error('Call Alert failed:', error);
      return { success: false, error: getAlertErrorMessage(error) };
    }
  },

  async sendCall(phoneNumber: string, message: string): Promise<boolean> {
    const result = await this.sendCallWithDetails(phoneNumber, message);
    return result.success;
  },

  async getSleepEstimate(metrics: SleepEstimateRequest): Promise<SleepEstimateResponse> {
    try {
      const apiUrl =
        import.meta.env.VITE_ALERT_API_URL || 'http://localhost:3000/api/alerts';

      const response = await fetch(`${apiUrl}/estimate-sleep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Sleep estimate API responded with ${response.status}`);
      }

      return {
        estimatedSleepHours: result.estimatedSleepHours,
        fatigueLevel: result.fatigueLevel,
        alertnessScore: result.alertnessScore,
        recommendedRestMinutes: result.recommendedRestMinutes,
        alertLevel: result.alertLevel,
        alertMessage: result.alertMessage,
      };
    } catch (error) {
      console.error('Sleep estimate request failed:', error);
      throw error;
    }
  },

  /**
   * Log alert to history
   */
  logAlert(alert: AlertLog): void {
    const history = lsGet<AlertLog[]>(ALERT_HISTORY_KEY, []);
    history.push(alert);
    // Keep last 100 alerts
    if (history.length > 100) {
      history.shift();
    }
    lsSet(ALERT_HISTORY_KEY, history);
  },

  /**
   * Get alert history
   */
  getAlertHistory(limit = 50): AlertLog[] {
    const history = lsGet<AlertLog[]>(ALERT_HISTORY_KEY, []);
    return history.slice(-limit).reverse();
  },

  /**
   * Clear alert history
   */
  clearAlertHistory(): void {
    lsSet(ALERT_HISTORY_KEY, []);
  },

  /**
   * Get minutes until next alert can be sent
   */
  getMinutesUntilNextAlert(): number {
    const lastAlertTime = lsGet<number>(LAST_ALERT_TIME_KEY, 0);
    const now = Date.now();
    const minutesSinceLastAlert = (now - lastAlertTime) / (1000 * 60);
    const minutesRemaining =
      ALERT_THRESHOLDS.RATE_LIMIT_MINUTES - minutesSinceLastAlert;

    return Math.max(0, Math.ceil(minutesRemaining));
  },
};

function getAlertErrorMessage(error: unknown): string {
  if (error instanceof TypeError) {
    return 'Backend is not running. Start it with npm run backend.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown alert delivery error.';
}
