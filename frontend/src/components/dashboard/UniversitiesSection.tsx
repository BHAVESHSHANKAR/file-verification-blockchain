import { useState, useEffect } from 'react'
import { Building2, Loader2, Mail, User, RefreshCw, CheckCircle, ExternalLink, Copy } from 'lucide-react'
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
    blockchainRegistered?: boolean
    blockchainTxHash?: string
    blockchainNetwork?: 'sepolia' | 'polygon'
    blockchainRegisteredAt?: string
}

export default function UniversitiesSection() {
    const [universities, setUniversities] = useState<University[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const showToast = (message: string, type: 'success' | 'error') => {
        const toast = document.createElement('div')
        toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white font-medium animate-in slide-in-from-top-5 ${
            type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`
        toast.textContent = message
        document.body.appendChild(toast)
        setTimeout(() => {
            toast.classList.add('animate-out', 'slide-out-to-top-5')
            setTimeout(() => document.body.removeChild(toast), 300)
        }, 3000)
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        showToast('Transaction hash copied!', 'success')
    }

    const getExplorerUrl = (txHash: string, network: 'sepolia' | 'polygon') => {
        if (network === 'sepolia') {
            return `https://sepolia.etherscan.io/tx/${txHash}`
        }
        return `https://amoy.polygonscan.com/tx/${txHash}`
    }

    const getNetworkName = (network: 'sepolia' | 'polygon') => {
        return network === 'sepolia' ? 'Sepolia' : 'Polygon Amoy'
    }

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
                                        
                                        {/* Blockchain Registration Status */}
                                        {university.blockchainRegistered && university.blockchainTxHash && university.blockchainNetwork ? (
                                            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                                                <div className="flex items-center gap-2 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800 w-fit">
                                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                    <span className="text-xs font-medium text-green-700 dark:text-green-300">
                                                        Registered on {getNetworkName(university.blockchainNetwork)}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => window.open(getExplorerUrl(university.blockchainTxHash!, university.blockchainNetwork!), '_blank')}
                                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        View on Blockchain
                                                    </button>
                                                    <button
                                                        onClick={() => copyToClipboard(university.blockchainTxHash!)}
                                                        className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400"
                                                        title="Copy transaction hash"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                
                                                {university.blockchainRegisteredAt && (
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                        Blockchain: {new Date(university.blockchainRegisteredAt).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                                <div className="flex items-center gap-2 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800 w-fit">
                                                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                                                        Not on Blockchain
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="mt-2">
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
