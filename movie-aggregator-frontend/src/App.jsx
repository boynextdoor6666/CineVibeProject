import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Movies from './pages/Movies'
import Series from './pages/Series'
import Games from './pages/Games'
import DetailedContentPage from './pages/DetailedContentPage'
import SearchResults from './pages/SearchResults'
import Profile from './pages/Profile'
import ComingSoon from './pages/ComingSoon'
import Critics from './pages/Critics'
import HypeMonitoring from './pages/HypeMonitoring'
import TasteProfile from './pages/TasteProfile'
import WorldRatings from './pages/WorldRatings'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminPanel from './pages/AdminPanel'
import Analytics from './pages/Analytics'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import './App.css'

function App() {
  const location = useLocation()

  const legacyLightRoutes = new Set([
    '/movies',
    '/series',
    '/games',
    '/search',
    '/coming-soon',
    '/critics',
    '/dashboard',
    '/analytics',
    '/hype-monitoring',
    '/taste-profile',
    '/world-ratings',
    '/login',
    '/register',
    '/profile',
    '/admin',
  ])

  const showSidebar = !['/login', '/register'].includes(location.pathname)
  // Убрал legacyLightRoutes и pageShellClassName, чтобы использовать единую темную тему
  const pageShellClassName = ''

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)]">
        <div className="w-full px-2 py-6 sm:px-4 lg:px-6 lg:py-8">
          <div className="flex items-start gap-4 lg:gap-6">
            {showSidebar && <Sidebar />}
            <div className={`min-w-0 flex-1 ${pageShellClassName}`}>
              <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/series" element={<Series />} />
            <Route path="/games" element={<Games />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/coming-soon" element={<ComingSoon />} />
            <Route path="/critics" element={<Critics />} />
            <Route path="/dashboard" element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            } />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/hype-monitoring" element={<HypeMonitoring />} />
            <Route path="/taste-profile" element={<TasteProfile />} />
            <Route path="/world-ratings" element={<WorldRatings />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/content/:id" element={<DetailedContentPage />} />
            <Route path="/movie/:id" element={<DetailedContentPage />} />
            <Route path="/series/:id" element={<DetailedContentPage />} />
            <Route path="/game/:id" element={<DetailedContentPage />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            } />
              </Routes>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App
