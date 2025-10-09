import React from 'react';
import { Instagram, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start">
          {/* Logo and Rights - aligned left */}
          <div className="flex items-center space-x-3 mb-4 md:mb-0 md:mr-auto">
            <div className="rounded-lg overflow-hidden min-w-[2.5rem] min-h-[2.5rem] w-10 h-10 flex-shrink-0">
              <img 
                src="logo.png"
                alt="Learnmates Logo"
                className="w-full h-full object-contain"
                style={{ aspectRatio: '1 / 1' }}
              />
            </div>
            <div>
              <span className="text-lg font-bold">leanmates</span>
              <p className="text-sm text-gray-400">© 2025 EduHub. All rights reserved.</p>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="flex items-center space-x-6 md:ml-auto">
            <span className="text-sm text-gray-400">Follow us:</span>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-400 transition-colors duration-200"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-red-400 transition-colors duration-200"
              aria-label="YouTube"
            >
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;