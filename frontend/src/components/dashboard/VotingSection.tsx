import { useState, useEffect } from 'react'
import { CheckCircle, ThumbsUp, ThumbsDown, Loader2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedTooltip } from '@/components/ui/animated-tooltip'
import axios from 'axios'
import { API_ENDPOINTS } from '@/config/api'

interface UniversityRequest {
    _id: string
    name: string
    username: string
    email: string
    walletAddress: string
    status: string
    approvalCount: number
    rejectionCount: number
    totalVotes: number
    createdAt: string
}

interface University {
    _id: string
    name: string
    username: string
    email: string
    walletAddress: string
    certificatesIssued: number
    createdAt: string
}

export default function VotingSection() {
    const [requests, setRequests] = useState<UniversityRequest[]>([])
    const [universities, setUniversities] = useState<University[]>([])
    const [loading, setLoading] = useState(true)
    const [votingState, setVotingState] = useState<{ requestId: string; vote: 'approve' | 'reject' } | null>(null)

    const colors = ['dc2626', '2563eb', '16a34a', '9333ea', 'ea580c', '0891b2', 'ca8a04', 'db2777']

    const recentApprovers = universities.slice(0, 6).map((uni, index) => ({
        id: index + 1,
        name: uni.name,
        designation: `@${uni.username}`,
        image: `https://api.dicebear.com/7.x/initials/svg?seed=${uni.name}&backgroundColor=${colors[index % colors.length]}`
    }))

    useEffect(() => {
        fetchPendingRequests()
        fetchUniversities()
    }, [])

    const fetchUniversities = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return

            const response = await axios.get(API_ENDPOINTS.UNIVERSITIES.GET_ALL, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (response.data.success) {
                setUniversities(response.data.data)
            }
        } catch (error: any) {
            console.error('Failed to fetch universities:', error)
        }
    }

    const fetchPendingRequests = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return

            const response = await axios.get(API_ENDPOINTS.UNIVERSITY_REQUESTS.GET_PENDING, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (response.data.success) {
                setRequests(response.data.data)
            }
        } catch (error: any) {
            console.error('Failed to fetch requests:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleVote = async (requestId: string, vote: 'approve' | 'reject') => {
        setVotingState({ requestId, vote })
        try {
            const token = localStorage.getItem('token')
            if (!token) return

            const response = await axios.post(
                API_ENDPOINTS.UNIVERSITY_REQUESTS.VOTE(requestId),
                { vote },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            if (response.data.success) {
                showToast(response.data.message, 'success')
                fetchPendingRequests()
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to record vote'
            showToast(message, 'error')
        } finally {
            setVotingState(null)
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

    return (
        <div className="p-4 sm:p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 dark:text-neutral-100">
                        University Approvals
                    </h1>
                    <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-2">
                        Review and vote on new university registration requests
                    </p>
                </div>

                {/* Pending Votes */}
                <div className="mt-6 sm:mt-8 bg-white dark:bg-neutral-800 rounded-xl p-4 sm:p-6 md:p-8 border border-neutral-200 dark:border-neutral-700">
                    <h2 className="text-lg sm:text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4 sm:mb-6">
                        Pending University Approvals
                    </h2>
                    
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-12 w-12 text-neutral-400 mx-auto mb-4 animate-spin" />
                            <p className="text-neutral-600 dark:text-neutral-400">Loading requests...</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
                            <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-3">
                                All Caught Up!
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
                                No pending university applications at the moment. Check back later or invite new institutions to join the network.
                            </p>
                            {universities.length > 0 && (
                                <>
                                    <div className="flex justify-center items-center gap-2 mb-4">
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                            Active universities in the network:
                                        </p>
                                    </div>
                                    <div className="flex justify-center">
                                        <AnimatedTooltip items={recentApprovers} />
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {requests.map((request) => (
                                <div
                                    key={request._id}
                                    className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 sm:p-6 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                                >
                                    <div className="flex flex-col sm:flex-row items-start gap-4">
                                        <div className="flex-1 w-full min-w-0">
                                            <div className="flex items-center gap-2 sm:gap-3 mb-3">
                                                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 shrink-0" />
                                                <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                                    {request.name}
                                                </h3>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                                                <div className="min-w-0">
                                                    <p className="text-neutral-500 dark:text-neutral-400">Username</p>
                                                    <p className="text-neutral-800 dark:text-neutral-200 font-medium truncate">@{request.username}</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-neutral-500 dark:text-neutral-400">Email</p>
                                                    <p className="text-neutral-800 dark:text-neutral-200 font-medium truncate">{request.email}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                                                <div className="flex items-center gap-2">
                                                    <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                                                    <span className="text-neutral-600 dark:text-neutral-400">
                                                        {request.approvalCount} Approvals
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <ThumbsDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                                                    <span className="text-neutral-600 dark:text-neutral-400">
                                                        {request.rejectionCount} Rejections
                                                    </span>
                                                </div>
                                                <div className="text-neutral-500 dark:text-neutral-400">
                                                    Total: {request.totalVotes} votes
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                                            <Button
                                                size="sm"
                                                onClick={() => handleVote(request._id, 'approve')}
                                                disabled={votingState?.requestId === request._id}
                                                className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none sm:w-full"
                                            >
                                                {votingState?.requestId === request._id && votingState?.vote === 'approve' ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                        <span className="text-xs sm:text-sm">Approve</span>
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleVote(request._id, 'reject')}
                                                disabled={votingState?.requestId === request._id}
                                                className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex-1 sm:flex-none sm:w-full"
                                            >
                                                {votingState?.requestId === request._id && votingState?.vote === 'reject' ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <ThumbsDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                        <span className="text-xs sm:text-sm">Reject</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
