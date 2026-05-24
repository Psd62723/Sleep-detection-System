import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Moon, AlertTriangle } from "lucide-react";

interface ResultSummaryCardProps {
  fatigue: number;
  sleepHours: number;
}

export function ResultSummaryCard({
  fatigue,
  sleepHours,
}: ResultSummaryCardProps) {
  const level =
    fatigue < 40 ? "Good" : fatigue < 60 ? "Moderate" : "High";

  const color =
    fatigue < 40
      ? "text-green-600"
      : fatigue < 60
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="h-5 w-5" />
          Sleep Analysis Summary
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Fatigue Level</p>
          <Progress value={fatigue} className="mt-1" />
          <p className={`mt-2 font-semibold ${color}`}>
            {fatigue}% — {level} Sleep Deprivation
          </p>
        </div>

        <div className="flex justify-between text-sm">
          <span>Estimated Sleep Duration</span>
          <strong>{sleepHours} hrs</strong>
        </div>

        {fatigue > 60 && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertTriangle className="h-4 w-4" />
            Immediate rest recommended
          </div>
        )}
      </CardContent>
    </Card>
  );
}
