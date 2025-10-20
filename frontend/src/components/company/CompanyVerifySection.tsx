import { useState } from 'react'
import { IconFileCheck, IconChevronLeft, IconChevronRight, IconCheck, IconX, IconSearch } from '@tabler/icons-react'
import { FileUpload } from '@/components/ui/file-upload'
import { generateFileHash } from '@/utils/hashUtils'
import { API_ENDPOINTS } from '@/config/api'
import axios from 'axios'

interface CompanyVerifySectionProps {
    selectedStudent: any
    onBack: () => void
    onStudentVerified?: () => void
}

interface VerificationResult {
    matched: boolean
    message: string
    data?: any
}

export default function CompanyVerifySection({ selectedStudent, onBack, onStudentVerified }: CompanyVerifySectionProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [verifying, setVerifying] = useState(false)
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
    const [uploadKey, setUploadKey] = useState(0) // Key to force FileUpload remount
    const [markingVerified, setMarkingVerified] = useState(false)
    const certificatesPerPage = 2

    const certificates = selectedStudent?.certificates || []
    const totalPages = Math.ceil(certificates.length / certificatesPerPage)
    const startIndex = (currentPage - 1) * certificatesPerPage
    const endIndex = startIndex + certificatesPerPage
    const currentCertificates = certificates.slice(startIndex, endIndex)

    const handleFileUpload = (files: File[]) => {
        setUploadedFiles(files)
        setVerificationResult(null)
    }

    const resetUpload = () => {
        setVerificationResult(null)
        setUploadedFiles([])
        setUploadKey(prev => prev + 1) // Change key to force remount
    }

    const handleMarkVerified = async () => {
        setMarkingVerified(true)
        try {
            const token = localStorage.getItem('companyToken')
            await axios.post(
                API_ENDPOINTS.COMPANY.MARK_VERIFIED,
                {
                    studentId: selectedStudent._id,
                    studentName: selectedStudent.name,
                    registrationNumber: selectedStudent.registrationNumber,
                    universityName: selectedStudent.universityName || selectedStudent.university?.name,
                    branch: selectedStudent.branch
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )
            
            // Show success toast
            const toast = document.createElement('div')
            toast.className = 'fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg bg-green-600 text-white font-medium'
            toast.textContent = 'Student marked as verified!'
            document.body.appendChild(toast)
            setTimeout(() => document.body.removeChild(toast), 3000)
            
            if (onStudentVerified) {
                onStudentVerified()
            }
        } catch (error: any) {
            console.error('Mark verified error:', error)
            const toast = document.createElement('div')
            toast.className = 'fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg bg-red-600 text-white font-medium'
            toast.textContent = error.response?.data?.message || 'Failed to mark as verified'
            document.body.appendChild(toast)
            setTimeout(() => document.body.removeChild(toast), 3000)
        } finally {
            setMarkingVerified(false)
        }
    }

    const handleVerify = async () => {
        if (uploadedFiles.length === 0) return

        setVerifying(true)
        setVerificationResult(null)

        try {
            const file = uploadedFiles[0]

            // Generate SHA-512 hash
            const fileHash = await generateFileHash(file)
            console.log('Generated hash:', fileHash)

            // Send to backend for verification
            const token = localStorage.getItem('companyToken')
            const response = await axios.post(
                API_ENDPOINTS.COMPANY.VERIFY_CERTIFICATE,
                {
                    studentId: selectedStudent._id,
                    fileHash: fileHash
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            if (response.data.success) {
                setVerificationResult({
                    matched: response.data.matched,
                    message: response.data.message,
                    data: response.data.data
                })
            }
        } catch (error: any) {
            console.error('Verification error:', error)
            setVerificationResult({
                matched: false,
                message: error.response?.data?.message || 'Verification failed. Please try again.'
            })
        } finally {
            setVerifying(false)
        }
    }
    if (!selectedStudent) {
        return (
            <div className="p-4 md:p-10 bg-white">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-neutral-900 mb-6">
                        Verify Certificate
                    </h2>
                    <div className="bg-white rounded-xl p-8 border border-neutral-200">
                        <div className="text-center py-12">
                            <IconFileCheck className="h-16 w-16 mx-auto mb-4 text-neutral-400" />
                            <p className="text-neutral-600 mb-6">
                                No student selected. Please search for a student first.
                            </p>
                            <button
                                onClick={onBack}
                                className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                                <IconSearch className="h-5 w-5" />
                                Go to Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full bg-white">
            {/* Left Sidebar - Student Info */}
            <div className="w-80 bg-neutral-50 border-r border-neutral-200 p-6 overflow-y-auto">
                <button
                    onClick={onBack}
                    className="mb-6 text-sm text-neutral-600 hover:text-neutral-900"
                >
                    ← Back to Search
                </button>

                <div className="mb-6">
                    <div className="h-20 w-20 rounded-full bg-neutral-200 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl font-bold text-neutral-600">
                            {selectedStudent.name?.charAt(0)}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 text-center">
                        {selectedStudent.name}
                    </h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-neutral-600">
                            Registration Number
                        </label>
                        <p className="text-sm text-neutral-900 mt-1">
                            {selectedStudent.registrationNumber}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-neutral-600">
                            University
                        </label>
                        <p className="text-sm text-neutral-900 mt-1">
                            {selectedStudent.universityName || selectedStudent.university?.name || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-neutral-600">
                            Branch/Department
                        </label>
                        <p className="text-sm text-neutral-900 mt-1">
                            {selectedStudent.branch || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-neutral-600">
                            Current Year
                        </label>
                        <p className="text-sm text-neutral-900 mt-1">
                            Year {selectedStudent.currentYear || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-neutral-600">
                            Specialization
                        </label>
                        <p className="text-sm text-neutral-900 mt-1">
                            {selectedStudent.specialization || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-neutral-600">
                            Total Certificates
                        </label>
                        <p className="text-sm text-neutral-900 mt-1">
                            {certificates.length}
                        </p>
                    </div>
                </div>

                {/* Mark as Verified Button */}
                <div className="mt-6 pt-6 border-t border-neutral-200">
                    <button
                        onClick={handleMarkVerified}
                        disabled={markingVerified}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
                    >
                        <IconCheck className="h-5 w-5" />
                        {markingVerified ? 'Marking...' : 'Mark as Verified'}
                    </button>
                </div>
            </div>

            {/* Right Side - Certificates and Upload */}
            <div className="flex-1 p-6 overflow-y-auto bg-white">
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                    Student Certificates
                </h2>

                {/* Upload Section */}
                <div className="mb-8 bg-white rounded-xl p-6 border border-neutral-200">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                        Upload Certificate to Verify (SHA-512 Hash Verification)
                    </h3>
                    <FileUpload key={uploadKey} onChange={handleFileUpload} />
                    {uploadedFiles.length > 0 && !verificationResult && (
                        <button
                            onClick={handleVerify}
                            disabled={verifying}
                            className="w-full mt-4 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {verifying ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    Verifying...
                                </>
                            ) : (
                                'Verify Certificate'
                            )}
                        </button>
                    )}

                    {/* Verification Result */}
                    {verificationResult && (
                        <div className={`mt-4 p-4 rounded-lg border-2 ${verificationResult.matched
                            ? 'bg-green-50 border-green-500'
                            : 'bg-red-50 border-red-500'
                            }`}>
                            <div className="flex items-start gap-3">
                                {verificationResult.matched ? (
                                    <IconCheck className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                                ) : (
                                    <IconX className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <h4 className={`font-semibold mb-2 ${verificationResult.matched ? 'text-green-900' : 'text-red-900'
                                        }`}>
                                        {verificationResult.matched ? 'Certificate Verified!' : 'Verification Failed'}
                                    </h4>
                                    <p className={`text-sm mb-3 ${verificationResult.matched ? 'text-green-800' : 'text-red-800'
                                        }`}>
                                        {verificationResult.message}
                                    </p>

                                    {verificationResult.matched && verificationResult.data && (
                                        <div className="bg-white rounded-lg p-3 border border-green-200">
                                            <p className="text-xs font-semibold text-neutral-900 mb-2">Matched Certificate Details:</p>
                                            <div className="space-y-1 text-xs text-neutral-700">
                                                <p><span className="font-medium">Certificate:</span> {verificationResult.data.certificateName}</p>
                                                <p><span className="font-medium">File:</span> {verificationResult.data.fileName}</p>
                                                <p><span className="font-medium">Issued:</span> {new Date(verificationResult.data.issuedAt).toLocaleDateString()}</p>
                                                <p><span className="font-medium">Student:</span> {verificationResult.data.studentName}</p>
                                                <p><span className="font-medium">Registration:</span> {verificationResult.data.registrationNumber}</p>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={resetUpload}
                                        className="mt-3 text-sm underline hover:no-underline"
                                    >
                                        Verify Another Certificate
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Certificates List */}
                <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                        Uploaded Certificates by College ({certificates.length})
                    </h3>

                    {certificates.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {currentCertificates.map((cert: any, index: number) => (
                                    <div
                                        key={startIndex + index}
                                        className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start gap-3">
                                            <IconFileCheck className="h-8 w-8 text-neutral-600 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-neutral-900 mb-2">
                                                    {cert.certificateName}
                                                </h4>
                                                <p className="text-xs text-neutral-600 mb-1">
                                                    File: {cert.fileName}
                                                </p>
                                                <p className="text-xs text-neutral-600 mb-1">
                                                    Size: {(cert.fileSize / 1024).toFixed(2)} KB
                                                </p>
                                                <p className="text-xs text-neutral-600 mb-3">
                                                    Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                                                </p>
                                                <button className="text-xs bg-neutral-900 hover:bg-neutral-800 text-white px-3 py-1.5 rounded">
                                                    View Certificate
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <IconChevronLeft className="h-5 w-5 text-neutral-700" />
                                    </button>

                                    <div className="flex items-center gap-2">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-3 py-1 rounded-lg font-medium transition-colors ${currentPage === page
                                                    ? 'bg-neutral-900 text-white'
                                                    : 'border border-neutral-300 hover:bg-neutral-100 text-neutral-700'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <IconChevronRight className="h-5 w-5 text-neutral-700" />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 bg-neutral-50 rounded-lg">
                            <IconFileCheck className="h-16 w-16 mx-auto mb-4 text-neutral-400" />
                            <p className="text-neutral-600">
                                No certificates uploaded yet
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
