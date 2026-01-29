import { useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FaceAnalysis } from '@/components/analysis/FaceAnalysis';
import { HRVMonitor } from '@/components/analysis/HRVMonitor';
import { AnalysisResults } from '@/components/analysis/AnalysisResults';
import { Camera, Heart } from 'lucide-react';
import type { AnalysisResult } from '@/types';

export default function AnalysisPage() {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'face' | 'hrv'>('face');

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setCurrentAnalysis(result);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sleep Deprivation Analysis</h1>
          <p className="text-muted-foreground">
            Analyze your fatigue level using facial recognition or HRV monitoring
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'face' | 'hrv')} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="face" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Face Analysis
            </TabsTrigger>
            <TabsTrigger value="hrv" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              HRV Monitor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="face" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Facial Recognition Analysis</CardTitle>
                <CardDescription>
                  Uses your device camera to analyze facial features for signs of fatigue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FaceAnalysis onAnalysisComplete={handleAnalysisComplete} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hrv" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Heart Rate Variability Monitor</CardTitle>
                <CardDescription>
                  Uses your device camera and flash to measure HRV (Mobile only)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HRVMonitor onAnalysisComplete={handleAnalysisComplete} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {currentAnalysis && (
          <AnalysisResults result={currentAnalysis} />
        )}
      </div>
    </MainLayout>
  );
}
