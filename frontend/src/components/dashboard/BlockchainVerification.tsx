import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, ExternalLink, FileText, User, Calendar, Shield, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { ethers } from 'ethers'
import contractABI from '@/CertificateRegistry.json'

interface CertificateData {
    studentName: string
    registrationNumber: string
    fileName: string
    ipfsUrl: string
    ipfsCID?: string
    fileHash: string
    universityAddress: string
    timestamp: string
    exists: boolean
}

interface TransactionData {
    hash: string
    blockNumber: number
    from: string
    to: string
    gasUsed: string
    timestamp: string
}

// RPC URLs for fallback
const RPC_URLS = [
    'https://rpc-amoy.polygon.technology',
    'https://rpc.ankr.com/polygon_amoy',
    'https://polygon-amoy-bor-rpc.publicnode.com'
]

export default function BlockchainVerification() {
    const [txHash, setTxHash] = useState('')
    const [loading, setLoading] = useState(false)
    const [verificationResult, setVerificationResult] = useState<{
        certificate: CertificateData | null
        transaction: TransactionData | null
        error: string | null
    } | null>(null)

    const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS

    const verifyByTxHash = async () => {
        if (!txHash.trim()) {
            setVerificationResult({
                certificate: null,
                transaction: null,
                error: 'Please enter a transaction hash'
            })
            return
        }

        setLoading(true)
        setVerificationResult(null)

        try {
            // Try to get transaction receipt with retry logic
            let receipt = null
            let lastError = null

            for (const rpcUrl of RPC_URLS) {
                try {
                    const tempProvider = new ethers.JsonRpcProvider(
                        rpcUrl,
                        { chainId: 80002, name: 'polygon-amoy' },
                        { staticNetwork: true }
                    )
                    receipt = await tempProvider.getTransactionReceipt(txHash)
                    if (receipt) break
                } catch (err) {
                    lastError = err
                    console.warn(`Failed with ${rpcUrl}, trying next...`)
                }
            }

            if (!receipt) {
                throw lastError || new Error('Transaction not found on any RPC endpoint')
            }
            // Get transaction details using the same provider
            const tx = await receipt.provider.getTransaction(txHash)

            if (!tx) {
                throw new Error('Transaction details not found')
            }

            // Get block to extract timestamp
            const block = await receipt.provider.getBlock(receipt.blockNumber)

            // Parse transaction data to extract certificate info
            const contract = new ethers.Contract(contractAddress, contractABI.abi, receipt.provider)
            const iface = contract.interface

            // Decode the transaction input
            const decodedData = iface.parseTransaction({ data: tx.data })

            if (decodedData?.name === 'registerCertificate') {
                // ✅ NEW: Now we have 6 parameters (added ipfsHash)
                const [studentName, registrationNumber, fileName, ipfsUrl, ipfsHash, fileHash] = decodedData.args

                console.log('🔍 Decoded transaction data:', {
                    studentName,
                    registrationNumber,
                    fileName,
                    ipfsUrl: ipfsUrl.substring(0, 50) + '...',
                    ipfsHash,
                    fileHash: fileHash.substring(0, 20) + '...'
                })

                // Verify the certificate still exists on blockchain
                const exists = await contract.certificateExists(fileHash)

                setVerificationResult({
                    certificate: {
                        studentName,
                        registrationNumber,
                        fileName,
                        ipfsUrl,
                        ipfsCID: ipfsHash, // ✅ Now we have the IPFS hash
                        fileHash,
                        universityAddress: tx.from,
                        timestamp: new Date(Number(block?.timestamp || 0) * 1000).toISOString(),
                        exists
                    },
                    transaction: {
                        hash: receipt.hash,
                        blockNumber: receipt.blockNumber,
                        from: receipt.from,
                        to: receipt.to || '',
                        gasUsed: receipt.gasUsed.toString(),
                        timestamp: new Date(Number(block?.timestamp || 0) * 1000).toISOString()
                    },
                    error: null
                })
            } else {
                throw new Error('Transaction is not a certificate registration')
            }
        } catch (error: any) {
            console.error('Verification error:', error)
            setVerificationResult({
                certificate: null,
                transaction: null,
                error: error.message || 'Failed to verify transaction'
            })
        } finally {
            setLoading(false)
        }
    }



    return (
        <div className="h-full flex flex-col p-6 gap-6 overflow-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-neutral-900 dark:text-neutral-100" />
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                        Blockchain Verification
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400">
                        Verify certificates on Polygon Amoy blockchain
                    </p>
                </div>
            </div>

            {/* Verification Form */}
            <div className="max-w-2xl">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                        Verify Certificate by Transaction Hash
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="txHash">Transaction Hash</Label>
                            <br />
                            <Input
                                id="txHash"
                                type="text"
                                placeholder="0x..."
                                value={txHash}
                                onChange={(e) => setTxHash(e.target.value)}
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                                Enter the blockchain transaction hash you received after issuing a certificate
                            </p>
                        </div>
                        <Button
                            onClick={verifyByTxHash}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Search className="h-4 w-4 mr-2" />
                            )}
                            Verify Transaction
                        </Button>
                    </div>
                </div>
            </div>

            {/* Verification Result */}
            {verificationResult && (
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
                    {verificationResult.error ? (
                        <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
                            <XCircle className="h-6 w-6 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-lg">Verification Failed</h3>
                                <p className="text-sm mt-1">{verificationResult.error}</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-start gap-3 text-green-600 dark:text-green-400 mb-6">
                                <CheckCircle className="h-6 w-6 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-lg">Certificate Verified</h3>
                                    <p className="text-sm mt-1">This certificate is registered on the blockchain</p>
                                </div>
                            </div>

                            {/* Certificate Details */}
                            {verificationResult.certificate && (
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-lg border-b border-neutral-200 dark:border-neutral-700 pb-2">
                                        Certificate Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <DetailField
                                            icon={<User className="h-4 w-4" />}
                                            label="Student Name"
                                            value={verificationResult.certificate.studentName}
                                        />
                                        <DetailField
                                            icon={<FileText className="h-4 w-4" />}
                                            label="Registration Number"
                                            value={verificationResult.certificate.registrationNumber}
                                        />
                                        <DetailField
                                            icon={<FileText className="h-4 w-4" />}
                                            label="File Name"
                                            value={verificationResult.certificate.fileName}
                                        />
                                        <DetailField
                                            icon={<Calendar className="h-4 w-4" />}
                                            label="Issued On"
                                            value={new Date(verificationResult.certificate.timestamp).toLocaleString()}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <DetailField
                                            icon={<Shield className="h-4 w-4" />}
                                            label="University Address"
                                            value={verificationResult.certificate.universityAddress}
                                            mono
                                        />
                                        <DetailField
                                            icon={<FileText className="h-4 w-4" />}
                                            label="IPFS CID"
                                            value={verificationResult.certificate.ipfsCID || 'N/A'}
                                            mono
                                        />
                                        <DetailField
                                            icon={<FileText className="h-4 w-4" />}
                                            label="File Hash (SHA-512)"
                                            value={verificationResult.certificate.fileHash || 'N/A'}
                                            mono
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(`https://amoy.polygonscan.com/address/${verificationResult.certificate?.universityAddress}`, '_blank')}
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View University on PolygonScan
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Transaction Details */}
                            {verificationResult.transaction && (
                                <div className="space-y-4 mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-lg">
                                        Transaction Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <DetailField
                                            label="Block Number"
                                            value={verificationResult.transaction.blockNumber.toString()}
                                        />
                                        <DetailField
                                            label="Gas Used"
                                            value={verificationResult.transaction.gasUsed}
                                        />
                                    </div>
                                    <DetailField
                                        label="Transaction Hash"
                                        value={verificationResult.transaction.hash}
                                        mono
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(`https://amoy.polygonscan.com/tx/${verificationResult.transaction?.hash}`, '_blank')}
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View on PolygonScan
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}


        </div>
    )
}

const DetailField = ({
    icon,
    label,
    value,
    mono = false
}: {
    icon?: React.ReactNode
    label: string
    value: string
    mono?: boolean
}) => {
    return (
        <div>
            <div className="flex items-center gap-2 mb-1">
                {icon && <span className="text-neutral-600 dark:text-neutral-400">{icon}</span>}
                <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {label}
                </label>
            </div>
            <p className={`text-sm text-neutral-900 dark:text-neutral-100 ${mono ? 'font-mono break-all' : ''}`}>
                {value}
            </p>
        </div>
    )
}
