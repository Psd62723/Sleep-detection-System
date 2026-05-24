import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Plus, ShieldAlert, TrendingUp, Camera, History } from 'lucide-react';
import { sleepRecordsApi, analysisApi } from '@/db/api';
import { lsGet, KEYS } from '@/lib/localStore';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { seedDummyData } from '@/utils/dataSeeder';
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
  const [, setSleepRecords] = useState<SleepRecord[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  const [stats, setStats] = useState({
    averageSleepHours: 0,
    totalRecords: 0,
    last7DaysAverage: 0,
  });
  const [analysisStats, setAnalysisStats] = useState({
    averageFatigueLevel: 0,
    averageAlertnessScore: 0,
    totalAnalyses: 0,
    totalAlerts: 0,
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
      // Synchronous Local-First load to bypass any loader immediately
      const records = lsGet<SleepRecord[]>(KEYS.SLEEP_RECORDS, []);
      const analyses = lsGet<AnalysisResult[]>(KEYS.ANALYSIS_RESULTS, []);
      
      if (records.length > 0) {
        setSleepRecords(records.slice(0, 7));
      }
      if (analyses.length > 0) {
        setAnalysisResults(analyses.slice(0, 10));
        setLatestAnalysis(analyses[0]);
      }
      
      // Compute statistics synchronously from local data immediately
      if (records.length > 0 || analyses.length > 0) {
        // Average sleep hours
        const totalRecords = records.length;
        const averageSleepHours = totalRecords > 0
          ? records.reduce((sum, r) => sum + Number(r.sleep_hours), 0) / totalRecords
          : 0;
        const last7Days = records.slice(0, 7);
        const last7DaysAverage = last7Days.length > 0
          ? last7Days.reduce((sum, r) => sum + Number(r.sleep_hours), 0) / last7Days.length
          : 0;
        setStats({
          averageSleepHours: Math.round(averageSleepHours * 100) / 100,
          totalRecords,
          last7DaysAverage: Math.round(last7DaysAverage * 100) / 100,
        });

        // Analysis stats
        const totalAnalyses = analyses.length;
        const averageFatigueLevel = totalAnalyses > 0
          ? analyses.reduce((sum, r) => sum + Number(r.fatigue_level), 0) / totalAnalyses
          : 0;
        const averageAlertnessScore = totalAnalyses > 0
          ? analyses.reduce((sum, r) => sum + Number(r.alertness_score), 0) / totalAnalyses
          : 0;
        const totalAlerts = analyses.reduce((sum, r) => sum + (Number(r.alert_count) || 0), 0);
        setAnalysisStats({
          averageFatigueLevel: Math.round(averageFatigueLevel),
          averageAlertnessScore: Math.round(averageAlertnessScore),
          totalAnalyses,
          totalAlerts,
        });

        setLoading(false);
      }
      
      // Stage 2: Fast Parallel Fetch
      const results = await Promise.allSettled([
        sleepRecordsApi.getUserSleepRecords(7),
        analysisApi.getUserAnalysisResults(10),
        analysisApi.getLatestAnalysis(),
        sleepRecordsApi.getSleepStatistics(),
        analysisApi.getAnalysisStatistics(),
      ]);

      const r0 = results[0];
      const r1 = results[1];
      const r2 = results[2];
      const r3 = results[3];
      const r4 = results[4];

      if (r0.status === 'fulfilled' && r0.value) {
        setSleepRecords(r0.value as SleepRecord[]);
      }
      if (r1.status === 'fulfilled' && r1.value) {
        setAnalysisResults(r1.value as AnalysisResult[]);
      }
      if (r2.status === 'fulfilled' && r2.value) {
        setLatestAnalysis(r2.value as AnalysisResult | null);
      }
      if (r3.status === 'fulfilled' && r3.value) {
        setStats(r3.value as typeof stats);
      }
      if (r4.status === 'fulfilled' && r4.value) {
        setAnalysisStats(r4.value as typeof analysisStats);
      }
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    seedDummyData();
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
      toast.error('Failed to add sleep record');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 md:p-6">
          <Skeleton className="h-8 sm:h-10 w-40 sm:w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <Skeleton className="h-28 sm:h-32 w-full" />
            <Skeleton className="h-28 sm:h-32 w-full" />
            <Skeleton className="h-28 sm:h-32 w-full" />
            <Skeleton className="h-28 sm:h-32 w-full" />
          </div>
          <Skeleton className="h-[300px] sm:h-[400px] w-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 sm:p-12 text-white shadow-2xl">
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent text-left">
                System Intelligence
              </h1>
              <p className="text-slate-400 text-lg sm:text-xl max-w-md leading-relaxed text-left">
                Real-time physiological telemetry and cognitive performance tracking.
              </p>
              <div className="flex flex-wrap gap-4 mt-8 justify-start">
                <Button asChild size="lg" className="rounded-full px-8 bg-white text-slate-900 hover:bg-slate-200 font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10">
                  <Link to="/analysis" className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Start Scan
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full px-8 border-slate-700 text-white hover:bg-white/5 font-bold transition-all hover:scale-105 active:scale-95">
                  <Link to="/history" className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    History
                  </Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:flex justify-end opacity-10 rotate-12">
              {/* Decorative graphic */}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] -ml-32 -mb-32" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl font-semibold gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg">
                <Plus size={18} />
                Log Sleep
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Sleep Record</DialogTitle>
                <DialogDescription>Enter your sleep details for analysis.</DialogDescription>
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
                        <FormLabel>Hours Slept</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-blue-600">Save Record</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Link to="/analysis">
            <Button className="rounded-xl font-semibold gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg border-none">
              <ShieldAlert size={18} />
              Driving Safety
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="rounded-[2rem] border-0 shadow-lg bg-white dark:bg-slate-900 p-6 flex items-center gap-6 group hover:shadow-2xl transition-all">
            <div className="h-16 w-16 rounded-3xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldAlert className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Safety Scans</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{analysisStats.totalAnalyses}</h3>
            </div>
          </Card>
          
          <Card className="rounded-[2rem] border-0 shadow-lg bg-white dark:bg-slate-900 p-6 flex items-center gap-6 group hover:shadow-2xl transition-all">
            <div className="h-16 w-16 rounded-3xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avg Fatigue Index</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{analysisStats.averageFatigueLevel.toFixed(0)}%</h3>
            </div>
          </Card>

          <Card className="rounded-[2rem] border-0 shadow-lg bg-white dark:bg-slate-900 p-6 flex items-center gap-6 group hover:shadow-2xl transition-all">
            <div className="h-16 w-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alertness Score</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{analysisStats.averageAlertnessScore.toFixed(0)}%</h3>
            </div>
          </Card>
        </div>

        {/* Simplified History Preview */}
        <Card className="rounded-[2.5rem] border-0 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 p-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight">Recent Activity</CardTitle>
              <p className="text-sm text-slate-500">Your latest safety telemetry logs.</p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/history" className="font-bold text-blue-600">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {analysisResults.slice(0, 5).map((result) => (
                <div key={result.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`h-3 w-3 rounded-full ${result.fatigue_level > 50 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white capitalize">{result.analysis_type} Session</p>
                      <p className="text-xs text-slate-500">{new Date(result.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg">{result.alertness_score}%</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Alertness</p>
                  </div>
                </div>
              ))}
              {analysisResults.length === 0 && (
                <div className="p-12 text-center text-slate-500 italic">No activity recorded yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
