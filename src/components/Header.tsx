import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, User, LogIn, Menu, X, Moon, Sun } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useDarkMode } from '../context/DarkModeContext';


const Header: React.FC = () => {
  const { user, setUser } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [name, setName] = useState<string>("");
  const [editing, setEditing] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const location = useLocation();

  useEffect(() => {
    const storedName = localStorage.getItem("lm_user_name");
    if (storedName) setName(storedName);
    else if (user?.name) setName(user.name);
  }, [user]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleSave = () => {
    setName(inputValue);
    localStorage.setItem("lm_user_name", inputValue);
    if (user) {
      setUser({ ...user, name: inputValue });
    }
    setEditing(false);
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Curriculum', href: '/curriculum' },
    { name: 'Contribute', href: '/contribute' },
    { name: 'Donate', href: '/donate' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'About', href: '/about' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Name */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity min-w-0 flex-shrink-0">
            <div className="rounded-lg flex items-center justify-center overflow-hidden min-w-[2.5rem] min-h-[2.5rem] w-10 h-10 flex-shrink-0">
              <img 
                src="logo.png"
                alt="Learnmates Logo"
                className="w-full h-full object-contain"
                style={{ aspectRatio: '1 / 1' }}
              />
            </div>
            <span className="hidden md:inline text-base font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent truncate max-w-[10rem] md:max-w-none">
              Learnmates
            </span>
          </Link>

          {/* Desktop Navigation - show only on >=md, hide earlier to avoid overlap */}
          <nav className="hidden md:flex items-center space-x-4 md:space-x-8 max-w-full">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'text-blue-600'
                    : 'text-gray-700  hover:text-blue-600 dark:text-gray-500 dark:hover:text-white'
                }`}
              >
                {item.name}
                {isActive(item.href) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-px left-0 right-0 h-0.5 bg-blue-600"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Account Button & Mobile Menu */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{name }</span>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray rounded-lg shadow-lg border border-gray-200 py-2"
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      {editing ? (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            className="border rounded px-3 py-1 text-sm"
                            placeholder="Enter your name"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSave}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                            >Save</button>
                            <button
                              onClick={() => setEditing(false)}
                              className="px-3 py-1 text-gray-500 hover:text-gray-700 text-xs"
                            >Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-gray-900">{name }</p>
                          <p className="text-xs text-gray-500 mb-2">Student</p>
                          <button
                            onClick={() => { setEditing(true); setInputValue(name); }}
                            className="dark:bg-gray-400 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-700  text-xs"
                          >Edit Name</button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button - show on <md */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-gray-200 py-4"
            >
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
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
    </header>
  );
};

export default Header;
