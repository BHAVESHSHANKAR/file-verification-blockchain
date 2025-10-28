import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, ExternalLink, FileText, User, Calendar, Shield, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { ethers } from 'ethers'
import contractABIPolygon from '@/CertificateRegistry.json'
import contractABISepolia from '@/CertificateRegistrySeoplia.json'

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
    revocationStatus?: {
        isRevoked: boolean
        reason: string
        timestamp: number
        replacementHash: string
    } | null
}

interface TransactionData {
    hash: string
    blockNumber: number
    from: string
    to: string
    gasUsed: string
    timestamp: string
}

export default function BlockchainVerification() {
    const [txHash, setTxHash] = useState('')
    const [loading, setLoading] = useState(false)
    const [selectedNetwork, setSelectedNetwork] = useState<'polygon' | 'sepolia'>('polygon')
    const [verificationResult, setVerificationResult] = useState<{
        certificate: CertificateData | null
        transaction: TransactionData | null
        error: string | null
    } | null>(null)

    // Network configurations
    const networkConfig = {
        polygon: {
            name: 'Polygon Amoy',
            contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS,
            rpcUrls: [
                'https://rpc-amoy.polygon.technology',
                'https://polygon-amoy-bor-rpc.publicnode.com',
                'https://polygon-amoy.drpc.org'
            ],
            chainId: 80002,
            explorerUrl: 'https://amoy.polygonscan.com',
            explorerName: 'PolygonScan'
        },
        sepolia: {
            name: 'Sepolia',
            contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS_SEPOLIA,
            rpcUrls: [
                'https://rpc.sepolia.org',
                'https://ethereum-sepolia-rpc.publicnode.com',
                'https://rpc2.sepolia.org'
            ],
            chainId: 11155111,
            explorerUrl: 'https://sepolia.etherscan.io',
            explorerName: 'Etherscan'
        }
    }

    const currentNetwork = networkConfig[selectedNetwork]
    const contractAddress = currentNetwork.contractAddress

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

            for (const rpcUrl of currentNetwork.rpcUrls) {
                try {
                    const tempProvider = new ethers.JsonRpcProvider(
                        rpcUrl,
                        { chainId: currentNetwork.chainId, name: currentNetwork.name.toLowerCase().replace(' ', '-') },
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
            const contractABI = selectedNetwork === 'polygon' ? contractABIPolygon : contractABISepolia
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

                // Check revocation status
                let revocationStatus = null
                try {
                    const status = await contract.getRevocationStatus(fileHash)
                    revocationStatus = {
                        isRevoked: status[0],
                        reason: status[1],
                        timestamp: Number(status[2]),
                        replacementHash: status[3]
                    }
                    console.log('🔍 Revocation status:', revocationStatus)
                } catch (revError) {
                    console.warn('Could not fetch revocation status:', revError)
                }

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
                        exists,
                        revocationStatus
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
            
            // Parse error to provide user-friendly message
            let errorMessage = 'Failed to verify transaction'
            
            const errorStr = error.message?.toLowerCase() || ''
            
            if (errorStr.includes('unauthorized') || errorStr.includes('api key')) {
                errorMessage = `Unable to connect to ${currentNetwork.name}. Please check if you selected the correct network for this transaction hash.`
            } else if (errorStr.includes('transaction not found') || errorStr.includes('not found')) {
                errorMessage = `Transaction not found on ${currentNetwork.name}. Please verify:\n• The transaction hash is correct\n• You selected the right network (${currentNetwork.name})`
            } else if (errorStr.includes('invalid') || errorStr.includes('malformed')) {
                errorMessage = 'Invalid transaction hash format. Please check and try again.'
            } else if (error.message) {
                errorMessage = `Verification failed. Please ensure:\n• The transaction hash is correct\n• You selected the correct network (${currentNetwork.name})\n• The transaction exists on the blockchain`
            }
            
            setVerificationResult({
                certificate: null,
                transaction: null,
                error: errorMessage
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
                        Verify certificates on blockchain networks
                    </p>
                </div>
            </div>

            {/* Network Selection */}
            <div className="max-w-2xl">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                        Select Network
                    </h2>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => {
                                setSelectedNetwork('polygon')
                                setVerificationResult(null)
                            }}
                            variant={selectedNetwork === 'polygon' ? 'default' : 'outline'}
                            className={selectedNetwork === 'polygon' ? 'bg-black text-white hover:bg-neutral-800' : ''}
                        >
                            Polygon Amoy
                        </Button>
                        <Button
                            onClick={() => {
                                setSelectedNetwork('sepolia')
                                setVerificationResult(null)
                            }}
                            variant={selectedNetwork === 'sepolia' ? 'default' : 'outline'}
                            className={selectedNetwork === 'sepolia' ? 'bg-black text-white hover:bg-neutral-800' : ''}
                        >
                            Sepolia
                        </Button>
                    </div>
                </div>
            </div>

            {/* Verification Form */}
            <div className="max-w-2xl">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                        Verify Certificate on {currentNetwork.name}
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
                        <div className="flex items-start gap-3">
                            <XCircle className="h-6 w-6 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg text-red-600 dark:text-red-400 mb-2">Verification Failed</h3>
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <p className="text-sm text-red-800 dark:text-red-200 whitespace-pre-line">
                                        {verificationResult.error}
                                    </p>
                                </div>
                                <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
                                    <p className="font-medium mb-2">Troubleshooting tips:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Verify the transaction hash is complete and correct</li>
                                        <li>Ensure you selected the correct network ({currentNetwork.name})</li>
                                        <li>Check if the transaction has been confirmed on the blockchain</li>
                                        <li>Try switching to the other network if unsure</li>
                                    </ul>
                                </div>
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

                                    {/* Revocation Status */}
                                    {verificationResult.certificate.revocationStatus?.isRevoked && (
                                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-red-900 dark:text-red-100 text-lg mb-2">
                                                        ⚠️ Certificate Revoked
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        <p className="text-red-800 dark:text-red-200">
                                                            <span className="font-medium">Reason:</span> {verificationResult.certificate.revocationStatus.reason || 'Not specified'}
                                                        </p>
                                                        <p className="text-red-800 dark:text-red-200">
                                                            <span className="font-medium">Revoked On:</span> {new Date(verificationResult.certificate.revocationStatus.timestamp * 1000).toLocaleString()}
                                                        </p>
                                                        {verificationResult.certificate.revocationStatus.replacementHash && (
                                                            <p className="text-red-800 dark:text-red-200">
                                                                <span className="font-medium">Replacement:</span> {verificationResult.certificate.revocationStatus.replacementHash}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(`${currentNetwork.explorerUrl}/address/${verificationResult.certificate?.universityAddress}`, '_blank')}
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View University on {currentNetwork.explorerName}
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
                                        onClick={() => window.open(`${currentNetwork.explorerUrl}/tx/${verificationResult.transaction?.hash}`, '_blank')}
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View on {currentNetwork.explorerName}
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
