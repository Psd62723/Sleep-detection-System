import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, Users } from 'lucide-react';
import { profileApi } from '@/db/api';
import { toast } from 'sonner';
import type { Profile } from '@/types';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await profileApi.getAllProfiles();
      setProfiles(data);
    } catch (error) {
      console.error('Failed to load profiles:', error);
      toast.error('Failed to load user profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    setUpdatingUserId(userId);
    try {
      await profileApi.updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      loadProfiles();
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">Manage users and system settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>View and manage user roles</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full bg-muted" />
                <Skeleton className="h-10 w-full bg-muted" />
                <Skeleton className="h-10 w-full bg-muted" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.username}</TableCell>
                        <TableCell>{profile.email || 'N/A'}</TableCell>
                        <TableCell>{profile.full_name || 'N/A'}</TableCell>
                        <TableCell>{profile.age?.toString() || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                            {profile.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(profile.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={profile.role}
                            onValueChange={(value) =>
                              handleRoleChange(profile.id, value as 'user' | 'admin')
                            }
                            disabled={updatingUserId === profile.id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
