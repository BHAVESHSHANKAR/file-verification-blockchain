import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from '@/pages/Landing'
import SignUp from '@/pages/SignUp'
import Login from '@/pages/Login'
import CollegeDashboard from '@/pages/CollegeDashboard'
import ProtectedRoute from '@/components/ProtectedRoute'
import CompanyLogin from '@/components/company/CompanyLogin'
import CompanySignup from '@/components/company/CompanySignup'
import CompanyDashboard from '@/pages/CompanyDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/college-dashboard" 
          element={
            <ProtectedRoute>
              <CollegeDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/company/login" element={<CompanyLogin />} />
        <Route path="/company/signup" element={<CompanySignup />} />
        <Route path="/company/dashboard" element={<CompanyDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
