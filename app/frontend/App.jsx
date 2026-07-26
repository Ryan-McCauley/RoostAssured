import React from "react"
import { Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import Layout from "./components/Layout"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import PasswordResetRequest from "./pages/PasswordResetRequest"
import PasswordResetEdit from "./pages/PasswordResetEdit"
import SitterShow from "./pages/SitterShow"
import Account from "./pages/Account"
import JobRequests from "./pages/JobRequests"
import AdminLayout from "./pages/admin/AdminLayout"
import AdminWaitlistSignups from "./pages/admin/WaitlistSignups"
import AdminUsers from "./pages/admin/Users"
import AdminServiceAreas from "./pages/admin/ServiceAreas"
import AdminZipSearches from "./pages/admin/ZipSearches"
import AdminHeatmap from "./pages/admin/Heatmap"
import AdminSitterApplications from "./pages/admin/SitterApplications"
import AdminSitters from "./pages/admin/Sitters"
import AdminJobs from "./pages/admin/Jobs"
import AdminPayments from "./pages/admin/Payments"

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/passwords/new" element={<PasswordResetRequest />} />
          <Route path="/passwords/:token/edit" element={<PasswordResetEdit />} />
          <Route path="/sitters/:id" element={<SitterShow />} />
          <Route path="/account" element={<Account />} />
          <Route path="/job_requests" element={<JobRequests />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminWaitlistSignups />} />
            <Route path="waitlist_signups" element={<AdminWaitlistSignups />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="sitter_applications" element={<AdminSitterApplications />} />
            <Route path="sitters" element={<AdminSitters />} />
            <Route path="service_areas" element={<AdminServiceAreas />} />
            <Route path="zip_searches" element={<AdminZipSearches />} />
            <Route path="heatmap" element={<AdminHeatmap />} />
            <Route path="jobs" element={<AdminJobs />} />
            <Route path="payments" element={<AdminPayments />} />
          </Route>
          <Route path="*" element={<Home />} />
        </Routes>
      </Layout>
    </AuthProvider>
  )
}
