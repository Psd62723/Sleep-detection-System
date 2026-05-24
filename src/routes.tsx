import DashboardPage from './pages/DashboardPage';
import AnalysisPage from './pages/AnalysisPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import NotFound from './pages/NotFound';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Dashboard',
    path: '/',
    element: <DashboardPage />,
  },
  {
    name: 'Analysis',
    path: '/analysis',
    element: <AnalysisPage />,
  },
  {
    name: 'Profile',
    path: '/profile',
    element: <ProfilePage />,
  },
  {
    name: 'Admin',
    path: '/admin',
    element: <AdminPage />,
  },
  {
    name: 'Not Found',
    path: '*',
    element: <NotFound />,
    visible: false,
  },
];

export default routes;
