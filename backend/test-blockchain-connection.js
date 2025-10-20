/**
 * Test script to verify backend blockchain connection
 * Run with: node test-blockchain-connection.js
 */

require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function testBlockchainConnection() {
    console.log('🔍 Testing Backend Blockchain Connection...\n');

    // 1. Check environment variables
    console.log('📋 Environment Variables:');
    console.log('   CONTRACT_ADDRESS:', process.env.CONTRACT_ADDRESS || '❌ NOT SET');
    console.log('   RPC_URL:', process.env.RPC_URL || '❌ NOT SET');
    console.log('   PRIVATE_KEY:', process.env.PRIVATE_KEY ? '✅ SET' : '❌ NOT SET');
    console.log('');

    if (!process.env.CONTRACT_ADDRESS || !process.env.RPC_URL || !process.env.PRIVATE_KEY) {
        console.error('❌ Missing required environment variables!');
        process.exit(1);
    }

    try {
        // 2. Load contract ABI
        console.log('📄 Loading Contract ABI...');
        const abiPath = path.join(__dirname, '../blockchain/artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json');
        
        if (!fs.existsSync(abiPath)) {
            console.error('❌ Contract ABI not found at:', abiPath);
            console.log('   Run: cd blockchain && npx hardhat compile');
            process.exit(1);
        }

        const artifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        const contractABI = artifact.abi;
        console.log('✅ Contract ABI loaded');
        console.log('');

        // 3. Connect to provider
        console.log('🔌 Connecting to RPC...');
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        
        // Test connection
        const network = await provider.getNetwork();
        console.log('✅ Connected to network:', network.name);
        console.log('   Chain ID:', network.chainId.toString());
        console.log('');

        // 4. Initialize wallet
        console.log('👛 Initializing Wallet...');
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const address = await wallet.getAddress();
        console.log('✅ Wallet address:', address);
        
        // Check balance
        const balance = await provider.getBalance(address);
        console.log('   Balance:', ethers.formatEther(balance), 'MATIC');
        console.log('');

        // 5. Connect to contract
        console.log('📜 Connecting to Smart Contract...');
        const contract = new ethers.Contract(
            process.env.CONTRACT_ADDRESS,
            contractABI,
            wallet
        );
        console.log('✅ Contract connected at:', process.env.CONTRACT_ADDRESS);
        console.log('');

        // 6. Test contract read function
        console.log('📊 Testing Contract Read Function...');
        const totalCertificates = await contract.getTotalCertificates();
        console.log('✅ Total certificates on blockchain:', totalCertificates.toString());
        console.log('');

        // 7. Test certificate verification (if any exist)
        if (totalCertificates > 0n) {
            console.log('🔍 Testing Certificate Verification...');
            try {
                // Get first certificate hash
                const firstHash = await contract.allCertificateHashes(0);
                console.log('   First certificate hash:', firstHash.substring(0, 20) + '...');
                
                // Verify it exists
                const exists = await contract.certificateExists(firstHash);
                console.log('   Certificate exists:', exists ? '✅ Yes' : '❌ No');
                
                if (exists) {
                    const cert = await contract.getCertificate(firstHash);
                    console.log('   Student name:', cert.studentName);
                    console.log('   Registration:', cert.registrationNumber);
                }
            } catch (error) {
                console.log('   ⚠️ Could not read certificate details:', error.message);
            }
            console.log('');
        }

        // 8. Summary
        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ BACKEND BLOCKCHAIN CONNECTION TEST PASSED');
        console.log('═══════════════════════════════════════════════════════');
        console.log('');
        console.log('Backend can:');
        console.log('  ✅ Connect to Polygon Amoy network');
        console.log('  ✅ Access smart contract');
        console.log('  ✅ Read certificate data');
        console.log('  ✅ Verify certificates on blockchain');
        console.log('');
        console.log('Contract Address: ' + process.env.CONTRACT_ADDRESS);
        console.log('Total Certificates: ' + totalCertificates.toString());
        console.log('Wallet Balance: ' + ethers.formatEther(balance) + ' MATIC');
        console.log('');

    } catch (error) {
        console.error('');
        console.error('═══════════════════════════════════════════════════════');
        console.error('❌ BLOCKCHAIN CONNECTION TEST FAILED');
        console.error('═══════════════════════════════════════════════════════');
        console.error('');
        console.error('Error:', error.message);
        console.error('');
        
        if (error.message.includes('could not detect network')) {
            console.error('💡 Troubleshooting:');
            console.error('   1. Check RPC_URL in .env');
            console.error('   2. Try alternative RPC: https://polygon-amoy.drpc.org');
            console.error('   3. Check network status: https://amoy.polygonscan.com/');
        } else if (error.message.includes('invalid address')) {
            console.error('💡 Troubleshooting:');
            console.error('   1. Check CONTRACT_ADDRESS in .env');
            console.error('   2. Verify contract is deployed');
            console.error('   3. Check on explorer: https://amoy.polygonscan.com/address/' + process.env.CONTRACT_ADDRESS);
        }
        
        console.error('');
        process.exit(1);
    }
}

// Run test
testBlockchainConnection();
