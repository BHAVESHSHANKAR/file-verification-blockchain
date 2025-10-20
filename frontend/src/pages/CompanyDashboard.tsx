import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar'
import {
    IconHome,
    IconSearch,
    IconFileCheck,
    IconLogout,
    IconCheck
} from '@tabler/icons-react'
import { Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { API_ENDPOINTS } from '@/config/api'
import axios from 'axios'
import CompanyDashboardHome from '@/components/company/CompanyDashboardHome'
import CompanySearchSection from '@/components/company/CompanySearchSection'
import CompanyVerifySection from '@/components/company/CompanyVerifySection'
import CompanyVerifiedSection from '@/components/company/CompanyVerifiedSection'

export default function CompanyDashboard() {
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [company, setCompany] = useState<any>(null)
    const [showProfile, setShowProfile] = useState(false)
    const [loading, setLoading] = useState(true)
    const [activeSection, setActiveSection] = useState(() => {
        return localStorage.getItem('companyActiveSection') || 'Dashboard'
    })
    const [selectedStudent, setSelectedStudent] = useState<any>(null)

    useEffect(() => {
        fetchProfile()
        // Clear stored student data on mount
        localStorage.removeItem('selectedStudentForVerify')
        localStorage.removeItem('companyActiveSection')
    }, [])

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('companyToken')
            if (!token) {
                navigate('/company/login')
                return
            }

            const response = await axios.get(API_ENDPOINTS.COMPANY.PROFILE, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (response.data.success) {
                setCompany(response.data.data)
                localStorage.setItem('company', JSON.stringify(response.data.data))
            }
        } catch (error: any) {
            console.error('Failed to fetch profile:', error)
            if (error.response?.status === 401) {
                localStorage.removeItem('companyToken')
                localStorage.removeItem('company')
                navigate('/company/login')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('companyToken')
        localStorage.removeItem('company')
        navigate('/company/login')
    }

    const links = [
        {
            label: 'Dashboard',
            href: '#',
            icon: (
                <IconHome className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
            )
        },
        {
            label: 'Search',
            href: '#',
            icon: (
                <IconSearch className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
            )
        },
        {
            label: 'Verify',
            href: '#',
            icon: (
                <IconFileCheck className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
            )
        },
        {
            label: 'Verified',
            href: '#',
            icon: (
                <IconCheck className="text-blue-600 dark:text-blue-400 h-5 w-5 shrink-0" />
            )
        },
        {
            label: 'Logout',
            href: '#',
            icon: (
                <IconLogout className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
            )
        }
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white dark:bg-neutral-900">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-neutral-900 dark:text-neutral-100" />
                    <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col md:flex-row bg-white dark:bg-neutral-900 w-full shrink-0 overflow-hidden h-screen">
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-10">
                    <div className="flex flex-col shrink-0 overflow-y-auto overflow-x-hidden">
                        <Logo />
                        <div className="mt-8 flex flex-col gap-2">
                            {links.map((link, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        if (link.label === 'Logout') {
                                            handleLogout()
                                        } else {
                                            setActiveSection(link.label)
                                        }
                                    }}
                                    className="cursor-pointer"
                                >
                                    <SidebarLink link={link} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div onClick={() => setShowProfile(true)} className="cursor-pointer">
                        <SidebarLink
                            link={{
                                label: company?.companyName || 'Company',
                                href: '#',
                                icon: (
                                    <div className="h-7 w-7 shrink-0 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900 text-xs font-bold">
                                        {company?.companyName?.charAt(0) || 'C'}
                                    </div>
                                )
                            }}
                        />
                    </div>
                </SidebarBody>
            </Sidebar>
            <DashboardContent
                activeSection={activeSection}
                selectedStudent={selectedStudent}
                onBackFromVerify={() => {
                    setSelectedStudent(null)
                    setActiveSection('Search')
                }}
                onStudentSelect={(student) => {
                    setSelectedStudent(student)
                    setActiveSection('Verify')
                }}
                onStudentVerified={() => {
                    // Optionally navigate to Verified section after marking
                    setActiveSection('Verified')
                }}
            />
            {showProfile && <ProfileModal company={company} onClose={() => setShowProfile(false)} />}
        </div>
    )
}

const DashboardContent = ({ activeSection, selectedStudent, onBackFromVerify, onStudentSelect, onStudentVerified }: {
    activeSection: string
    selectedStudent: any
    onBackFromVerify: () => void
    onStudentSelect: (student: any) => void
    onStudentVerified: () => void
}) => {
    return (
        <div className="flex-1 bg-white dark:bg-neutral-900 overflow-auto">
            {activeSection === 'Dashboard' && <CompanyDashboardHome />}
            {activeSection === 'Search' && <CompanySearchSection onStudentSelect={onStudentSelect} />}
            {activeSection === 'Verify' && <CompanyVerifySection selectedStudent={selectedStudent} onBack={onBackFromVerify} onStudentVerified={onStudentVerified} />}
            {activeSection === 'Verified' && <CompanyVerifiedSection />}
        </div>
    )
}

const Logo = () => {
    return (
        <a
            href="/"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20 cursor-pointer"
        >
            <Building2 className="h-6 w-6 text-neutral-900 dark:text-neutral-100 shrink-0" />
            <span className="font-bold text-black dark:text-white whitespace-pre">
                EduVerify
            </span>
        </a>
    )
}

const ProfileModal = ({ company, onClose }: { company: any; onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Company Profile</h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-700">
                        <div className="h-16 w-16 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900 text-2xl font-bold">
                            {company?.companyName?.charAt(0) || 'C'}
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
                                {company?.companyName || 'N/A'}
                            </h3>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                Company Account
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                                Company Name
                            </label>
                            <p className="text-base text-neutral-800 dark:text-neutral-100">
                                {company?.companyName || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                                Email
                            </label>
                            <p className="text-base text-neutral-800 dark:text-neutral-100">
                                {company?.email || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                                Member Since
                            </label>
                            <p className="text-base text-neutral-800 dark:text-neutral-100">
                                {company?.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button onClick={onClose} className="w-full">
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
