import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Contribute from './pages/Contribute';
import Donate from './pages/Donate';
import ContactUs from './pages/ContactUs';
import Curriculum from './pages/Curriculum';
import CurriculumPage from './pages/CurriculumPage';
import TopicPage from './pages/TopicPage';
import { UserProvider } from './context/UserContext';
function App() {
  return (
    <UserProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contribute" element={<Contribute />} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/curriculum" element={<Curriculum />} />
              <Route path="/curriculum/:type" element={<CurriculumPage />} />
              <Route path="/curriculum/:type/:board" element={<CurriculumPage />} />
              <Route path="/curriculum/:type/:board/:subject" element={<CurriculumPage />} />
              <Route path="/topic/:id" element={<TopicPage />} />

            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;