import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Menu, X, Moon, Sun } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { FavoriteSubject, loadFavoriteSubjects } from '../utils/favoriteSubjects';
import AddSubjectModal from './AddSubjectModal';
import { Button } from '@/components/ui';

const Header: React.FC = () => {
  const { user } = useUser();
  const { user: authUser } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [favoriteSubjects, setFavoriteSubjects] = useState<FavoriteSubject[]>([]);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [name, setName] = useState<string>("");
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const location = useLocation();

  useEffect(() => {
    const storedName = localStorage.getItem("lm_user_name");
    if (storedName) setName(storedName);
    else if (user?.name) setName(user.name);
  }, [user]);

  useEffect(() => {
    const syncSubjects = () => setFavoriteSubjects(loadFavoriteSubjects());
    window.addEventListener('favoriteSubjectsUpdated', syncSubjects);
    return () => window.removeEventListener('favoriteSubjectsUpdated', syncSubjects);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard', authOnly: true },
    { name: 'Curriculum', href: '/curriculum' },
    { name: 'Past Papers', href: '/pastpapers' },
    { name: 'Topicals', href: '/topicals' },
    { name: 'Contribute', href: '/contribute' },
    { name: 'Donate', href: '/donate' },
    { name: 'About', href: '/about' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const isLoggedIn = user || authUser;
  const displayName = name || user?.email?.split('@')[0] || 'Account';

  return (
    <header className="bg-white/95 dark:bg-gray-800 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity min-w-0 flex-shrink-0">
            <div className="flex items-center justify-center overflow-hidden min-w-[2.5rem] min-h-[2.5rem] w-10 h-10 flex-shrink-0">
              <img
                src="/logo.svg"
                alt="Learnmates Logo"
                className="w-full h-full object-contain"
                style={{ aspectRatio: '1 / 1' }}
              />
            </div>
            <span className="hidden md:inline text-base font-bold bg-primary-600 bg-clip-text text-transparent truncate max-w-[10rem] md:max-w-none">
              Learnmates
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-4 md:space-x-8 max-w-full">
            {navigation
              .filter((item) => !('authOnly' in item && item.authOnly) || authUser)
              .map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${isActive(item.href)
                    ? 'text-primary-600'
                    : 'text-neutral-700 hover:text-primary-600 dark:text-neutral-300 dark:hover:text-white'
                    }`}
                >
                  {item.name}
                  {isActive(item.href) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-px left-0 right-0 h-0.5 bg-blue-500"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
          </nav>

          <div className="flex items-center space-x-2 md:space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-neutral-600" />
              )}
            </Button>

            {isLoggedIn ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.location.href = '/dashboard'}
                className="gap-2 text-black dark:text-white"
                leftIcon={<User className="w-4 h-4" />}
              >
                {displayName}
              </Button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-black dark:text-white shadow-md transition hover:bg-primary-700"
              >
                <User className="h-4 w-4" />
                Sign in
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showMobileMenu && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-neutral-200 dark:border-neutral-600 py-4"
            >
              {navigation
                .filter((item) => !('authOnly' in item && item.authOnly) || authUser)
                .map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-3 py-2 text-base font-medium transition-colors ${isActive(item.href)
                      ? 'text-primary-600 bg-primary-50 dark:bg-neutral-800'
                      : 'text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-neutral-700'
                      }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {item.name}
                  </Link>
                ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      <AddSubjectModal
        isOpen={showAddSubjectModal}
        onClose={() => setShowAddSubjectModal(false)}
        favoriteSubjects={favoriteSubjects}
        onSubjectsChange={setFavoriteSubjects}
      />
    </header>
  );
};

export default Header;