# University Migration to Sepolia Blockchain

## Overview
This script migrates existing universities from MongoDB to the Sepolia blockchain by registering them in the UniversityRegistrySepolia smart contract.

## Prerequisites

### 1. Deploy the Smart Contract First
```bash
cd blockchainseoplia
npm run compile
npx hardhat run scripts/deploy-university-registry.js --network sepolia
```

### 2. Update Environment Variables

Add to `backend/.env`:
```env
UNIVERSITY_REGISTRY_SEPOLIA_ADDRESS=0x... (from deployment)
RPC_URL_SEPOLIA=https://rpc.sepolia.org
PRIVATE_KEY=your_private_key_here
```

### 3. Get Sepolia ETH
- Your wallet needs Sepolia ETH for gas fees
- Get free testnet ETH from: https://sepoliafaucet.com/
- Recommended: At least 0.1 ETH for smooth migration

## Running the Migration

### Step 1: Navigate to Backend
```bash
cd backend
```

### Step 2: Run Migration Script
```bash
node scripts/migrate-universities-to-sepolia.js
```

## What the Script Does

### 1. **Connects to MongoDB**
- Fetches all approved universities
- Filters by status: 'approved'

### 2. **Connects to Sepolia Blockchain**
- Uses your private key from .env
- Connects to Sepolia RPC
- Loads the UniversityRegistry contract

### 3. **Checks Existing Registrations**
- Verifies which universities are already registered
- Skips duplicates automatically

### 4. **Registration Methods**

**Batch Registration (5+ universities):**
- Registers 10 universities per batch
- More gas-efficient
- 5-second delay between batches
- Recommended for large datasets

**Single Registration (<5 universities):**
- Registers one by one
- More control and visibility
- 3-second delay between registrations
- Better for small datasets

### 5. **Updates MongoDB**
- Adds `blockchainRegistered: true`
- Stores transaction hash
- Records network ('sepolia')
- Timestamps registration

## Output Example

```
========================================
University Migration to Sepolia Blockchain
========================================

📊 Connecting to MongoDB...
✅ Connected to MongoDB

📄 Loading contract configuration...
✅ Contract Address: 0x1234...

🔗 Connecting to Sepolia blockchain...
✅ Connected to Sepolia
📍 Wallet Address: 0x5678...

💰 Wallet Balance: 0.5 ETH
✅ Sufficient balance for migration

🔍 Fetching universities from MongoDB...
✅ Found 15 approved universities

📋 Universities to be registered:
   1. Harvard University (admin@harvard.edu)
   2. MIT (admin@mit.edu)
   ...

🚀 Using BATCH registration (10 universities per batch)

🔄 Starting migration...

📦 Processing Batch 1/2 (10 universities)...
   ⛽ Estimating gas...
   ⛽ Estimated gas: 1200000
   📤 Sending batch transaction...
   ⏳ Transaction sent: 0xabc...
   ⏳ Waiting for confirmation...
   ✅ Batch registered successfully!
   📍 Block: 12345
   🔗 View on Etherscan: https://sepolia.etherscan.io/tx/0xabc...

========================================
Migration Summary
========================================
✅ Successfully registered: 15
⏭️  Skipped (already registered): 0
❌ Failed: 0
📊 Total processed: 15

✅ Migration completed!
🔗 View contract on Etherscan:
   https://sepolia.etherscan.io/address/0x1234...
```

## Gas Costs Estimation

- **Single Registration**: ~150,000 gas (~$0.50 at 30 gwei)
- **Batch of 10**: ~1,200,000 gas (~$4.00 at 30 gwei)
- **Total for 50 universities**: ~6,000,000 gas (~$20.00 at 30 gwei)

*Note: Sepolia is a testnet, so gas is free (just need testnet ETH)*

## Troubleshooting

### Error: "Insufficient funds"
**Solution**: Get more Sepolia ETH from faucet

### Error: "Contract config not found"
**Solution**: Deploy the contract first

### Error: "Nonce too low"
**Solution**: Wait a few seconds and try again

### Error: "Email already registered"
**Solution**: This is normal - the script skips duplicates

### Error: "Transaction timeout"
**Solution**: Increase gas limit or try again

## Safety Features

✅ **Duplicate Prevention**: Checks if already registered before attempting
✅ **Error Handling**: Continues with next university if one fails
✅ **MongoDB Backup**: Original data remains intact
✅ **Transaction Logging**: All transactions recorded
✅ **Delay Between Transactions**: Prevents nonce conflicts

## Post-Migration Verification

### 1. Check Contract on Etherscan
```
https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
```

### 2. Verify in MongoDB
Check that universities have:
- `blockchainRegistered: true`
- `blockchainTxHash: "0x..."`
- `blockchainNetwork: "sepolia"`

### 3. Query Contract
```javascript
// Check total universities
await contract.getTotalUniversities()

// Check specific university
await contract.getUniversity("0xWalletAddress")
```

## Re-running the Script

✅ **Safe to re-run**: The script automatically skips already registered universities
✅ **Idempotent**: Running multiple times won't create duplicates
✅ **Incremental**: Only processes new universities

## Support

If you encounter issues:
1. Check the error message in console
2. Verify environment variables are set
3. Ensure sufficient Sepolia ETH balance
4. Check MongoDB connection
5. Verify contract is deployed

## Success Criteria

✅ All universities show "Successfully registered"
✅ MongoDB records updated with blockchain data
✅ Contract shows correct total count
✅ Transaction hashes visible on Etherscan
✅ No errors in final summary

---

**Ready to migrate? Run the script and watch your universities get registered on the blockchain! 🚀**
