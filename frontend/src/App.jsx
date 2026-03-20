import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import AuthPage from './pages/AuthPage'
import FamilyPage from './pages/FamilyPage'
import HistoryPage from './pages/HistoryPage'
import LibraryPage from './pages/LibraryPage'
import OverviewPage from './pages/OverviewPage'
import PlannerPage from './pages/PlannerPage'
import PricingPage from './pages/PricingPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />} path="/">
        <Route element={<OverviewPage />} index />
        <Route element={<AuthPage />} path="auth" />
        <Route element={<PlannerPage />} path="planner" />
        <Route element={<HistoryPage />} path="history" />
        <Route element={<LibraryPage />} path="library" />
        <Route element={<PricingPage />} path="pricing" />
        <Route element={<FamilyPage />} path="family" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Route>
    </Routes>
  )
}

export default App
