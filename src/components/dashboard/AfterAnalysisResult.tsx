import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Moon, AlertTriangle, BedDouble } from "lucide-react";

interface Props {
  sleepHours: number;
  fatigue: number;
  recommendedRest: number;
}

export function AfterAnalysisResult({
  sleepHours,
  fatigue,
  recommendedRest,
}: Props) {
  const deprivation =
    fatigue < 40 ? "Low" : fatigue < 60 ? "Moderate" : "High";

  const graphData = [
    { name: "Actual Sleep", value: sleepHours },
    { name: "Recommended", value: 8 },
  ];

  return (
    <div className="space-y-6">
      {/* Sleep Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Sleep Duration Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={graphData}>
              <XAxis dataKey="name" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Deprivation Level */}
      <Card>
        <CardHeader>
          <CardTitle>Sleep Deprivation Level</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={fatigue} />
          <p className="text-lg font-semibold">
            {fatigue}% – <span className="text-red-600">{deprivation}</span>
          </p>
        </CardContent>
      </Card>

      {/* Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5" />
            Suggestions & Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>🛌 **Recommended Sleep:** 7–8 hours</p>
          <p>😴 **Your Sleep:** {sleepHours} hours</p>
          <p>⏸️ **Recommended Rest:** {recommendedRest} minutes</p>

          {fatigue > 60 && (
            <p className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              High fatigue detected. Immediate rest advised.
            </p>
          )}

          <ul className="list-disc list-inside text-muted-foreground mt-2">
            <li>Avoid screens before sleep</li>
            <li>Sleep early and consistently</li>
            <li>Take a short nap if needed</li>
            <li>Stay hydrated</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
