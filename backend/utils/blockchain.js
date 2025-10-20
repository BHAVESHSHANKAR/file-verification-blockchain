const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load blockchain configuration
const configPath = path.join(__dirname, '../blockchain-config.json');
let config = {};
if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// Load contract ABI
const abiPath = path.join(__dirname, '../../blockchain/artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json');
let contractABI = [];
if (fs.existsSync(abiPath)) {
    const artifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    contractABI = artifact.abi;
}

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://rpc-amoy.polygon.technology');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Initialize contract
const contractAddress = process.env.CONTRACT_ADDRESS || config.contractAddress;
const contract = contractAddress ? new ethers.Contract(contractAddress, contractABI, wallet) : null;

/**
 * Register a certificate on the blockchain
 * @param {Object} certData - Certificate data
 * @returns {Promise<Object>} Transaction receipt
 */
async function registerCertificateOnChain(certData) {
    try {
        if (!contract) {
            throw new Error('Contract not initialized. Please deploy the contract first.');
        }

        const { studentName, registrationNumber, fileName, ipfsUrl, fileHash } = certData;

        console.log('Registering certificate on blockchain...');
        console.log('Student:', studentName);
        console.log('File Hash:', fileHash);

        // Call the smart contract
        const tx = await contract.registerCertificate(
            studentName,
            registrationNumber,
            fileName,
            ipfsUrl,
            fileHash
        );

        console.log('Transaction sent:', tx.hash);

        // Wait for transaction confirmation
        const receipt = await tx.wait();

        console.log('Transaction confirmed in block:', receipt.blockNumber);

        return {
            success: true,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            contractAddress: contractAddress
        };
    } catch (error) {
        console.error('Blockchain registration error:', error);
        throw error;
    }
}

/**
 * Verify a certificate on the blockchain
 * @param {string} fileHash - SHA-512 hash of the certificate
 * @returns {Promise<Object>} Certificate data
 */
async function verifyCertificateOnChain(fileHash) {
    try {
        if (!contract) {
            throw new Error('Contract not initialized');
        }

        console.log('Verifying certificate on blockchain...');
        console.log('File Hash:', fileHash);

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
 * Get total certificates count
 * @returns {Promise<number>} Total certificates
 */
async function getTotalCertificates() {
    try {
        if (!contract) {
            throw new Error('Contract not initialized');
        }

        const total = await contract.getTotalCertificates();
        return Number(total);
    } catch (error) {
        console.error('Error getting total certificates:', error);
        throw error;
    }
}

module.exports = {
    registerCertificateOnChain,
    verifyCertificateOnChain,
    getTotalCertificates,
    contract,
    provider,
    wallet
};
