import { ethers } from 'ethers';
import contractABI from '../CertificateRegistry.json';

// ✅ Contract address from environment
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

// ✅ Minimal ABI - only functions we actually use
const CERTIFICATE_ABI = contractABI.abi;

// Debug log (remove in production)
console.log('🔧 Blockchain config loaded:', {
    contractAddress: CONTRACT_ADDRESS,
    abiLoaded: CERTIFICATE_ABI && CERTIFICATE_ABI.length > 0
});

/**
 * 🔌 Connect to contract (following your previous project pattern)
 */
export const connectToContract = async () => {
    if (!window.ethereum) {
        throw new Error("MetaMask not installed");
    }

    if (!CONTRACT_ADDRESS) {
        throw new Error("Contract address not configured");
    }

    if (!CERTIFICATE_ABI || CERTIFICATE_ABI.length === 0) {
        throw new Error("Contract ABI not loaded");
    }

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CERTIFICATE_ABI, signer);

    return contract;
};

/**
 * ⛓️ Register certificate on blockchain (Simple pattern from your previous project)
 */
export const registerCertificateOnBlockchain = async (certData: {
    studentName: string;
    registrationNumber: string;
    fileName: string;
    ipfsUrl: string;
    fileHash: string;
}) => {
    try {
        // Check and switch to correct network first
        if (!window.ethereum) {
            throw new Error('MetaMask not installed');
        }

        const tempProvider = new ethers.BrowserProvider(window.ethereum);
        const network = await tempProvider.getNetwork();
        
        console.log('🌐 Current network:', network.chainId.toString());
        
        if (network.chainId !== 80002n) {
            console.log('⚠️ Wrong network detected. Switching to Polygon Amoy...');
            try {
                await switchToPolygonAmoy();
                console.log('✅ Switched to Polygon Amoy');
                // Wait a bit for network to stabilize
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (switchError: any) {
                return {
                    success: false,
                    error: 'Please switch to Polygon Amoy testnet in MetaMask and try again.'
                };
            }
        }

        const contract = await connectToContract();

        const { studentName, registrationNumber, fileName, ipfsUrl, fileHash } = certData;

        // First check if certificate already exists
        console.log('🔍 Checking if certificate exists on blockchain...');
        const exists = await contract.certificateExists(fileHash);
        
        if (exists) {
            console.error('❌ Certificate already exists on blockchain');
            return { 
                success: false, 
                error: 'This certificate is already registered on the blockchain. Each certificate can only be registered once.' 
            };
        }

        console.log('✅ Certificate not found, proceeding with registration...');

        // Get provider and signer to check for pending transactions
        if (!window.ethereum) {
            throw new Error('MetaMask not available');
        }
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        
        const pendingNonce = await provider.getTransactionCount(userAddress, 'pending');
        const confirmedNonce = await provider.getTransactionCount(userAddress, 'latest');
        
        console.log(`🔢 Nonce check - Pending: ${pendingNonce}, Confirmed: ${confirmedNonce}`);
        
        if (pendingNonce > confirmedNonce) {
            const pendingCount = pendingNonce - confirmedNonce;
            console.error(`⚠️ You have ${pendingCount} pending transaction(s)`);
            return {
                success: false,
                error: `You have ${pendingCount} pending transaction(s). Please wait for them to confirm or cancel them in MetaMask before uploading a new certificate.`
            };
        }
        
        console.log('✅ No pending transactions detected');

        // Estimate gas to catch errors early
        try {
            const gasEstimate = await contract.registerCertificate.estimateGas(
                studentName,
                registrationNumber,
                fileName,
                ipfsUrl,
                fileHash
            );
            console.log('⛽ Gas estimate:', gasEstimate.toString());
        } catch (estimateError: any) {
            console.error('❌ Gas estimation failed:', estimateError);
            
            // Parse error message
            let errorMessage = 'Transaction would fail: ';
            if (estimateError.message?.includes('already registered')) {
                errorMessage = 'This certificate is already registered on the blockchain';
            } else if (estimateError.reason) {
                errorMessage += estimateError.reason;
            } else {
                errorMessage += estimateError.message || 'Unknown error';
            }
            
            return { success: false, error: errorMessage };
        }

        // Call smart contract with explicit gas limit
        console.log('📝 Sending transaction to blockchain...');
        const tx = await contract.registerCertificate(
            studentName,
            registrationNumber,
            fileName,
            ipfsUrl,
            fileHash,
            {
                gasLimit: 700000 // Set explicit gas limit to avoid estimation issues
            }
        );

        console.log('⏳ Waiting for transaction confirmation...');
        console.log('Transaction hash:', tx.hash);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        
        console.log('✅ Transaction confirmed:', receipt.hash);

        return { 
            success: true, 
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber 
        };
    } catch (err: any) {
        console.error("❌ Blockchain error:", err);
        
        // Better error messages
        let errorMessage = err.message || 'Blockchain transaction failed';
        
        // User rejected transaction
        if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
            errorMessage = 'Transaction was cancelled by user. Please approve the transaction in MetaMask.';
        }
        // Already registered
        else if (err.message?.includes('already registered') || err.reason?.includes('already registered')) {
            errorMessage = 'This certificate is already registered on the blockchain';
        }
        // Internal JSON-RPC error (usually means contract revert)
        else if (err.code === -32603 || errorMessage.includes('Internal JSON-RPC error')) {
            errorMessage = 'Transaction failed. The certificate may already be registered or there was a contract error.';
        }
        // Insufficient funds
        else if (errorMessage.includes('insufficient funds')) {
            errorMessage = 'Insufficient MATIC balance for gas fees. Please add funds to your wallet.';
        }
        // Network error
        else if (errorMessage.includes('network')) {
            errorMessage = 'Network error. Please check your connection and try again.';
        }
        
        return { success: false, error: errorMessage };
    }
};

/**
 * 🔍 Verify certificate on blockchain
 * @param fileHash SHA-512 hash of the certificate
 */
export async function verifyCertificateOnBlockchain(fileHash: string) {
    try {
        const contract = await connectToContract();

        // Check if certificate exists
        const exists = await contract.certificateExists(fileHash);

        if (!exists) {
            return {
                success: false,
                exists: false,
                message: 'Certificate not found on blockchain'
            };
        }

        // Get certificate details
        const cert = await contract.getCertificate(fileHash);

        return {
            success: true,
            exists: true,
            certificate: {
                studentName: cert.studentName,
                registrationNumber: cert.registrationNumber,
                fileName: cert.fileName,
                ipfsUrl: cert.ipfsUrl,
                fileHash: cert.fileHash,
                universityAddress: cert.universityAddress,
                timestamp: new Date(Number(cert.timestamp) * 1000).toISOString()
            }
        };
    } catch (error) {
        console.error('Blockchain verification error:', error);
        throw error;
    }
}

/**
 * 📊 Get total certificates count
 */
export async function getTotalCertificates() {
    try {
        const contract = await connectToContract();
        const total = await contract.getTotalCertificates();
        return Number(total);
    } catch (error) {
        console.error('Error getting total certificates:', error);
        throw error;
    }
}

/**
 * 🔄 Switch to Polygon Amoy network
 */
export async function switchToPolygonAmoy() {
    if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
    }

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x13882' }], // 80002 in hex
        });
    } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: '0x13882',
                            chainName: 'Polygon Amoy Testnet',
                            nativeCurrency: {
                                name: 'MATIC',
                                symbol: 'MATIC',
                                decimals: 18
                            },
                            rpcUrls: ['https://rpc-amoy.polygon.technology'],
                            blockExplorerUrls: ['https://amoy.polygonscan.com/']
                        }
                    ]
                });
            } catch (addError) {
                throw addError;
            }
        } else {
            throw switchError;
        }
    }
}

export { CONTRACT_ADDRESS, CERTIFICATE_ABI };
