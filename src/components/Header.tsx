import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // scroll handling removed: header transparency on homepage is static

  useEffect(() => {
    try {
      const raw = localStorage.getItem('loggedUser');
      if (raw) setLoggedUser(JSON.parse(raw));
    } catch {
      // ignore
    }
    const handler = (ev: Event) => {
      const ce = ev as CustomEvent;
      if (ce.detail) setLoggedUser(ce.detail);
      else setLoggedUser(null);
    };
    window.addEventListener('authChanged', handler as EventListener);
    return () => window.removeEventListener('authChanged', handler as EventListener);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('loggedUser');
    setLoggedUser(null);
    navigate('/');
    window.dispatchEvent(new CustomEvent('authChanged', { detail: null }));
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/team', label: 'Team' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/notices', label: 'Notices' },
    { path: '/neev', label: 'NEEV' },
    { path: '/contact', label: 'Contact' },
  ];

  // Check if we're on the home page (handle common hosting variations)
  const isHomePage = location.pathname === '/' || location.pathname === '' || location.pathname === '/index.html';
  const headerSolid = isScrolled || !isHomePage;
  // Handle scroll only when on homepage: transparent at top, solid after scroll
  useEffect(() => {
    if (!isHomePage) {
      setIsScrolled(true);
      return;
    }

    const onScroll = () => setIsScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHomePage]);

  // Sync body class so main content can adapt padding when header becomes solid
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isScrolled) document.body.classList.add('header-padded');
      else document.body.classList.remove('header-padded');
    }
    return () => {
      if (typeof document !== 'undefined') document.body.classList.remove('header-padded');
    };
  }, [isScrolled]);

  const headerStyle: React.CSSProperties | undefined = isHomePage && !isScrolled
    ? { backgroundColor: 'transparent', boxShadow: 'none', backdropFilter: 'none', borderBottom: 'none' }
    : undefined;

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isHomePage
          ? (isScrolled ? 'bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-200/50' : 'bg-transparent shadow-none border-none backdrop-blur-none')
          : 'bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-200/50'
      }`}
      style={headerStyle}
      aria-hidden={false}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <motion.div 
              className="flex-shrink-0 flex items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative">
                <img 
                  src="/assest/logo.png" 
                  alt="Logo" 
                  className="h-12 w-12 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300" 
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div className="ml-3">
                <h1 className={`text-xl font-bold transition-colors duration-300 ${
                  headerSolid ? 'text-gray-900' : 'text-white'
                }`}>
                  Shakti Shanti Academy
                </h1>
                <p className={`text-xs transition-colors duration-300 ${
                  headerSolid ? 'text-gray-600' : 'text-blue-200'
                }`}>
                  The Roots of Education
                </p>
              </div>
            </motion.div>
          </Link>


          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive(item.path)
                    ? 'text-yellow-600 bg-yellow-50'
                    : (headerSolid ? 'text-gray-700 hover:text-yellow-600 hover:bg-gray-100' : 'text-white/90 hover:text-yellow-400 hover:bg-white/10')
                }`}
              >
                {item.label}
                {isActive(item.path) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                  />
                )}
              </Link>
            ))}

            {/* User Actions */}
            <div className="flex items-center space-x-3 ml-4">
              {loggedUser && (
                <>
                  <Link
                    to="/notices"
                    className={`p-2 rounded-xl transition-all duration-300 ${
                      headerSolid ? 'text-gray-600 hover:text-yellow-600 hover:bg-gray-100' : 'text-white/90 hover:text-yellow-400 hover:bg-white/10'
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className={`p-2 rounded-xl transition-all duration-300 ${
                      headerSolid ? 'text-red-600 hover:bg-red-50' : 'text-white/90 hover:text-red-400 hover:bg-white/10'
                    }`}
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-xl transition-all duration-300 ${
                headerSolid ? 'text-gray-700 hover:text-yellow-600 hover:bg-gray-100' : 'text-white hover:text-yellow-400 hover:bg-white/10'
              }`}
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden"
            >
              <div className="px-2 pt-2 pb-6 space-y-2 bg-white/95 backdrop-blur-lg rounded-2xl mt-4 shadow-xl border border-gray-200/50">
                
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                      isActive(item.path)
                        ? 'text-yellow-600 bg-yellow-50'
                        : 'text-gray-700 hover:text-yellow-600 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}

                {loggedUser && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-300"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;