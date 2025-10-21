import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, Users, X, Loader2, Edit, FileText, Search } from 'lucide-react'
import axios from 'axios'
import { API_ENDPOINTS } from '@/config/api'

interface Student {
    _id: string
    name: string
    registrationNumber: string
    academicYear: string
    currentYear: string
    branch: string
    specialization: string
    university: string
}

interface StudentsSectionProps {
    onNavigateToIssueCert?: (student: Student) => void
}

export default function StudentsSection({ onNavigateToIssueCert }: StudentsSectionProps) {
    const [showAddForm, setShowAddForm] = useState(false)
    const [students, setStudents] = useState<Student[]>([])
    const [university, setUniversity] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [fetchingStudents, setFetchingStudents] = useState(true)
    const [editingStudent, setEditingStudent] = useState<Student | null>(null)
    const [showAllStudents, setShowAllStudents] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Student[]>([])
    const [searching, setSearching] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        registrationNumber: '',
        academicYear: '',
        currentYear: '',
        branch: '',
        specialization: ''
    })

    useEffect(() => {
        const universityData = localStorage.getItem('university')
        if (universityData) {
            setUniversity(JSON.parse(universityData))
        }
        fetchStudents()
    }, [])

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return

            const response = await axios.get(API_ENDPOINTS.STUDENTS.GET_ALL, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (response.data.success) {
                setStudents(response.data.data)
            }
        } catch (error: any) {
            console.error('Failed to fetch students:', error)
            showToast('Failed to fetch students', 'error')
        } finally {
            setFetchingStudents(false)
        }
    }

    const showToast = (message: string, type: 'success' | 'error') => {
        const toast = document.createElement('div')
        toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white font-medium animate-in slide-in-from-top-5 flex items-center gap-3 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'
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

        // Auto-dismiss after 3 seconds
        setTimeout(() => removeToast(), 3000)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const token = localStorage.getItem('token')
            if (!token) {
                showToast('Please login again', 'error')
                return
            }

            const response = await axios.post(
                API_ENDPOINTS.STUDENTS.ADD,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            if (response.data.success) {
                showToast('Student added successfully!', 'success')

                // Reset form
                setFormData({
                    name: '',
                    registrationNumber: '',
                    academicYear: '',
                    currentYear: '',
                    branch: '',
                    specialization: ''
                })
                setShowAddForm(false)

                // Refresh student list
                fetchStudents()
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to add student'
            showToast(message, 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (student: Student) => {
        setEditingStudent(student)
        setFormData({
            name: student.name,
            registrationNumber: student.registrationNumber,
            academicYear: student.academicYear,
            currentYear: student.currentYear,
            branch: student.branch,
            specialization: student.specialization || ''
        })
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingStudent) return

        setLoading(true)

        try {
            const token = localStorage.getItem('token')
            if (!token) {
                showToast('Please login again', 'error')
                return
            }

            const response = await axios.put(
                API_ENDPOINTS.STUDENTS.UPDATE(editingStudent._id),
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            if (response.data.success) {
                showToast('Student updated successfully!', 'success')
                setEditingStudent(null)
                setFormData({
                    name: '',
                    registrationNumber: '',
                    academicYear: '',
                    currentYear: '',
                    branch: '',
                    specialization: ''
                })
                fetchStudents()
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to update student'
            showToast(message, 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async (query: string) => {
        setSearchQuery(query)

        if (!query.trim()) {
            setSearchResults([])
            return
        }

        setSearching(true)
        try {
            const token = localStorage.getItem('token')
            if (!token) return

            const response = await axios.get(API_ENDPOINTS.STUDENTS.SEARCH(query), {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (response.data.success) {
                setSearchResults(response.data.data)
            }
        } catch (error: any) {
            console.error('Search failed:', error)
        } finally {
            setSearching(false)
        }
    }

    const handleViewCertificates = (student: Student) => {
        if (onNavigateToIssueCert) {
            onNavigateToIssueCert(student)
        }
    }

    // Get only the 5 most recently added students
    const recentStudents = students.slice(0, 5)

    // Get 10 most recent for modal
    const allRecentStudents = students.slice(0, 10)
    const displayStudents = searchQuery ? searchResults : allRecentStudents

    return (
        <div className="p-4 sm:p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 dark:text-neutral-100">
                            Students Management
                        </h1>
                        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-1 sm:mt-2">
                            Add and manage students under your institution
                        </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowAllStudents(true)}
                            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                            size="sm"
                        >
                            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden xs:inline">Students</span>
                        </Button>
                        <Button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                            size="sm"
                        >
                            {showAddForm ? (
                                <>
                                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span>Cancel</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span>Add Student</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <StatCard
                        icon={<Users className="h-6 w-6" />}
                        title="Total Students"
                        value={students.length.toString()}
                    />
                    <StatCard
                        icon={<Users className="h-6 w-6" />}
                        title="Active Students"
                        value={students.length.toString()}
                    />
                    <StatCard
                        icon={<Users className="h-6 w-6" />}
                        title="Departments"
                        value={new Set(students.map(s => s.branch)).size.toString()}
                    />
                </div>

                {/* Add Student Form */}
                {showAddForm && (
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 mb-6 sm:mb-8">
                        <h2 className="text-lg sm:text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4 sm:mb-6">
                            Add New Student
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                {/* University Name (Read-only) */}
                                <div className="space-y-2">
                                    <Label htmlFor="university" className="text-sm font-medium">
                                        University/College *
                                    </Label>
                                    <Input
                                        type="text"
                                        id="university"
                                        value={university?.name || ''}
                                        disabled
                                        className="bg-neutral-100 dark:bg-neutral-900 cursor-not-allowed"
                                    />
                                </div>

                                {/* Student Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium">
                                        Student Name *
                                    </Label>
                                    <Input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>

                                {/* Registration Number */}
                                <div className="space-y-2">
                                    <Label htmlFor="registrationNumber" className="text-sm font-medium">
                                        Registration Number *
                                    </Label>
                                    <Input
                                        type="text"
                                        id="registrationNumber"
                                        name="registrationNumber"
                                        value={formData.registrationNumber}
                                        onChange={handleChange}
                                        placeholder="e.g., 2024CS001"
                                        required
                                    />
                                </div>

                                {/* Academic Year */}
                                <div className="space-y-2">
                                    <Label htmlFor="academicYear" className="text-sm font-medium">
                                        Academic Year *
                                    </Label>
                                    <Input
                                        type="text"
                                        id="academicYear"
                                        name="academicYear"
                                        value={formData.academicYear}
                                        onChange={handleChange}
                                        placeholder="e.g., 2024-2025"
                                        required
                                    />
                                </div>

                                {/* Current Year of Study */}
                                <div className="space-y-2">
                                    <Label htmlFor="currentYear" className="text-sm font-medium">
                                        Current Year of Study *
                                    </Label>
                                    <select
                                        id="currentYear"
                                        name="currentYear"
                                        value={formData.currentYear}
                                        onChange={handleChange}
                                        required
                                        className="flex h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                                    >
                                        <option value="">Select year</option>
                                        <option value="1">1st Year</option>
                                        <option value="2">2nd Year</option>
                                        <option value="3">3rd Year</option>
                                        <option value="4">4th Year</option>
                                        <option value="5">5th Year</option>
                                        <option value="Graduated">Graduated</option>
                                    </select>
                                </div>

                                {/* Branch/Department */}
                                <div className="space-y-2">
                                    <Label htmlFor="branch" className="text-sm font-medium">
                                        Branch/Department *
                                    </Label>
                                    <Input
                                        type="text"
                                        id="branch"
                                        name="branch"
                                        value={formData.branch}
                                        onChange={handleChange}
                                        placeholder="e.g., Computer Science"
                                        required
                                    />
                                </div>

                                {/* Specialization */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="specialization" className="text-sm font-medium">
                                        Specialization
                                    </Label>
                                    <Input
                                        type="text"
                                        id="specialization"
                                        name="specialization"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        placeholder="e.g., Artificial Intelligence, Data Science (Optional)"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <Button type="submit" className="flex-1 w-full" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        'Add Student'
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 w-full"
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Students List */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-700">
                        <h2 className="text-lg sm:text-xl font-bold text-neutral-800 dark:text-neutral-100">
                            Recently Added Students
                        </h2>
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            Showing {recentStudents.length} most recent {recentStudents.length === 1 ? 'student' : 'students'}
                        </p>
                    </div>

                    {fetchingStudents ? (
                        <div className="p-12 text-center">
                            <Loader2 className="h-16 w-16 text-neutral-400 mx-auto mb-4 animate-spin" />
                            <p className="text-neutral-600 dark:text-neutral-400">
                                Loading students...
                            </p>
                        </div>
                    ) : recentStudents.length === 0 ? (
                        <div className="p-12 text-center">
                            <Users className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                            <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                                No students added yet
                            </p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-500">
                                Click "Add Student" to add your first student
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className="block md:hidden divide-y divide-neutral-200 dark:divide-neutral-700">
                                {recentStudents.map((student) => (
                                    <div key={student._id} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Name</p>
                                                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{student.name}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Reg. Number</p>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{student.registrationNumber}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Year</p>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{student.currentYear}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Branch</p>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{student.branch}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Specialization</p>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{student.specialization || '-'}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEdit(student)}
                                                    className="flex-1 flex items-center justify-center gap-1"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                    <span className="text-xs">Edit</span>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleViewCertificates(student)}
                                                    className="flex-1 flex items-center justify-center gap-1"
                                                >
                                                    <FileText className="h-3 w-3" />
                                                    <span className="text-xs">Certificates</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                                Reg. Number
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                                Year
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                                Branch
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                                Specialization
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                        {recentStudents.map((student) => (
                                            <tr key={student._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-800 dark:text-neutral-100">
                                                    {student.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                                                    {student.registrationNumber}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                                                    {student.currentYear}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                                                    {student.branch}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                                                    {student.specialization || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEdit(student)}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleViewCertificates(student)}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <FileText className="h-3 w-3" />
                                                            Certifications
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* Edit Modal */}
                {editingStudent && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingStudent(null)}>
                        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-3xl w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Edit Student</h2>
                                <button
                                    onClick={() => setEditingStudent(null)}
                                    className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdate}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Registration Number (Read-only) */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-registrationNumber" className="text-sm font-medium">
                                            Registration Number
                                        </Label>
                                        <Input
                                            type="text"
                                            id="edit-registrationNumber"
                                            value={formData.registrationNumber}
                                            disabled
                                            className="bg-neutral-100 dark:bg-neutral-900 cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Student Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-name" className="text-sm font-medium">
                                            Student Name *
                                        </Label>
                                        <Input
                                            type="text"
                                            id="edit-name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    {/* Academic Year */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-academicYear" className="text-sm font-medium">
                                            Academic Year *
                                        </Label>
                                        <Input
                                            type="text"
                                            id="edit-academicYear"
                                            name="academicYear"
                                            value={formData.academicYear}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    {/* Current Year of Study */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-currentYear" className="text-sm font-medium">
                                            Current Year of Study *
                                        </Label>
                                        <select
                                            id="edit-currentYear"
                                            name="currentYear"
                                            value={formData.currentYear}
                                            onChange={handleChange}
                                            required
                                            className="flex h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm"
                                        >
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                            <option value="5">5th Year</option>
                                            <option value="Graduated">Graduated</option>
                                        </select>
                                    </div>

                                    {/* Branch/Department */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-branch" className="text-sm font-medium">
                                            Branch/Department *
                                        </Label>
                                        <Input
                                            type="text"
                                            id="edit-branch"
                                            name="branch"
                                            value={formData.branch}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    {/* Specialization */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-specialization" className="text-sm font-medium">
                                            Specialization
                                        </Label>
                                        <Input
                                            type="text"
                                            id="edit-specialization"
                                            name="specialization"
                                            value={formData.specialization}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <Button type="submit" className="flex-1" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            'Update Student'
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditingStudent(null)}
                                        className="flex-1"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* All Students Modal */}
                {showAllStudents && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => {
                        setShowAllStudents(false)
                        setSearchQuery('')
                        setSearchResults([])
                    }}>
                        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-6xl w-full h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                                <div>
                                    <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">All Students</h2>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                        Search by registration number or view recent students
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowAllStudents(false)
                                        setSearchQuery('')
                                        setSearchResults([])
                                    }}
                                    className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Search Bar */}
                            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                                    <Input
                                        type="text"
                                        placeholder="Search by registration number..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            {/* Students List */}
                            <div className="flex-1 overflow-auto p-6">
                                {searching ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                                    </div>
                                ) : displayStudents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <Users className="h-16 w-16 text-neutral-400 mb-4" />
                                        <p className="text-neutral-600 dark:text-neutral-400">
                                            {searchQuery ? 'No students found' : 'No students added yet'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-neutral-50 dark:bg-neutral-900 sticky top-0">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                                                        Name
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                                                        Reg. Number
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                                                        Year
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                                                        Branch
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                                                        Specialization
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                                {displayStudents.map((student) => (
                                                    <tr key={student._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-800 dark:text-neutral-100">
                                                            {student.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                                                            {student.registrationNumber}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                                                            {student.currentYear}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                                                            {student.branch}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                                                            {student.specialization || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setShowAllStudents(false)
                                                                        handleEdit(student)
                                                                    }}
                                                                    className="flex items-center gap-1"
                                                                >
                                                                    <Edit className="h-3 w-3" />
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleViewCertificates(student)}
                                                                    className="flex items-center gap-1"
                                                                >
                                                                    <FileText className="h-3 w-3" />
                                                                    Certifications
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}


            </div>
        </div>
    )
}

const StatCard = ({ icon, title, value }: {
    icon: React.ReactNode
    title: string
    value: string
}) => {
    return (
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3 mb-3">
                <div className="text-neutral-800 dark:text-neutral-200">
                    {icon}
                </div>
                <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {title}
                </h3>
            </div>
            <p className="text-3xl font-bold text-neutral-800 dark:text-neutral-100">
                {value}
            </p>
        </div>
    )
}
