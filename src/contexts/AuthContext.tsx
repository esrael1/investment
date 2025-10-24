import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<boolean>;
  register: (phone: string, password: string, fullName: string, referralCode?: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const generateReferralCode = () => {
    return 'REF' + Math.random().toString(36).substr(2, 6).toUpperCase();
  };

  const login = async (phone: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .eq('password', password)
        .single();

      if (error || !data) {
        return false;
      }

      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (phone: string, password: string, fullName: string, referralCode?: string): Promise<boolean> => {
    try {
      // Check if phone already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phone)
        .single();

      if (existingUser) {
        return false;
      }

      let referrerId = null;
      if (referralCode) {
        const { data: referrer } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', referralCode)
          .single();
        
        if (referrer) {
          referrerId = referrer.id;
        }
      }

      const newReferralCode = generateReferralCode();

      const { data, error } = await supabase
        .from('users')
        .insert({
          phone,
          password,
          full_name: fullName,
          referral_code: newReferralCode,
          referred_by: referrerId,
        })
        .select()
        .single();

      if (error) {
        console.error('Registration error:', error);
        return false;
      }

      // If user was referred, create referral bonus
      if (referrerId) {
        const bonusAmount = 0; // ETB 0 referral bonus
        
        // Add referral record
        await supabase.from('referrals').insert({
          referrer_id: referrerId,
          referred_id: data.id,
          bonus_amount: bonusAmount,
        });

        // Update referrer's balance
        await supabase.rpc('increment_balance', {
          user_id: referrerId,
          amount: bonusAmount
        });

        // Add transaction record
        await supabase.from('transactions').insert({
          user_id: referrerId,
          type: 'referral_bonus',
          amount: bonusAmount,
          description: `Referral bonus for inviting ${fullName}`,
          reference_id: data.id,
        });
      }

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}