import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  Package,
  Wallet,
  Users,
  LogOut,
  DollarSign,
  Gift,
  CheckSquare,
  BarChart3,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const customerMenuItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/packages', icon: Package, label: 'Packages' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: '/referrals', icon: Gift, label: 'Referrals' },
  ];

  const adminMenuItems = [
    { path: '/admin', icon: BarChart3, label: 'Admin' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/packages', icon: Package, label: 'Packages' },
    { path: '/admin/deposits', icon: DollarSign, label: 'Deposits' },
    { path: '/admin/withdrawals', icon: Wallet, label: 'Withdrawals' },
  ];

  const menuItems = user?.is_admin ? adminMenuItems : customerMenuItems;

  return (
    <div className="flex flex-col min-h-screen bg-white-500 dark:bg-white-500 dark:text-white">
      {/* Header */}
      <header className="bg-purple-950 dark:bg-gray-800 shadow-sm border-b sticky top-0 z-30">
        <div className="flex justify-between items-center h-16 px-4">
          <div className="flex items-center">
            <img src="logo1.jpg" alt="" className="w-10" h-10/>
            <span className="ml-2 text-lg font-bold text-white-900 dark:text-white">
              InvestPro
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-right">
              <p className="font-medium">{user?.full_name}</p>
              {!user?.is_admin && (
                <p className="text-green-600 font-semibold text-xs">
                  ${user?.wallet_balance?.toFixed(2) || '0.00'}
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 dark:text-gray-300 hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-Shamrock-700 dark:bg-gray-900 border-t shadow z-40">
        <div className="flex justify-around items-center h-16">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center text-sm px-3 py-1 rounded transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900 dark:text-blue-400'
                    : 'text-gray-800 dark:text-gray-300'
                }`}
              >
                <Icon className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium leading-tight select-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
