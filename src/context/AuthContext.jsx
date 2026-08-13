import React, { createContext, useContext, useState, useEffect } from 'react';
import { KEYS, db } from '../services/db.js';
import { seedAll } from '../services/seedData.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize DB seeding & active session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Auto-seed mock data if empty
        await seedAll();

        // Check if there is an active session in localStorage
        const storedSession = localStorage.getItem('hms_session');
        if (storedSession) {
          const sessionUser = JSON.parse(storedSession);
          // Verify user still exists in database
          const users = await db.getAll(KEYS.USERS);
          const found = users.find(u => u.id === sessionUser.id);
          if (found) {
            setUser(found);
          } else {
            localStorage.removeItem('hms_session');
          }
        }
      } catch (err) {
        console.error('Error during HMS authentication boot:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const users = await db.getAll(KEYS.USERS);
      const foundUser = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!foundUser) {
        throw new Error('Invalid email or password.');
      }

      // Check if user is active
      if (foundUser.isDeactivated) {
        throw new Error('This account has been deactivated by the administrator.');
      }

      // Save session
      localStorage.setItem('hms_session', JSON.stringify({
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role,
        name: foundUser.name
      }));

      setUser(foundUser);
      await db.logActivity(foundUser.id, 'LOGIN', 'auth', `User logged in as ${foundUser.role}`);
      return foundUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (user) {
      await db.logActivity(user.id, 'LOGOUT', 'auth', `User logged out`);
    }
    localStorage.removeItem('hms_session');
    setUser(null);
  };

  const register = async (userData) => {
    // Check if user email already exists
    const users = await db.getAll(KEYS.USERS);
    if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('Email is already registered.');
    }

    // Default avatars for roles
    const avatars = {
      Admin: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      Doctor: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
      Receptionist: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      Pharmacist: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
      Patient: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
    };

    const newUser = await db.create(KEYS.USERS, {
      ...userData,
      avatar: userData.avatar || avatars[userData.role] || avatars.Patient,
      createdAt: new Date().toISOString()
    });

    return newUser;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Admin',
    isDoctor: user?.role === 'Doctor',
    isReceptionist: user?.role === 'Receptionist',
    isPharmacist: user?.role === 'Pharmacist',
    isPatient: user?.role === 'Patient'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
