import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Award, ArrowLeft, User, Upload, FileText, Loader2, CheckCircle, X } from 'lucide-react'
import axios from 'axios'
import { API_ENDPOINTS } from '@/config/api'
import { registerCertificateOnBlockchain } from '@/utils/blockchain'
import BlockchainSuccessModal from './BlockchainSuccessModal'


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

interface IssueCertificateProps {
    preSelectedStudent?: Student | null
    onBack?: () => void
}

export default function IssueCertificate({ preSelectedStudent, onBack }: IssueCertificateProps) {
    const [student, setStudent] = useState<Student | null>(() => {
        // Only load from localStorage if preSelectedStudent is provided
        if (preSelectedStudent) {
            return preSelectedStudent
        }
        const saved = localStorage.getItem('selectedStudentForCert')
        if (saved) {
            return JSON.parse(saved)
        }
        return null
    })

    const [certificates, setCertificates] = useState<Array<{
        id: string
        name: string
        file: File | null
        uploading: boolean
        uploaded: boolean
    }>>([{ id: '1', name: '', file: null, uploading: false, uploaded: false }])



    const [uploadedCertificates, setUploadedCertificates] = useState<Array<{
        _id: string
        certificateName: string
        fileName: string
        fileSize: number
        ipfsHash: string
        issuedAt: string
        blockchainTxHash?: string
        blockchainBlockNumber?: number
        blockchainVerified?: boolean
    }>>([])
    const [loadingCertificates, setLoadingCertificates] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const certificatesPerPage = 2

    // Blockchain modal state
    const [blockchainModalVisible, setBlockchainModalVisible] = useState(false)
    const [blockchainTxHash, setBlockchainTxHash] = useState('')
    const [blockchainCertName, setBlockchainCertName] = useState('')

    // Upload cooldown state
    const [uploadCooldown, setUploadCooldown] = useState(false)
    const [cooldownSeconds, setCooldownSeconds] = useState(0)

    useEffect(() => {
        if (preSelectedStudent) {
            setStudent(preSelectedStudent)
            localStorage.setItem('selectedStudentForCert', JSON.stringify(preSelectedStudent))
            fetchUploadedCertificates(preSelectedStudent._id)
        }
    }, [preSelectedStudent])

    useEffect(() => {
        if (student) {
            fetchUploadedCertificates(student._id)
        }
    }, [])

    useEffect(() => {
        return () => {
            // Don't clear on unmount, only clear when explicitly going back
        }
    }, [])

    if (!student) {
        return (
            <div className="p-4 md:p-10">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center py-12">
                        <Award className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
                            No Student Selected
                        </h2>
                        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                            Please select a student from the Students section to issue a certificate
                        </p>
                        {onBack && (
                            <Button onClick={onBack} variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Go to Students
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const handleBack = () => {
        localStorage.removeItem('selectedStudentForCert')
        if (onBack) onBack()
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
        setTimeout(() => removeToast(), 3000)
    }

    const addCertificateRow = () => {
        setCertificates([...certificates, {
            id: Date.now().toString(),
            name: '',
            file: null,
            uploading: false,
            uploaded: false
        }])
    }

    const removeCertificateRow = (id: string) => {
        if (certificates.length > 1) {
            setCertificates(certificates.filter(cert => cert.id !== id))
        }
    }

    const updateCertificateName = (id: string, name: string) => {
        setCertificates(certificates.map(cert =>
            cert.id === id ? { ...cert, name } : cert
        ))
    }

    const updateCertificateFile = (id: string, file: File | null) => {
        if (file) {
            if (file.type !== 'application/pdf') {
                showToast('Only PDF files are allowed', 'error')
                return
            }
            if (file.size > 10 * 1024 * 1024) {
                showToast('File size must be less than 10MB', 'error')
                return
            }
        }
        setCertificates(certificates.map(cert =>
            cert.id === id ? { ...cert, file } : cert
        ))
    }

    // Blockchain function removed - will be re-added tomorrow
    /*
    const registerOnBlockchain = async (ipfsData: any, certificateName: string): Promise<void> => {
        try {
            // Validate all required fields before proceeding
            console.log('📋 Certificate data to register:', ipfsData);
            
            if (!ipfsData.studentName || ipfsData.studentName.trim() === '') {
                throw new Error('Student name is missing or empty');
            }
            if (!ipfsData.registrationNumber || ipfsData.registrationNumber.trim() === '') {
                throw new Error('Registration number is missing or empty');
            }
            if (!ipfsData.fileName || ipfsData.fileName.trim() === '') {
                throw new Error('File name is missing or empty');
            }
            if (!ipfsData.ipfsUrl || ipfsData.ipfsUrl.trim() === '') {
                throw new Error('IPFS URL is missing or empty');
            }
            if (!ipfsData.fileHash || ipfsData.fileHash.trim() === '') {
                throw new Error('File hash is missing or empty');
            }
            
            console.log('✅ All required fields validated');
            
            // Check if MetaMask is installed
            if (typeof window.ethereum === 'undefined') {
                throw new Error('Please install MetaMask to continue')
            }

            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' })

            // Create provider and signer
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            const userAddress = await signer.getAddress()

            // Check network
            const network = await provider.getNetwork()
            if (network.chainId !== 80002n) {
                // Switch to Polygon Amoy
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x13882' }], // 80002 in hex
                    })
                    // Retry with new network
                    return await registerOnBlockchain(ipfsData, certificateName)
                } catch (switchError: any) {
                    if (switchError.code === 4902) {
                        // Network doesn't exist, add it with multiple RPC endpoints
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: '0x13882',
                                chainName: 'Polygon Amoy Testnet',
                                nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
                                rpcUrls: [
                                    'https://rpc-amoy.polygon.technology',
                                    'https://polygon-amoy.drpc.org',
                                    'https://polygon-amoy-bor-rpc.publicnode.com'
                                ],
                                blockExplorerUrls: ['https://amoy.polygonscan.com/']
                            }]
                        })
                        // Retry after adding network
                        return await registerOnBlockchain(ipfsData, certificateName)
                    } else {
                        throw switchError
                    }
                }
            }
            
            // Check balance
            const balance = await provider.getBalance(userAddress)
            if (balance === 0n) {
                throw new Error('Insufficient POL balance. Please get testnet POL from https://faucet.polygon.technology/')
            }

            // Get contract address from env
            const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS
            if (!contractAddress) {
                throw new Error('Contract address not configured')
            }

            // Create contract instance
            const contract = new ethers.Contract(contractAddress, contractABI.abi, signer)

            // Check if certificate already exists
            try {
                const exists = await contract.certificateExists(ipfsData.fileHash)
                if (exists) {
                    throw new Error('This certificate is already registered on the blockchain')
                }
            } catch (checkError: any) {
                if (checkError.message?.includes('already registered')) {
                    throw checkError
                }
                // If check fails, proceed anyway - contract will reject if duplicate
                console.warn('Could not check certificate existence, proceeding:', checkError)
            }

            // Check for pending transactions
            const pendingNonce = await provider.getTransactionCount(userAddress, 'pending')
            const confirmedNonce = await provider.getTransactionCount(userAddress, 'latest')
            
            if (pendingNonce > confirmedNonce) {
                throw new Error(`You have ${pendingNonce - confirmedNonce} pending transaction(s). Please wait for them to confirm or cancel them in MetaMask before uploading a new certificate.`)
            }

            // Register certificate on blockchain
            showToast('Please confirm transaction in MetaMask...', 'success')

            // Estimate gas first to catch errors early
            let gasEstimate;
            try {
                console.log('⛽ Estimating gas with params:', {
                    studentName: ipfsData.studentName,
                    registrationNumber: ipfsData.registrationNumber,
                    fileName: ipfsData.fileName,
                    ipfsUrl: ipfsData.ipfsUrl.substring(0, 50) + '...',
                    fileHash: ipfsData.fileHash.substring(0, 20) + '...'
                });
                
                gasEstimate = await contract.registerCertificate.estimateGas(
                    ipfsData.studentName,
                    ipfsData.registrationNumber,
                    ipfsData.fileName,
                    ipfsData.ipfsUrl,
                    ipfsData.fileHash
                );
                
                console.log('✅ Gas estimated:', gasEstimate.toString());
            } catch (estimateError: any) {
                console.error('❌ Gas estimation failed:', estimateError);
                
                // Try to extract meaningful error from the revert reason
                let errorMessage = 'Transaction would fail. ';
                
                if (estimateError.message?.includes('already registered') || 
                    estimateError.reason?.includes('already registered')) {
                    errorMessage = 'This certificate is already registered on the blockchain';
                } else if (estimateError.message?.includes('Student name cannot be empty')) {
                    errorMessage = 'Student name is empty';
                } else if (estimateError.message?.includes('Registration number cannot be empty')) {
                    errorMessage = 'Registration number is empty';
                } else if (estimateError.message?.includes('File name cannot be empty')) {
                    errorMessage = 'File name is empty';
                } else if (estimateError.message?.includes('IPFS URL cannot be empty')) {
                    errorMessage = 'IPFS URL is empty';
                } else if (estimateError.message?.includes('File hash cannot be empty')) {
                    errorMessage = 'File hash is empty';
                } else if (estimateError.data) {
                    // Try to decode the error data
                    errorMessage += 'Contract reverted. Check console for details.';
                } else {
                    errorMessage += estimateError.message || 'Unknown error';
                }
                
                throw new Error(errorMessage);
            }

            // Send transaction with explicit gas settings
            const tx = await contract.registerCertificate(
                ipfsData.studentName,
                ipfsData.registrationNumber,
                ipfsData.fileName,
                ipfsData.ipfsUrl,
                ipfsData.fileHash,
                {
                    gasLimit: gasEstimate * 120n / 100n, // Add 20% buffer
                }
            )

            showToast('Transaction sent! Waiting for confirmation...', 'success')
            const receipt = await tx.wait()

            showToast('Blockchain registration successful!', 'success')

            // Save blockchain data to backend
            const token = localStorage.getItem('token')
            await axios.post(
                API_ENDPOINTS.CERTIFICATES.SAVE_BLOCKCHAIN,
                {
                    studentId: ipfsData.studentId,
                    certificateName: ipfsData.certificateName,
                    ipfsHash: ipfsData.ipfsHash,
                    fileHash: ipfsData.fileHash,
                    fileName: ipfsData.fileName,
                    fileSize: ipfsData.fileSize,
                    blockchainTxHash: receipt.hash,
                    blockchainBlockNumber: receipt.blockNumber
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            )

            // Show blockchain popup
            setBlockchainTxData({
                show: true,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                certificateName: certificateName
            })

            // Reset form and refresh
            setCertificates([{ id: Date.now().toString(), name: '', file: null, uploading: false, uploaded: false }])
            if (student) {
                fetchUploadedCertificates(student._id)
            }

        } catch (error: any) {
            console.error('Blockchain registration error:', error)

            // Better error messages
            let errorMessage = 'Blockchain registration failed'
            if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
                errorMessage = 'Transaction rejected by user'
            } else if (error.message?.includes('insufficient funds')) {
                errorMessage = 'Insufficient POL balance for gas fees'
            } else if (error.message?.includes('nonce')) {
                errorMessage = 'Transaction nonce error. Please try again'
            } else if (error.message) {
                errorMessage = error.message
            }

            throw new Error(errorMessage)
        }
    }
    */

    const uploadCertificate = async (cert: typeof certificates[0]) => {
        if (!cert.name || !cert.file) {
            showToast('Please provide certificate name and file', 'error')
            return
        }

        // Check cooldown
        if (uploadCooldown) {
            showToast(`Please wait ${cooldownSeconds} seconds before uploading another certificate`, 'error')
            return
        }

        // Mark as uploading
        setCertificates(certificates.map(c =>
            c.id === cert.id ? { ...c, uploading: true } : c
        ))

        try {
            const token = localStorage.getItem('token')
            if (!token) {
                showToast('Please login again', 'error')
                return
            }

            const formData = new FormData()
            formData.append('certificate', cert.file)
            formData.append('certificateName', cert.name)

            // Step 1: Upload to IPFS via backend
            const response = await axios.post(
                API_ENDPOINTS.CERTIFICATES.UPLOAD(student!._id),
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            )

            if (response.data.success) {
                const uploadedData = response.data.data

                // Step 2: Register on blockchain
                showToast('Registering on blockchain...', 'success')
                
                const blockchainResult = await registerCertificateOnBlockchain({
                    studentName: student!.name,
                    registrationNumber: student!.registrationNumber,
                    fileName: uploadedData.fileName,
                    ipfsUrl: uploadedData.ipfsUrl,
                    fileHash: uploadedData.fileHash
                })

                if (!blockchainResult.success) {
                    // Enhanced error messages
                    let enhancedError = blockchainResult.error
                    if (blockchainResult.error.includes("already registered")) {
                        enhancedError = "🔒 This certificate is already registered on the blockchain! Each certificate can only be registered once to maintain data integrity."
                    } else if (blockchainResult.error.includes("execution reverted")) {
                        enhancedError = "⛓️ Blockchain transaction was rejected. Please check your wallet connection and try again."
                    } else if (blockchainResult.error.includes("user rejected") || blockchainResult.error.includes("User denied")) {
                        enhancedError = "❌ Transaction was cancelled by user. Please approve the transaction in MetaMask to complete the registration."
                    } else if (blockchainResult.error.includes("insufficient funds")) {
                        enhancedError = "💰 Insufficient funds for gas fees. Please ensure you have enough MATIC in your wallet."
                    }

                    showToast(enhancedError, 'error')
                    
                    // Reset uploading state
                    setCertificates(certificates.map(c =>
                        c.id === cert.id ? { ...c, uploading: false } : c
                    ))
                    return
                }

                // Step 3: Save blockchain data to backend
                await axios.post(
                    API_ENDPOINTS.CERTIFICATES.SAVE_BLOCKCHAIN,
                    {
                        studentId: student!._id,
                        certificateName: cert.name,
                        ipfsHash: uploadedData.ipfsHash,
                        fileHash: uploadedData.fileHash,
                        fileName: uploadedData.fileName,
                        fileSize: uploadedData.fileSize,
                        blockchainTxHash: blockchainResult.txHash
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                )

                // Show success modal
                setBlockchainTxHash(blockchainResult.txHash)
                setBlockchainCertName(cert.name)
                setBlockchainModalVisible(true)

                // Start cooldown (10 seconds)
                setUploadCooldown(true)
                setCooldownSeconds(10)
                
                // Countdown timer
                const cooldownInterval = setInterval(() => {
                    setCooldownSeconds(prev => {
                        if (prev <= 1) {
                            clearInterval(cooldownInterval)
                            setUploadCooldown(false)
                            return 0
                        }
                        return prev - 1
                    })
                }, 1000)

                // Reset the form
                setCertificates(certificates.filter(c => c.id !== cert.id))
                
                // If no certificates left, add a fresh one
                if (certificates.length === 1) {
                    setCertificates([{ id: Date.now().toString(), name: '', file: null, uploading: false, uploaded: false }])
                }
                
                // Refresh certificates list and reset to page 1
                if (student) {
                    setCurrentPage(1) // Show newest certificate on page 1
                    fetchUploadedCertificates(student._id)
                }
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to upload certificate'
            showToast(message, 'error')
            // Reset uploading state
            setCertificates(certificates.map(c =>
                c.id === cert.id ? { ...c, uploading: false } : c
            ))
        }
    }



    const fetchUploadedCertificates = async (studentId: string) => {
        setLoadingCertificates(true)
        try {
            const token = localStorage.getItem('token')
            if (!token) return

            const response = await axios.get(
                API_ENDPOINTS.CERTIFICATES.GET_STUDENT_CERTS(studentId),
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            if (response.data.success) {
                // Sort certificates by date - newest first
                const certificates = response.data.data.certificates || []
                const sortedCertificates = certificates.sort((a: any, b: any) => {
                    return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
                })
                setUploadedCertificates(sortedCertificates)
            }
        } catch (error: any) {
            console.error('Failed to fetch certificates:', error)
        } finally {
            setLoadingCertificates(false)
        }
    }

    return (
        <div className="h-full flex p-6 gap-6">
            {/* Left Side - Student Details (Black & White) */}
            <div className="w-80 bg-white dark:bg-neutral-900 border-2 border-black dark:border-white rounded-xl p-6 flex flex-col">
                {/* Back Button */}
                {onBack && (
                    <button
                        onClick={handleBack}
                        className="mb-6 flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="text-sm font-medium">Back</span>
                    </button>
                )}

                {/* Student Icon */}
                <div className="mb-6">
                    <div className="h-20 w-20 rounded-full border-2 border-black dark:border-white flex items-center justify-center">
                        <User className="h-10 w-10 text-black dark:text-white" />
                    </div>
                </div>

                {/* Student Details */}
                <div className="space-y-6 flex-1">
                    <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">Student Name</p>
                        <p className="text-lg font-semibold text-black dark:text-white">{student.name}</p>
                    </div>

                    <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">Registration No.</p>
                        <p className="text-base font-medium text-black dark:text-white">{student.registrationNumber}</p>
                    </div>

                    <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">Branch</p>
                        <p className="text-base font-medium text-black dark:text-white">{student.branch}</p>
                    </div>

                    <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">Current Year</p>
                        <p className="text-base font-medium text-black dark:text-white">Year {student.currentYear}</p>
                    </div>

                    <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">Academic Year</p>
                        <p className="text-base font-medium text-black dark:text-white">{student.academicYear}</p>
                    </div>

                    {student.specialization && (
                        <div>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">Specialization</p>
                            <p className="text-base font-medium text-black dark:text-white">{student.specialization}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side - Certificate Upload Form */}
            <div className="flex-1 bg-white dark:bg-neutral-900 p-10 overflow-y-auto">
                <div className="max-w-5xl">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Award className="h-8 w-8 text-neutral-900 dark:text-neutral-100" />
                                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                                    Issue Certificates
                                </h1>
                            </div>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                Upload certificates for {student.name}
                            </p>
                        </div>
                        <Button onClick={addCertificateRow} variant="outline" size="sm">
                            <Upload className="mr-2 h-4 w-4" />
                            Add Certificate
                        </Button>
                    </div>

                    {/* Certificate Rows */}
                    <div className="space-y-4 mb-6">
                        {certificates.map((cert) => (
                            <div
                                key={cert.id}
                                className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4"
                            >
                                <div className="flex gap-4 items-start">
                                    {/* Left: Certificate Name */}
                                    <div className="flex-1">
                                        <Label htmlFor={`cert-name-${cert.id}`} className="text-sm font-medium mb-2 block">
                                            Certificate Name *
                                        </Label>
                                        <Input
                                            id={`cert-name-${cert.id}`}
                                            type="text"
                                            value={cert.name}
                                            onChange={(e) => updateCertificateName(cert.id, e.target.value)}
                                            placeholder="e.g., semester 1, main grade sheet"
                                            disabled={cert.uploaded}
                                        />
                                    </div>

                                    {/* Right: File Upload */}
                                    <div className="flex-1">
                                        <Label className="text-sm font-medium mb-2 block">
                                            Certificate File (PDF) *
                                        </Label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    id={`cert-file-${cert.id}`}
                                                    accept="application/pdf"
                                                    onChange={(e) => updateCertificateFile(cert.id, e.target.files?.[0] || null)}
                                                    className="hidden"
                                                    disabled={cert.uploaded}
                                                />
                                                <label
                                                    htmlFor={`cert-file-${cert.id}`}
                                                    className={`flex items-center justify-center gap-2 h-10 px-4 border-2 border-dashed rounded-md cursor-pointer transition-colors ${cert.file
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                        : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600'
                                                        } ${cert.uploaded ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {cert.file ? (
                                                        <>
                                                            <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                            <span className="text-sm text-neutral-900 dark:text-neutral-100 truncate">
                                                                {cert.file.name}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="h-4 w-4 text-neutral-500" />
                                                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                                                Choose file
                                                            </span>
                                                        </>
                                                    )}
                                                </label>
                                            </div>

                                            {/* Upload Button */}
                                            {!cert.uploaded && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => uploadCertificate(cert)}
                                                    disabled={cert.uploading || !cert.name || !cert.file || uploadCooldown}
                                                >
                                                    {cert.uploading ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : uploadCooldown ? (
                                                        `Wait ${cooldownSeconds}s`
                                                    ) : (
                                                        'Upload'
                                                    )}
                                                </Button>
                                            )}

                                            {/* Status/Remove Button */}
                                            {cert.uploaded ? (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                    <span className="text-sm text-green-700 dark:text-green-300">Uploaded</span>
                                                </div>
                                            ) : (
                                                certificates.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeCertificateRow(cert.id)}
                                                        disabled={cert.uploading}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>



                    {/* Uploaded Certificates Section */}
                    <div className="mt-12 border-t border-neutral-200 dark:border-neutral-700 pt-8">
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                            Uploaded Certificates
                        </h2>

                        {loadingCertificates ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                            </div>
                        ) : uploadedCertificates.length === 0 ? (
                            <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
                                <p className="text-neutral-600 dark:text-neutral-400">
                                    No certificates uploaded yet
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                    <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                        {uploadedCertificates
                                            .slice((currentPage - 1) * certificatesPerPage, currentPage * certificatesPerPage)
                                            .map((cert) => (
                                                <div
                                                    key={cert._id}
                                                    className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        {/* Left: Certificate Info */}
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                                    {cert.certificateName}
                                                                </h3>
                                                            </div>
                                                            <div className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                                                                <p>File: {cert.fileName}</p>
                                                                <p>Size: {(cert.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                                                                <p>Uploaded: {new Date(cert.issuedAt).toLocaleString()}</p>
                                                                {cert.blockchainVerified && cert.blockchainBlockNumber && (
                                                                    <p className="text-green-600 dark:text-green-400 font-medium">
                                                                        Block: #{cert.blockchainBlockNumber}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Right: Actions & Status */}
                                                        <div className="flex flex-col gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${cert.ipfsHash}`, '_blank')}
                                                            >
                                                                View on IPFS
                                                            </Button>
                                                            
                                                            {/* Blockchain Verification Badge */}
                                                            {cert.blockchainVerified && cert.blockchainTxHash ? (
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex items-center gap-2 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                                                                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                                        <span className="text-xs font-medium text-green-700 dark:text-green-300">
                                                                            On Blockchain
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => window.open(`https://amoy.polygonscan.com/tx/${cert.blockchainTxHash}`, '_blank')}
                                                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline text-left"
                                                                    >
                                                                        View Transaction
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                                                                    <X className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                                                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                                                                        Not on Blockchain
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                {/* Pagination */}
                                {uploadedCertificates.length > certificatesPerPage && (
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                            Showing {((currentPage - 1) * certificatesPerPage) + 1} to {Math.min(currentPage * certificatesPerPage, uploadedCertificates.length)} of {uploadedCertificates.length} certificates
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(uploadedCertificates.length / certificatesPerPage), prev + 1))}
                                                disabled={currentPage >= Math.ceil(uploadedCertificates.length / certificatesPerPage)}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Blockchain Success Modal */}
            <BlockchainSuccessModal
                visible={blockchainModalVisible}
                onClose={() => setBlockchainModalVisible(false)}
                txHash={blockchainTxHash}
                certificateName={blockchainCertName}
            />
        </div>
    )
}
