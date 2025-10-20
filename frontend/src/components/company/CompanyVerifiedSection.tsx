import { useState, useEffect } from 'react'
import { IconCheck, IconUser } from '@tabler/icons-react'
import { API_ENDPOINTS } from '@/config/api'
import axios from 'axios'

export default function CompanyVerifiedSection() {
    const [verifiedStudents, setVerifiedStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchVerifiedStudents()
    }, [])

    const fetchVerifiedStudents = async () => {
        try {
            const token = localStorage.getItem('companyToken')
            const response = await axios.get(API_ENDPOINTS.COMPANY.GET_VERIFIED, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (response.data.success) {
                setVerifiedStudents(response.data.data)
            }
        } catch (error) {
            console.error('Failed to fetch verified students:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="p-4 md:p-10 bg-white">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-neutral-900 mb-6">
                        Verified Students
                    </h2>
                    <div className="text-center py-12">
                        <p className="text-neutral-600">Loading...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-10 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <IconCheck className="h-8 w-8 text-blue-600" />
                    <h2 className="text-3xl font-bold text-neutral-900">
                        Verified Students
                    </h2>
                </div>

                {verifiedStudents.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 border border-neutral-200">
                        <div className="text-center py-12">
                            <IconCheck className="h-16 w-16 mx-auto mb-4 text-neutral-400" />
                            <p className="text-neutral-600">
                                No verified students yet. Verify students from the Verify section.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {verifiedStudents.map((student, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-lg border border-neutral-200 p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                        <IconUser className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold text-neutral-900 truncate">
                                                {student.studentName}
                                            </h3>
                                            <IconCheck className="h-4 w-4 text-blue-600 shrink-0" />
                                        </div>
                                        <div className="space-y-1 text-xs text-neutral-600">
                                            <p>
                                                <span className="font-medium">Reg:</span> {student.registrationNumber}
                                            </p>
                                            <p>
                                                <span className="font-medium">University:</span> {student.universityName}
                                            </p>
                                            <p>
                                                <span className="font-medium">Branch:</span> {student.branch || 'N/A'}
                                            </p>
                                            <p className="text-neutral-500">
                                                Verified: {new Date(student.verifiedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
