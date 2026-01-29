import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Brain, Clock, TrendingUp, Plus } from 'lucide-react';
import { sleepRecordsApi, analysisApi } from '@/db/api';
import { Link } from 'react-router-dom';
import { SleepChart } from '@/components/dashboard/SleepChart';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { SleepRecord, AnalysisResult } from '@/types';

const sleepRecordSchema = z.object({
  sleep_date: z.string().min(1, 'Date is required'),
  sleep_hours: z.coerce.number().min(0).max(24, 'Sleep hours must be between 0 and 24'),
  sleep_quality: z.string().optional(),
  notes: z.string().optional(),
});

type SleepRecordFormData = z.infer<typeof sleepRecordSchema>;

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  const [stats, setStats] = useState({
    averageSleepHours: 0,
    totalRecords: 0,
    last7DaysAverage: 0,
  });
  const [analysisStats, setAnalysisStats] = useState({
    averageFatigueLevel: 0,
    averageAlertnessScore: 0,
    totalAnalyses: 0,
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<SleepRecordFormData>({
    resolver: zodResolver(sleepRecordSchema),
    defaultValues: {
      sleep_date: new Date().toISOString().split('T')[0],
      sleep_hours: 7,
      sleep_quality: '',
      notes: '',
    },
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [records, analysis, sleepStats, analysisStatsData] = await Promise.all([
        sleepRecordsApi.getUserSleepRecords(7),
        analysisApi.getLatestAnalysis(),
        sleepRecordsApi.getSleepStatistics(),
        analysisApi.getAnalysisStatistics(),
      ]);
      setSleepRecords(records);
      setLatestAnalysis(analysis);
      setStats(sleepStats);
      setAnalysisStats(analysisStatsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (data: SleepRecordFormData) => {
    try {
      await sleepRecordsApi.createSleepRecord(data);
      toast.success('Sleep record added successfully');
      setDialogOpen(false);
      form.reset();
      loadData();
    } catch (error) {
      console.error('Failed to create sleep record:', error);
      toast.error('Failed to add sleep record');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sleep Dashboard</h1>
            <p className="text-muted-foreground">Track your sleep patterns and analyze deprivation</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Sleep Record
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Sleep Record</DialogTitle>
                  <DialogDescription>Record your sleep hours for tracking</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="sleep_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sleep_hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sleep Hours</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sleep_quality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sleep Quality (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Good, Fair, Poor" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Any additional notes..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">Add Record</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Button asChild variant="outline">
              <Link to="/analysis">
                <Activity className="mr-2 h-4 w-4" />
                New Analysis
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Sleep Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20 bg-muted" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.averageSleepHours}h</div>
                  <p className="text-xs text-muted-foreground">All time average</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20 bg-muted" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.last7DaysAverage}h</div>
                  <p className="text-xs text-muted-foreground">Recent average</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Fatigue Level</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20 bg-muted" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{analysisStats.averageFatigueLevel}%</div>
                  <p className="text-xs text-muted-foreground">From {analysisStats.totalAnalyses} analyses</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Alertness</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20 bg-muted" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{analysisStats.averageAlertnessScore}%</div>
                  <p className="text-xs text-muted-foreground">Overall score</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sleep Trend (Last 7 Days)</CardTitle>
              <CardDescription>Your recent sleep patterns</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full bg-muted" />
              ) : (
                <SleepChart data={sleepRecords} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest Analysis</CardTitle>
              <CardDescription>Most recent sleep deprivation analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-muted" />
                  <Skeleton className="h-4 w-3/4 bg-muted" />
                  <Skeleton className="h-4 w-1/2 bg-muted" />
                </div>
              ) : latestAnalysis ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Analysis Type:</span>
                    <span className="text-sm capitalize">{latestAnalysis.analysis_type}</span>
                  </div>
                  {latestAnalysis.estimated_sleep_hours && (
                    <div className="flex items-center justify-between p-2 bg-primary/10 rounded">
                      <span className="text-sm font-medium">Estimated Sleep:</span>
                      <span className="text-sm font-bold text-primary">
                        {latestAnalysis.estimated_sleep_hours.toFixed(1)} hours
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Fatigue Level:</span>
                    <span className="text-sm font-bold">{latestAnalysis.fatigue_level}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Alertness Score:</span>
                    <span className="text-sm font-bold">{latestAnalysis.alertness_score}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Recommended Rest:</span>
                    <span className="text-sm">{latestAnalysis.recommended_rest_minutes} min</span>
                  </div>
                  <Button asChild className="w-full mt-4">
                    <Link to="/analysis">Run New Analysis</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No analysis data yet</p>
                  <Button asChild>
                    <Link to="/analysis">Start First Analysis</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
