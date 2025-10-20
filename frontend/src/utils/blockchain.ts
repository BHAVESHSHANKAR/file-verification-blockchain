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
        const contract = await connectToContract();

        const { studentName, registrationNumber, fileName, ipfsUrl, fileHash } = certData;

        // Call smart contract - simple and direct
        const tx = await contract.registerCertificate(
            studentName,
            registrationNumber,
            fileName,
            ipfsUrl,
            fileHash
        );

        // Wait for confirmation
        await tx.wait();

        return { success: true, txHash: tx.hash };
    } catch (err: any) {
        console.error("Blockchain error:", err);
        
        // Better error message for common case
        let errorMessage = err.message || 'Blockchain transaction failed';
        
        if (err.code === -32603 || errorMessage.includes('Internal JSON-RPC error')) {
            errorMessage = 'Certificate already registered on blockchain';
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
