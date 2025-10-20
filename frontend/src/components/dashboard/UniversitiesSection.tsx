import { useState, useEffect } from 'react'
import { Building2, Loader2, Mail, User, RefreshCw } from 'lucide-react'
import axios from 'axios'
import { API_ENDPOINTS } from '@/config/api'
import { Button } from '@/components/ui/button'

interface University {
    _id: string
    name: string
    username: string
    email: string
    walletAddress: string
    certificatesIssued: number
    createdAt: string
}

export default function UniversitiesSection() {
    const [universities, setUniversities] = useState<University[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
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
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchUniversities()
        setRefreshing(false)
    }

    return (
        <div className="p-4 md:p-10">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100">
                            Registered Universities
                        </h1>
                        <p className="text-neutral-600 dark:text-neutral-400 mt-2">
                            View all approved universities in the network
                        </p>
                    </div>
                    <Button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Universities List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-12 w-12 animate-spin text-neutral-400" />
                    </div>
                ) : universities.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <Building2 className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                        <p className="text-neutral-600 dark:text-neutral-400">
                            No universities registered yet
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {universities.map((university) => (
                            <div
                                key={university._id}
                                className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                                        <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3 truncate">
                                            {university.name}
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                                                <User className="h-4 w-4 shrink-0" />
                                                <span className="truncate">@{university.username}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                                                <Mail className="h-4 w-4 shrink-0" />
                                                <span className="truncate">{university.email}</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                Joined: {new Date(university.createdAt).toLocaleDateString()}
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
