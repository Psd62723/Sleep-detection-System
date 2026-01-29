import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Activity, Clock, TrendingUp } from 'lucide-react';
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

  const fatigue = getFatigueLevel(result.fatigue_level);
  const alertness = getAlertnessLevel(result.alertness_score);

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
            {result.fatigue_level > 60 && (
              <li>• Consider taking a break or short nap</li>
            )}
            {result.alertness_score < 50 && (
              <li>• Avoid operating heavy machinery or driving</li>
            )}
            {result.recommended_rest_minutes > 60 && (
              <li>• Plan for adequate sleep tonight</li>
            )}
            <li>• Stay hydrated and maintain regular sleep schedule</li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Analysis completed on {new Date(result.created_at).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
