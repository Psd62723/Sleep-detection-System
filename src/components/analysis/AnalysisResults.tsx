import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Activity, Clock, TrendingUp, Moon, AlertTriangle } from 'lucide-react';
import type { AnalysisResult } from '@/types';

interface AnalysisResultsProps {
  result: AnalysisResult;
}

export function AnalysisResults({ result }: AnalysisResultsProps) {
  const getFatigueLevel = (level: number) => {
    if (level < 30) return { label: 'Low', color: 'bg-primary' };
    if (level < 60) return { label: 'Moderate', color: 'bg-warning' };
    return { label: 'High', color: 'bg-destructive' };
  };

  const getAlertnessLevel = (score: number) => {
    if (score >= 70) return { label: 'Excellent', color: 'bg-primary' };
    if (score >= 50) return { label: 'Good', color: 'bg-secondary' };
    return { label: 'Low', color: 'bg-destructive' };
  };

  const getSleepQuality = (hours: number) => {
    if (hours >= 7) return { label: 'Good', color: 'bg-primary', icon: '😊' };
    if (hours >= 6) return { label: 'Fair', color: 'bg-warning', icon: '😐' };
    if (hours >= 5) return { label: 'Poor', color: 'bg-destructive', icon: '😟' };
    return { label: 'Critical', color: 'bg-destructive', icon: '😴' };
  };

  const fatigue = getFatigueLevel(result.fatigue_level);
  const alertness = getAlertnessLevel(result.alertness_score);
  const sleepQuality = result.estimated_sleep_hours 
    ? getSleepQuality(result.estimated_sleep_hours)
    : null;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Analysis Results
            </CardTitle>
            <CardDescription>
              {result.analysis_type === 'face' ? 'Facial Recognition' : 'HRV Monitoring'} Analysis
            </CardDescription>
          </div>
          <Badge variant="outline" className="capitalize">
            {result.analysis_type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {result.estimated_sleep_hours && result.analysis_type === 'face' && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-lg">Estimated Sleep Hours</h4>
              </div>
              {sleepQuality && (
                <Badge className={sleepQuality.color}>
                  {sleepQuality.icon} {sleepQuality.label}
                </Badge>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-primary">
                {result.estimated_sleep_hours.toFixed(1)}
              </p>
              <span className="text-lg text-muted-foreground">hours</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Based on facial analysis of fatigue indicators
            </p>
            {result.estimated_sleep_hours < 7 && (
              <div className="flex items-start gap-2 mt-3 p-2 bg-destructive/10 rounded">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">
                  Sleep deficit detected: You may need {(7 - result.estimated_sleep_hours).toFixed(1)} more hours of sleep
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Brain className="h-4 w-4 text-muted-foreground" />
                Fatigue Level
              </span>
              <Badge className={fatigue.color}>{fatigue.label}</Badge>
            </div>
            <Progress value={result.fatigue_level} className="h-2" />
            <p className="text-2xl font-bold">{result.fatigue_level}%</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Alertness Score
              </span>
              <Badge className={alertness.color}>{alertness.label}</Badge>
            </div>
            <Progress value={result.alertness_score} className="h-2" />
            <p className="text-2xl font-bold">{result.alertness_score}%</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Recommended Rest</span>
            </div>
            <p className="text-2xl font-bold">{result.recommended_rest_minutes} min</p>
            <p className="text-xs text-muted-foreground">
              {Math.floor(result.recommended_rest_minutes / 60)}h {result.recommended_rest_minutes % 60}m
            </p>
          </div>
        </div>

        {result.raw_data && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Detailed Metrics
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(result.raw_data).map(([key, value]) => {
                if (key === 'timestamp') return null;
                return (
                  <div key={key} className="space-y-1">
                    <p className="text-xs text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-sm font-semibold">
                      {typeof value === 'number' ? Math.round(value) : String(value)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-accent/50 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-2">Recommendations</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {result.estimated_sleep_hours && result.estimated_sleep_hours < 6 && (
              <li>• <strong>Critical:</strong> You appear severely sleep deprived. Prioritize rest immediately.</li>
            )}
            {result.estimated_sleep_hours && result.estimated_sleep_hours < 7 && result.estimated_sleep_hours >= 6 && (
              <li>• You may be experiencing mild sleep deprivation. Aim for 7-9 hours tonight.</li>
            )}
            {result.fatigue_level > 60 && (
              <li>• Consider taking a break or short nap (20-30 minutes)</li>
            )}
            {result.alertness_score < 50 && (
              <li>• Avoid operating heavy machinery or driving until well-rested</li>
            )}
            {result.recommended_rest_minutes > 60 && (
              <li>• Plan for adequate sleep tonight (7-9 hours recommended)</li>
            )}
            {result.estimated_sleep_hours && result.estimated_sleep_hours >= 7 && (
              <li>• Good sleep detected! Maintain your current sleep schedule.</li>
            )}
            <li>• Stay hydrated and maintain regular sleep schedule</li>
            <li>• Avoid caffeine 6 hours before bedtime</li>
            <li>• Create a relaxing bedtime routine</li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Analysis completed on {new Date(result.created_at).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
