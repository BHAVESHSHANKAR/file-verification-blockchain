import { useState } from 'react'
import { IconSearch } from '@tabler/icons-react'
import axios from 'axios'
import { API_ENDPOINTS } from '@/config/api'

interface CompanySearchSectionProps {
    onStudentSelect?: (student: any) => void
}

export default function CompanySearchSection({ onStudentSelect }: CompanySearchSectionProps) {
    const [selectedCollege, setSelectedCollege] = useState<any>(null)
    const [collegeSearch, setCollegeSearch] = useState('')
    const [collegeResults, setCollegeResults] = useState<any[]>([])
    const [registerNumber, setRegisterNumber] = useState('')
    const [studentData, setStudentData] = useState<any>(null)
    const [searchingCollege, setSearchingCollege] = useState(false)
    const [searchingStudent, setSearchingStudent] = useState(false)

    const handleVerifyStudent = (student: any) => {
        if (onStudentSelect) {
            onStudentSelect(student)
        }
    }

    const showToast = (message: string, type: 'success' | 'error') => {
        const toast = document.createElement('div')
        toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white font-medium animate-in slide-in-from-top-5 flex items-center gap-3 ${
            type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`
        
        const messageSpan = document.createElement('span')
        messageSpan.textContent = message
        
        const closeButton = document.createElement('button')
        closeButton.innerHTML = '×'
        closeButton.className = 'text-white hover:text-gray-200 text-2xl font-bold leading-none cursor-pointer'
        closeButton.onclick = () => removeToast()
        
        toast.appendChild(messageSpan)
        toast.appendChild(closeButton)
        document.body.appendChild(toast)
        
        const removeToast = () => {
            toast.classList.add('animate-out', 'slide-out-to-top-5')
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast)
                }
            }, 300)
        }
        
        setTimeout(() => removeToast(), 3000)
    }

    const handleCollegeSearch = async () => {
        if (!collegeSearch.trim()) return
        
        setSearchingCollege(true)
        setCollegeResults([])
        setSelectedCollege(null)
        try {
            const token = localStorage.getItem('companyToken')
            const response = await axios.get(API_ENDPOINTS.COMPANY.SEARCH_UNIVERSITIES, {
                params: { query: collegeSearch },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (response.data.success) {
                setCollegeResults(response.data.data)
                if (response.data.data.length === 0) {
                    showToast('No universities found', 'error')
                }
            }
        } catch (error: any) {
            console.error('College search error:', error)
            showToast(error.response?.data?.message || 'Failed to search colleges', 'error')
        } finally {
            setSearchingCollege(false)
        }
    }

    const handleSelectCollege = (college: any) => {
        setSelectedCollege({
            name: college.name,
            id: college._id
        })
        setCollegeResults([])
        setStudentData(null)
        setRegisterNumber('')
        showToast(`Selected: ${college.name}`, 'success')
    }

    const handleStudentSearch = async () => {
        if (!registerNumber.trim() || !selectedCollege) return
        
        setSearchingStudent(true)
        try {
            const token = localStorage.getItem('companyToken')
            const response = await axios.get(API_ENDPOINTS.COMPANY.SEARCH_STUDENT, {
                params: { 
                    universityId: selectedCollege.id,
                    registerNumber: registerNumber 
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (response.data.success) {
                setStudentData(response.data.data)
                showToast('Student found successfully', 'success')
            }
        } catch (error: any) {
            console.error('Student search error:', error)
            showToast(error.response?.data?.message || 'Student not found', 'error')
            setStudentData(null)
        } finally {
            setSearchingStudent(false)
        }
    }

    return (
        <div className="p-4 md:p-10 h-full">
            <div className="max-w-7xl mx-auto h-full">
                <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                    Search Student Credentials
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
                    {/* Left Side - Search */}
                    <div className="space-y-4">
                        {/* Step 1: College Search */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Step 1: Search College/University
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        value={collegeSearch}
                                        onChange={(e) => setCollegeSearch(e.target.value)}
                                        placeholder="Enter college name..."
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                                        onKeyPress={(e) => e.key === 'Enter' && handleCollegeSearch()}
                                    />
                                </div>
                                <button 
                                    onClick={handleCollegeSearch}
                                    disabled={!collegeSearch || searchingCollege}
                                    className="px-4 py-2 text-sm bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded-lg font-medium transition-colors"
                                >
                                    {searchingCollege ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        </div>

                        {/* College Results */}
                        {collegeResults.length > 0 && (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                                    Found {collegeResults.length} result(s):
                                </p>
                                {collegeResults.map((college) => (
                                    <button
                                        key={college._id}
                                        onClick={() => handleSelectCollege(college)}
                                        className="w-full text-left p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
                                    >
                                        <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                                            {college.name}
                                        </p>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                            @{college.username}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Selected College Display */}
                        {selectedCollege && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                                    Selected: {selectedCollege.name}
                                </p>
                            </div>
                        )}

                        {/* Step 2: Student Search */}
                        {selectedCollege && (
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Step 2: Enter Student Register Number
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                        <input
                                            type="text"
                                            value={registerNumber}
                                            onChange={(e) => setRegisterNumber(e.target.value)}
                                            placeholder="Enter register number..."
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                                            onKeyPress={(e) => e.key === 'Enter' && handleStudentSearch()}
                                        />
                                    </div>
                                    <button 
                                        onClick={handleStudentSearch}
                                        disabled={!registerNumber || searchingStudent}
                                        className="px-4 py-2 text-sm bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded-lg font-medium transition-colors"
                                    >
                                        {searchingStudent ? 'Searching...' : 'Search'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Side - Results */}
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-6">
                        {!studentData ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <IconSearch className="h-20 w-20 text-neutral-300 dark:text-neutral-600 mb-4" />
                                <p className="text-neutral-500 dark:text-neutral-400 text-lg">
                                    Search results will appear here
                                </p>
                                <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-2">
                                    Select a college and enter a register number to view student details
                                </p>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                                    Student Details
                                </h3>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                            Name
                                        </label>
                                        <p className="text-sm text-neutral-900 dark:text-neutral-100 mt-1">
                                            {studentData.name}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                            Registration Number
                                        </label>
                                        <p className="text-sm text-neutral-900 dark:text-neutral-100 mt-1">
                                            {studentData.registrationNumber}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                            Branch/Department
                                        </label>
                                        <p className="text-sm text-neutral-900 dark:text-neutral-100 mt-1">
                                            {studentData.branch || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                            Specialization
                                        </label>
                                        <p className="text-sm text-neutral-900 dark:text-neutral-100 mt-1">
                                            {studentData.specialization || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                            Current Year
                                        </label>
                                        <p className="text-sm text-neutral-900 dark:text-neutral-100 mt-1">
                                            Year {studentData.currentYear || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                            Academic Year
                                        </label>
                                        <p className="text-sm text-neutral-900 dark:text-neutral-100 mt-1">
                                            {studentData.academicYear || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                            University
                                        </label>
                                        <p className="text-sm text-neutral-900 dark:text-neutral-100 mt-1">
                                            {studentData.universityName || studentData.university?.name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                            Certificates
                                        </label>
                                        <p className="text-sm text-neutral-900 dark:text-neutral-100 mt-1">
                                            {studentData.certificates?.length || 0} certificate(s)
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleVerifyStudent(studentData)}
                                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-2.5 rounded-lg font-medium transition-colors"
                                >
                                    Verify Student Certifications
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
