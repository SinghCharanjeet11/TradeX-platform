import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import LoadingScreen from './components/LoadingScreen'
import AuthenticatedLayout from './components/layouts/AuthenticatedLayout'

// Lazy load pages
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const SignInPage = lazy(() => import('./pages/SignInPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'))
const MarketsPage = lazy(() => import('./pages/MarketsPage'))
const NewsPage = lazy(() => import('./pages/NewsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const PaperTradingPage = lazy(() => import('./pages/PaperTradingPage'))
const TestPage = lazy(() => import('./pages/TestPage'))

function AnimatedRoutes() {
  const location = useLocation()

  // Auth pages use slide animation
  const authPageVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 }
  }

  // Dashboard pages use opacity-only animation (no transform to preserve fixed positioning)
  const dashboardPageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  }

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
  }

  const fastTransition = {
    type: 'tween',
    ease: 'easeOut',
    duration: 0.2
  }

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingScreen />}>
        <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/test" element={<TestPage />} />
        <Route 
          path="/register" 
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={authPageVariants}
              transition={pageTransition}
            >
              <RegisterPage />
            </motion.div>
          } 
        />
        <Route 
          path="/signin" 
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={authPageVariants}
              transition={pageTransition}
            >
              <SignInPage />
            </motion.div>
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={authPageVariants}
              transition={pageTransition}
            >
              <ForgotPasswordPage />
            </motion.div>
          } 
        />
        <Route 
          path="/reset-password/:token" 
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={authPageVariants}
              transition={pageTransition}
            >
              <ResetPasswordPage />
            </motion.div>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <AuthenticatedLayout>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={dashboardPageVariants}
                transition={fastTransition}
              >
                <DashboardPage />
              </motion.div>
            </AuthenticatedLayout>
          } 
        />
        <Route 
          path="/portfolio" 
          element={
            <AuthenticatedLayout>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={dashboardPageVariants}
                transition={fastTransition}
              >
                <PortfolioPage />
              </motion.div>
            </AuthenticatedLayout>
          } 
        />
        <Route 
          path="/markets" 
          element={
            <AuthenticatedLayout>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={dashboardPageVariants}
                transition={fastTransition}
              >
                <MarketsPage />
              </motion.div>
            </AuthenticatedLayout>
          } 
        />
        <Route path="/orders" element={<Navigate to="/dashboard" replace />} />
        <Route 
          path="/news" 
          element={
            <AuthenticatedLayout>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={dashboardPageVariants}
                transition={fastTransition}
              >
                <NewsPage />
              </motion.div>
            </AuthenticatedLayout>
          } 
        />
        <Route 
          path="/paper-trading" 
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={dashboardPageVariants}
              transition={fastTransition}
            >
              <PaperTradingPage />
            </motion.div>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={dashboardPageVariants}
              transition={fastTransition}
            >
              <SettingsPage />
            </motion.div>
          } 
        />
        {/* Catch-all route - redirect to signin or dashboard based on auth */}
        <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AnimatedRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
