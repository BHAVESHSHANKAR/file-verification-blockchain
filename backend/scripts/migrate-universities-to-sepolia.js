require('dotenv').config();
const mongoose = require('mongoose');
const { ethers } = require('ethers');
const University = require('../models/University');
const fs = require('fs');
const path = require('path');

// Load contract ABI and address
const contractConfigPath = path.join(__dirname, '../university-registry-sepolia-config.json');
const contractABIPath = path.join(__dirname, '../../frontend/src/UniversityRegistrySepolia.json');

// Configuration
const BATCH_SIZE = 10; // Number of universities to register in one batch
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds delay between batches
const DELAY_BETWEEN_SINGLE = 3000; // 3 seconds delay between single registrations

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
    try {
        log('\n========================================', 'cyan');
        log('University Migration to Sepolia Blockchain', 'cyan');
        log('========================================\n', 'cyan');

        // Connect to MongoDB
        log('📊 Connecting to MongoDB...', 'blue');
        await mongoose.connect(process.env.MONGO_URI);
        log('✅ Connected to MongoDB\n', 'green');

        // Load contract configuration
        log('📄 Loading contract configuration...', 'blue');
        if (!fs.existsSync(contractConfigPath)) {
            throw new Error('Contract config not found. Please deploy the contract first.');
        }
        if (!fs.existsSync(contractABIPath)) {
            throw new Error('Contract ABI not found. Please deploy the contract first.');
        }

        const contractConfig = JSON.parse(fs.readFileSync(contractConfigPath, 'utf8'));
        const contractABI = JSON.parse(fs.readFileSync(contractABIPath, 'utf8'));
        
        const CONTRACT_ADDRESS = process.env.UNIVERSITY_REGISTRY_SEPOLIA_ADDRESS || contractConfig.contractAddress;
        
        if (!CONTRACT_ADDRESS) {
            throw new Error('Contract address not found in environment variables or config file');
        }

        log(`✅ Contract Address: ${CONTRACT_ADDRESS}\n`, 'green');

        // Setup blockchain connection with fallback RPC URLs
        log('🔗 Connecting to Sepolia blockchain...', 'blue');
        
        const PRIVATE_KEY = process.env.PRIVATE_KEY;
        if (!PRIVATE_KEY) {
            throw new Error('PRIVATE_KEY not found in environment variables');
        }

        // Multiple RPC URLs for fallback
        const RPC_URLS = [
            process.env.RPC_URL_SEPOLIA,
            'https://ethereum-sepolia-rpc.publicnode.com',
            'https://rpc2.sepolia.org',
            'https://sepolia.infura.io/v3/04e1bddb3e4446658a1332bf68ff3904',
            'https://rpc.sepolia.org'
        ].filter(Boolean); // Remove null/undefined values

        let provider = null;
        let lastError = null;

        // Try each RPC URL until one works
        for (const rpcUrl of RPC_URLS) {
            try {
                log(`   Trying RPC: ${rpcUrl.substring(0, 50)}...`, 'blue');
                const tempProvider = new ethers.JsonRpcProvider(rpcUrl);
                
                // Test the connection
                await tempProvider.getBlockNumber();
                
                provider = tempProvider;
                log(`   ✅ Connected successfully!`, 'green');
                break;
            } catch (error) {
                log(`   ❌ Failed: ${error.message}`, 'red');
                lastError = error;
                continue;
            }
        }

        if (!provider) {
            throw new Error(`Failed to connect to Sepolia. All RPC URLs failed. Last error: ${lastError?.message}`);
        }

        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, wallet);

        log(`✅ Connected to Sepolia`, 'green');
        log(`📍 Wallet Address: ${wallet.address}\n`, 'cyan');

        // Check wallet balance
        const balance = await provider.getBalance(wallet.address);
        const balanceInEth = ethers.formatEther(balance);
        log(`💰 Wallet Balance: ${balanceInEth} ETH`, 'yellow');
        
        if (parseFloat(balanceInEth) < 0.01) {
            log('⚠️  Warning: Low balance! You may need more ETH for gas fees.', 'yellow');
            log('   Get Sepolia ETH from: https://sepoliafaucet.com/\n', 'yellow');
        } else {
            log('✅ Sufficient balance for migration\n', 'green');
        }

        // Fetch all universities from MongoDB
        log('🔍 Fetching universities from MongoDB...', 'blue');
        const universities = await University.find({ status: 'approved' }).select('name username email walletAddress status');
        
        if (universities.length === 0) {
            log('⚠️  No approved universities found in database', 'yellow');
            await mongoose.connection.close();
            return;
        }

        log(`✅ Found ${universities.length} approved universities\n`, 'green');

        // Validate wallet addresses
        log('🔍 Validating wallet addresses...', 'blue');
        const validUniversities = [];
        const invalidUniversities = [];

        for (const uni of universities) {
            if (!uni.walletAddress) {
                log(`   ⚠️  ${uni.name} - Missing wallet address`, 'yellow');
                invalidUniversities.push({ name: uni.name, reason: 'Missing wallet address' });
                continue;
            }

            // Check if wallet address is valid Ethereum address format
            if (!/^0x[a-fA-F0-9]{40}$/.test(uni.walletAddress)) {
                log(`   ⚠️  ${uni.name} - Invalid wallet address format: ${uni.walletAddress}`, 'yellow');
                invalidUniversities.push({ name: uni.name, reason: 'Invalid wallet address format' });
                continue;
            }

            validUniversities.push(uni);
        }

        if (invalidUniversities.length > 0) {
            log(`\n⚠️  Found ${invalidUniversities.length} universities with invalid wallet addresses:`, 'yellow');
            invalidUniversities.forEach((inv, index) => {
                log(`   ${index + 1}. ${inv.name} - ${inv.reason}`, 'yellow');
            });
            log('');
        }

        if (validUniversities.length === 0) {
            log('❌ No valid universities to register', 'red');
            await mongoose.connection.close();
            return;
        }

        log(`✅ ${validUniversities.length} universities ready for registration\n`, 'green');

        // Statistics
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;
        const errors = [];

        // Ask user for confirmation
        log('📋 Universities to be registered:', 'cyan');
        validUniversities.forEach((uni, index) => {
            log(`   ${index + 1}. ${uni.name} (${uni.email}) - ${uni.walletAddress}`, 'reset');
        });
        log('');

        // Decide registration method
        const useBatchRegistration = validUniversities.length >= 5;
        
        if (useBatchRegistration) {
            log(`🚀 Using BATCH registration (${BATCH_SIZE} universities per batch)`, 'cyan');
        } else {
            log(`🚀 Using SINGLE registration (one by one)`, 'cyan');
        }
        log('');

        // Start migration
        log('🔄 Starting migration...\n', 'blue');

        if (useBatchRegistration) {
            // Batch Registration
            for (let i = 0; i < validUniversities.length; i += BATCH_SIZE) {
                const batch = validUniversities.slice(i, i + BATCH_SIZE);
                const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
                const totalBatches = Math.ceil(validUniversities.length / BATCH_SIZE);

                log(`📦 Processing Batch ${batchNumber}/${totalBatches} (${batch.length} universities)...`, 'cyan');

                try {
                    // Check which universities are already registered
                    const toRegister = [];
                    for (const uni of batch) {
                        const isRegistered = await contract.isUniversityRegistered(uni.walletAddress);
                        if (isRegistered) {
                            log(`   ⏭️  ${uni.name} - Already registered on blockchain`, 'yellow');
                            
                            // Check if MongoDB needs updating
                            const dbRecord = await University.findById(uni._id);
                            if (!dbRecord.blockchainRegistered) {
                                log(`      📝 Updating MongoDB...`, 'blue');
                                try {
                                    const blockchainUni = await contract.getUniversity(uni.walletAddress);
                                    await University.findByIdAndUpdate(uni._id, {
                                        $set: {
                                            blockchainRegistered: true,
                                            blockchainTxHash: 'Already registered - check blockchain',
                                            blockchainNetwork: 'sepolia',
                                            blockchainRegisteredAt: new Date(Number(blockchainUni.registrationTimestamp) * 1000)
                                        }
                                    });
                                    log(`      ✅ MongoDB updated`, 'green');
                                } catch (updateError) {
                                    log(`      ⚠️  MongoDB update failed: ${updateError.message}`, 'yellow');
                                }
                            }
                            
                            skipCount++;
                        } else {
                            toRegister.push(uni);
                        }
                    }

                    if (toRegister.length === 0) {
                        log(`   ✅ All universities in this batch already registered\n`, 'green');
                        continue;
                    }

                    // Prepare batch data
                    const names = toRegister.map(u => u.name);
                    const usernames = toRegister.map(u => u.username);
                    const emails = toRegister.map(u => u.email);
                    const walletAddresses = toRegister.map(u => u.walletAddress);
                    const statuses = toRegister.map(u => u.status || 'approved');

                    // Estimate gas
                    log(`   ⛽ Estimating gas...`, 'blue');
                    const gasEstimate = await contract.batchRegisterUniversities.estimateGas(
                        names, usernames, emails, walletAddresses, statuses
                    );
                    log(`   ⛽ Estimated gas: ${gasEstimate.toString()}`, 'blue');

                    // Send transaction
                    log(`   📤 Sending batch transaction...`, 'blue');
                    const tx = await contract.batchRegisterUniversities(
                        names, usernames, emails, walletAddresses, statuses,
                        {
                            gasLimit: gasEstimate * 120n / 100n // 20% buffer
                        }
                    );

                    log(`   ⏳ Transaction sent: ${tx.hash}`, 'cyan');
                    log(`   ⏳ Waiting for confirmation...`, 'blue');

                    const receipt = await tx.wait();
                    
                    log(`   ✅ Batch registered successfully!`, 'green');
                    log(`   📍 Block: ${receipt.blockNumber}`, 'cyan');
                    log(`   🔗 View on Etherscan: https://sepolia.etherscan.io/tx/${receipt.hash}\n`, 'cyan');

                    successCount += toRegister.length;

                    // Update MongoDB records
                    for (const uni of toRegister) {
                        await University.findByIdAndUpdate(uni._id, {
                            $set: {
                                blockchainRegistered: true,
                                blockchainTxHash: receipt.hash,
                                blockchainNetwork: 'sepolia',
                                blockchainRegisteredAt: new Date()
                            }
                        });
                    }

                    // Delay before next batch
                    if (i + BATCH_SIZE < validUniversities.length) {
                        log(`   ⏸️  Waiting ${DELAY_BETWEEN_BATCHES / 1000} seconds before next batch...\n`, 'yellow');
                        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
                    }

                } catch (error) {
                    log(`   ❌ Batch registration failed: ${error.message}`, 'red');
                    errors.push({ batch: batchNumber, error: error.message });
                    errorCount += batch.length;
                }
            }
        } else {
            // Single Registration
            for (let i = 0; i < validUniversities.length; i++) {
                const uni = validUniversities[i];
                log(`[${i + 1}/${validUniversities.length}] Processing: ${uni.name}`, 'cyan');

                try {
                    // Check if already registered
                    const isRegistered = await contract.isUniversityRegistered(uni.walletAddress);
                    
                    if (isRegistered) {
                        log(`   ⏭️  Already registered on blockchain`, 'yellow');
                        
                        // Check if MongoDB is updated
                        const dbRecord = await University.findById(uni._id);
                        if (!dbRecord.blockchainRegistered) {
                            log(`   📝 Updating MongoDB record...`, 'blue');
                            
                            // Get university info from blockchain to get tx hash
                            try {
                                const blockchainUni = await contract.getUniversity(uni.walletAddress);
                                
                                await University.findByIdAndUpdate(uni._id, {
                                    $set: {
                                        blockchainRegistered: true,
                                        blockchainTxHash: 'Already registered - check blockchain',
                                        blockchainNetwork: 'sepolia',
                                        blockchainRegisteredAt: new Date(Number(blockchainUni.registrationTimestamp) * 1000)
                                    }
                                });
                                
                                log(`   ✅ MongoDB updated\n`, 'green');
                            } catch (updateError) {
                                log(`   ⚠️  Could not update MongoDB: ${updateError.message}\n`, 'yellow');
                            }
                        } else {
                            log(`   ✅ MongoDB already updated\n`, 'green');
                        }
                        
                        skipCount++;
                        continue;
                    }

                    // Register university
                    log(`   📤 Registering on blockchain...`, 'blue');
                    const tx = await contract.registerUniversity(
                        uni.name,
                        uni.username,
                        uni.email,
                        uni.walletAddress,
                        uni.status || 'approved'
                    );

                    log(`   ⏳ Transaction sent: ${tx.hash}`, 'cyan');
                    const receipt = await tx.wait();

                    log(`   ✅ Registered successfully!`, 'green');
                    log(`   📍 Block: ${receipt.blockNumber}`, 'cyan');
                    log(`   🔗 View: https://sepolia.etherscan.io/tx/${receipt.hash}`, 'cyan');

                    // Update MongoDB
                    await University.findByIdAndUpdate(uni._id, {
                        $set: {
                            blockchainRegistered: true,
                            blockchainTxHash: receipt.hash,
                            blockchainNetwork: 'sepolia',
                            blockchainRegisteredAt: new Date()
                        }
                    });

                    successCount++;
                    log(`   ✅ MongoDB updated\n`, 'green');

                    // Delay before next registration
                    if (i < validUniversities.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_SINGLE));
                    }

                } catch (error) {
                    log(`   ❌ Failed: ${error.message}\n`, 'red');
                    errors.push({ university: uni.name, error: error.message });
                    errorCount++;
                }
            }
        }

        // Final Summary
        log('\n========================================', 'cyan');
        log('Migration Summary', 'cyan');
        log('========================================', 'cyan');
        log(`✅ Successfully registered: ${successCount}`, 'green');
        log(`⏭️  Skipped (already registered): ${skipCount}`, 'yellow');
        log(`❌ Failed: ${errorCount}`, errorCount > 0 ? 'red' : 'reset');
        log(`⚠️  Invalid wallet addresses: ${invalidUniversities.length}`, invalidUniversities.length > 0 ? 'yellow' : 'reset');
        log(`📊 Total processed: ${validUniversities.length}`, 'blue');

        if (errors.length > 0) {
            log('\n❌ Errors:', 'red');
            errors.forEach((err, index) => {
                log(`   ${index + 1}. ${err.university || `Batch ${err.batch}`}: ${err.error}`, 'red');
            });
        }

        log('\n✅ Migration completed!', 'green');
        log('🔗 View contract on Etherscan:', 'cyan');
        log(`   https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}\n`, 'cyan');

        // Close MongoDB connection
        await mongoose.connection.close();
        log('📊 MongoDB connection closed', 'blue');

    } catch (error) {
        log(`\n❌ Migration failed: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    }
}

// Run migration
main()
    .then(() => {
        log('\n✅ Script completed successfully', 'green');
        process.exit(0);
    })
    .catch((error) => {
        log(`\n❌ Script failed: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    });
