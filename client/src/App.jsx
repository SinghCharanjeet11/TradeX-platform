import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ThemeProvider } from './contexts/ThemeContext'
import LoadingScreen from './components/LoadingScreen'

// Lazy load pages for better code splitting
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

  const pageVariants = {
    initial: {
      opacity: 0,
      x: 100
    },
    animate: {
      opacity: 1,
      x: 0
    },
    exit: {
      opacity: 0,
      x: -100
    }
  }

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
  }

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingScreen />}>
        <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="/test" element={<TestPage />} />
        <Route 
          path="/register" 
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
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
              variants={pageVariants}
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
              variants={pageVariants}
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
              variants={pageVariants}
              transition={pageTransition}
            >
              <ResetPasswordPage />
            </motion.div>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <DashboardPage />
            </motion.div>
          } 
        />
        <Route 
          path="/portfolio" 
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <PortfolioPage />
            </motion.div>
          } 
        />
        <Route 
          path="/markets" 
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <MarketsPage />
            </motion.div>
          } 
        />
        <Route path="/orders" element={<Navigate to="/dashboard" replace />} />
        <Route 
          path="/news" 
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <NewsPage />
            </motion.div>
          } 
        />
        <Route 
          path="/paper-trading" 
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
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
              variants={pageVariants}
              transition={pageTransition}
            >
              <SettingsPage />
            </motion.div>
          } 
        />
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </ThemeProvider>
  )
}

export default App
