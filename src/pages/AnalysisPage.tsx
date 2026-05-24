import { useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FaceAnalysis } from '@/components/analysis/FaceAnalysis';
import { AnalysisResults } from '@/components/analysis/AnalysisResults';
import { CameraPermissionsGuide } from '@/components/analysis/CameraPermissionsGuide';
import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { AnalysisResult } from '@/types';

export default function AnalysisPage() {
  const [currentAnalysis, setCurrentAnalysis] =
    useState<AnalysisResult | null>(null);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setCurrentAnalysis(result);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sleep Deprivation Analysis</h1>
            <p className="text-muted-foreground">
              Analyze your fatigue level in real-time using driver drowsiness detection
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Info className="mr-2 h-4 w-4" />
                Camera Help
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Camera Permissions Guide</DialogTitle>
                <DialogDescription>
                  Learn how to enable camera access for sleep analysis
                </DialogDescription>
              </DialogHeader>
              <CameraPermissionsGuide />
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Facial Recognition & Driver Drowsiness Detection</CardTitle>
              <CardDescription>
                Uses your device camera and MediaPipe FaceMesh to track blink status and alert if you fall asleep.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FaceAnalysis onAnalysisComplete={handleAnalysisComplete} />
            </CardContent>
          </Card>
        </div>

        {currentAnalysis && <AnalysisResults result={currentAnalysis} />}
      </div>
    </MainLayout>
  );
}
