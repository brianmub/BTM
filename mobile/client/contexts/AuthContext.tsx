import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { storage, User, UserRole } from "@/lib/storage";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = await storage.getUser();
      setUser(savedUser);
      // Check onboarding status from user object (comes from backend)
      setIsOnboardingComplete(savedUser?.isOnboardingComplete === true);
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newUser: User) => {
    await storage.setUser(newUser);
    setUser(newUser);
    setIsOnboardingComplete(newUser.isOnboardingComplete === true);
  };

  const logout = async () => {
    await storage.clearAll();
    setUser(null);
    setIsOnboardingComplete(false);
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      //Update backend
      await storage.updateUser(user.id, { isOnboardingComplete: true });

      // Update local user object
      const updatedUser = { ...user, isOnboardingComplete: true };
      await storage.setUser(updatedUser);
      setUser(updatedUser);
      setIsOnboardingComplete(true);
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      throw error;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    await storage.setUser(updatedUser);
    setUser(updatedUser);
    if ('isOnboardingComplete' in updates) {
      setIsOnboardingComplete(updatedUser.isOnboardingComplete === true);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
      await storage.deleteAccount(user.id);
      setUser(null);
      setIsOnboardingComplete(false);
    } catch (error) {
      console.error("Failed to delete account:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isOnboardingComplete,
        login,
        logout,
        completeOnboarding,
        updateUser,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
