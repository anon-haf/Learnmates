import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  name: string;
  progress: Record<string, number>;
  recentCourses: Array<{
    id: string;
    title: string;
    progress: number;
    type: string;
    board?: string;
    subject?: string;
  }>;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateProgress: (courseId: string, progress: number) => void;
  addRecentCourse: (course: any) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Persist progress and recentCourses separately for compatibility with legacy code
  useEffect(() => {
    if (user) {
      localStorage.setItem('lm_user_progress', JSON.stringify(user.progress));
      localStorage.setItem('lm_user_recentCourses', JSON.stringify(user.recentCourses));
    }
  }, [user?.progress, user?.recentCourses]);

  // Persist progress separately for compatibility with Home.tsx and legacy code
  useEffect(() => {
    if (user) {
      localStorage.setItem('lm_user_progress', JSON.stringify(user.progress));
    }
  }, [user?.progress]);

  const updateUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  const updateProgress = (courseId: string, progress: number) => {
    if (user) {
      const updatedUser = {
        ...user,
        progress: { ...user.progress, [courseId]: progress }
      };
      updateUser(updatedUser);
    }
  };

  const addRecentCourse = (course: any) => {
    if (user) {
      const existingIndex = user.recentCourses.findIndex(c => c.id === course.id);
      let updatedCourses = [...user.recentCourses];
      
      if (existingIndex >= 0) {
        updatedCourses[existingIndex] = course;
      } else {
        updatedCourses.unshift(course);
        updatedCourses = updatedCourses.slice(0, 3);
      }
      
      const updatedUser = { ...user, recentCourses: updatedCourses };
      updateUser(updatedUser);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser: updateUser, updateProgress, addRecentCourse }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};