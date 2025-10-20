import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar'
import {
    IconHome,
    IconCertificate,
    IconUsers,
    IconLogout,
    IconChecklist,
    IconBuilding
} from '@tabler/icons-react'
import {
    GraduationCap,
    Copy,
    Check,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import axios from 'axios'
import { API_ENDPOINTS } from '@/config/api'
import DashboardHome from '@/components/dashboard/DashboardHome'
import VotingSection from '@/components/dashboard/VotingSection'
import StudentsSection from '@/components/dashboard/StudentsSection'
import IssueCertificate from '@/components/dashboard/IssueCertificate'
import UniversitiesSection from '@/components/dashboard/UniversitiesSection'
import BlockchainVerification from '@/components/dashboard/BlockchainVerification'

export default function CollegeDashboard() {
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [university, setUniversity] = useState<any>(null)
    const [showProfile, setShowProfile] = useState(false)
    const [loading, setLoading] = useState(true)
    const [activeSection, setActiveSection] = useState(() => {
        // Get saved section from localStorage or default to 'Dashboard'
        return localStorage.getItem('activeSection') || 'Dashboard'
    })
    const [selectedStudent, setSelectedStudent] = useState<any>(null)

    useEffect(() => {
        fetchProfile()
    }, [])

    // Save active section to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('activeSection', activeSection)
    }, [activeSection])

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                navigate('/login')
                return
            }

            const response = await axios.get(API_ENDPOINTS.AUTH.PROFILE, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (response.data.success) {
                setUniversity(response.data.data)
                // Update localStorage with fresh data
                localStorage.setItem('university', JSON.stringify(response.data.data))
            }
        } catch (error: any) {
            console.error('Failed to fetch profile:', error)
            if (error.response?.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token')
                localStorage.removeItem('university')
                navigate('/login')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('university')
        navigate('/login')
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
            label: 'Issue Certificate',
            href: '#',
            icon: (
                <IconCertificate className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
            )
        },
        {
            label: 'Students',
            href: '#',
            icon: (
                <IconUsers className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
            )
        },
        {
            label: 'Universities',
            href: '#',
            icon: (
                <IconBuilding className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
            )
        },
        {
            label: 'Blockchain Verification',
            href: '#',
            icon: (
                <IconChecklist className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
            )
        },
        {
            label: 'Voting',
            href: '#',
            icon: (
                <IconChecklist className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
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
                                            // Clear selected student when navigating via sidebar
                                            if (link.label === 'Issue Certificate') {
                                                setSelectedStudent(null)
                                                localStorage.removeItem('selectedStudentForCert')
                                            }
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
                                label: university?.name || 'University',
                                href: '#',
                                icon: (
                                    <div className="h-7 w-7 shrink-0 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900 text-xs font-bold">
                                        {university?.name?.charAt(0) || 'U'}
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
                onNavigateToIssueCert={(student) => {
                    setSelectedStudent(student)
                    setActiveSection('Issue Certificate')
                }}
                onBackFromIssueCert={() => {
                    setSelectedStudent(null)
                    setActiveSection('Students')
                }}
            />
            {showProfile && <ProfileModal university={university} onClose={() => setShowProfile(false)} />}
        </div>
    )
}

const DashboardContent = ({ 
    activeSection, 
    selectedStudent,
    onNavigateToIssueCert,
    onBackFromIssueCert
}: { 
    activeSection: string
    selectedStudent: any
    onNavigateToIssueCert: (student: any) => void
    onBackFromIssueCert: () => void
}) => {
    return (
        <div className="flex-1 bg-white dark:bg-neutral-900 overflow-auto">
            {activeSection === 'Dashboard' && <DashboardHome />}
            {activeSection === 'Blockchain Verification' && <BlockchainVerification />}
            {activeSection === 'Voting' && <VotingSection />}
            {activeSection === 'Students' && <StudentsSection onNavigateToIssueCert={onNavigateToIssueCert} />}
            {activeSection === 'Universities' && <UniversitiesSection />}
            {activeSection === 'Issue Certificate' && (
                <IssueCertificate 
                    preSelectedStudent={selectedStudent} 
                    onBack={onBackFromIssueCert}
                />
            )}
        </div>
    )
}

const Logo = () => {
    return (
        <a
            href="/"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20 cursor-pointer"
        >
            <GraduationCap className="h-6 w-6 text-neutral-900 dark:text-neutral-100 shrink-0" />
            <span className="font-bold text-black dark:text-white whitespace-pre">
                EduVerify
            </span>
        </a>
    )
}

const ProfileModal = ({ university, onClose }: { university: any; onClose: () => void }) => {
    const [copied, setCopied] = useState(false)

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Account Details</h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Profile Header */}
                    <div className="flex items-center gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-700">
                        <div className="h-16 w-16 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900 text-2xl font-bold">
                            {university?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
                                {university?.name || 'N/A'}
                            </h3>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                @{university?.username || 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Account Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoField label="Institution Name" value={university?.name || 'N/A'} />
                        <InfoField label="Username" value={university?.username || 'N/A'} />
                        <InfoField label="Email" value={university?.email || 'N/A'} />
                        <InfoField label="Account Status" value={university?.status || 'N/A'}>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600">
                                {university?.status || 'N/A'}
                            </span>
                        </InfoField>
                        <InfoField label="Certificates Issued" value={university?.certificatesIssued || 0} />
                        <InfoField label="Member Since" value={university?.createdAt ? new Date(university.createdAt).toLocaleDateString() : 'N/A'} />
                    </div>

                    {/* Wallet Address */}
                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 block mb-2">
                            MetaMask Wallet Address
                        </label>
                        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg">
                            <code className="flex-1 text-sm text-neutral-800 dark:text-neutral-200 break-all">
                                {university?.walletAddress || 'N/A'}
                            </code>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(university?.walletAddress || '')}
                                className="shrink-0">
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Close Button */}
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

const InfoField = ({ label, value, children }: { label: string; value: string | number; children?: React.ReactNode }) => {
    return (
        <div>
            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                {label}
            </label>
            {children || (
                <p className="text-base text-neutral-800 dark:text-neutral-100">
                    {value}
                </p>
            )}
        </div>
    )
}
