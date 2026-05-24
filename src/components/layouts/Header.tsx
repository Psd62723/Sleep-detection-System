import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Activity, User, LogOut, Shield, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: Activity },
    { path: '/analysis', label: 'Analysis', icon: Activity },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const NavLinks = () => (
    <>
      {navLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.path}
            to={link.path}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              isActive(link.path)
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Icon className="h-4 w-4" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">Sleep Analysis</span>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-2">
              <NavLinks />
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="hidden md:flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Welcome, {profile?.username || 'User'}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {profile?.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer flex items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="outline" size="icon">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="flex flex-col gap-4 mt-8">
                    <div className="px-4 py-2">
                      <p className="text-sm font-medium">Welcome</p>
                      <p className="text-sm text-muted-foreground">{profile?.username || 'User'}</p>
                    </div>
                    <nav className="flex flex-col gap-2">
                      <NavLinks />
                      {profile?.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 px-4 py-2 rounded-md text-foreground hover:bg-accent"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Shield className="h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                    </nav>
                    <Button onClick={() => signOut()} variant="outline" className="mt-4">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
