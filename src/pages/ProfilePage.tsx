import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi } from '@/db/api';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const profileSchema = z.object({
  full_name: z.string().optional(),
  age: z.coerce.number().min(1).max(150).optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      age: undefined,
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || '',
        age: profile.age || undefined,
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      const updates: { full_name?: string; age?: number } = {};
      if (data.full_name) updates.full_name = data.full_name;
      if (data.age) updates.age = Number(data.age);

      await profileApi.updateProfile(updates);
      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48 bg-muted" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full bg-muted" />
              <Skeleton className="h-10 w-full bg-muted" />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Update your profile details</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={profile.username} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile.email || 'Not set'} disabled className="bg-muted" />
                </div>

                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="Enter your full name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          type="number"
                          placeholder="Enter your age"
                          min="1"
                          max="150"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={profile.role} disabled className="bg-muted capitalize" />
                </div>

                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <Input
                    value={new Date(profile.created_at).toLocaleDateString()}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <Button type="submit" disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
