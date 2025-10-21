# 🔧 Revoke Feature Troubleshooting Guide

## ❌ Error: "Internal JSON-RPC error"

### Possible Causes:

1. **Certificate not on blockchain**
   - The certificate was uploaded before blockchain integration
   - The certificate upload failed but was saved to database
   - The fileHash is missing or incorrect

2. **Already revoked**
   - Certificate was already revoked
   - Trying to revoke twice

3. **Not the issuer**
   - Only the university that issued the certificate can revoke it
   - Wrong wallet connected in MetaMask

4. **Certificate doesn't exist**
   - FileHash doesn't match any certificate on blockchain
   - Wrong contract address

## ✅ Solutions

### Solution 1: Check Certificate Data

Open browser console (F12) and look for this log when clicking Revoke:
```
📋 Certificate data: {
    certificateName: "...",
    fileHash: "...",  // Should be a long hash
    blockchainVerified: true,  // Should be true
    blockchainTxHash: "0x..."  // Should exist
}
```

**If fileHash is missing or null:**
- This certificate was not properly registered on blockchain
- Cannot be revoked
- Need to re-upload the certificate

**If blockchainVerified is false:**
- Certificate is not on blockchain
- Cannot be revoked
- Only blockchain-verified certificates can be revoked

### Solution 2: Verify on Blockchain

Check if the certificate exists on blockchain:
1. Copy the `fileHash` from console
2. Go to your contract on Polygon Scan
3. Read Contract → `certificateExists`
4. Paste the fileHash
5. If returns `false`, certificate is not on blockchain

### Solution 3: Check Revocation Status

Before revoking, check if already revoked:
1. Go to contract on Polygon Scan
2. Read Contract → `getRevocationStatus`
3. Paste the fileHash
4. If `isRevoked` is `true`, already revoked

### Solution 4: Verify Wallet

Make sure you're using the correct wallet:
1. The wallet that uploaded the certificate
2. The university's wallet
3. Check MetaMask is connected to correct account

### Solution 5: Check Network

Ensure MetaMask is on Polygon Amoy:
- Network: Polygon Amoy Testnet
- Chain ID: 80002
- RPC: https://rpc-amoy.polygon.technology

## 🔍 Debugging Steps

### Step 1: Check Console Logs

Look for these logs in browser console:
```
🔍 Checking if certificate exists on blockchain...
✅ Certificate found on blockchain
🔍 Checking revocation status...
✅ Not revoked, proceeding...
⛽ Gas estimate: 123456
🚫 Revoking certificate with nonce: 11
```

**If you see:**
- `❌ Certificate not found on blockchain` → Certificate doesn't exist
- `❌ Certificate already revoked` → Already revoked
- `❌ Gas estimation failed` → Transaction would fail

### Step 2: Check Certificate in Database

The certificate should have:
```javascript
{
    certificateName: "...",
    fileName: "...",
    fileHash: "abc123...",  // SHA-512 hash
    ipfsHash: "Qm...",
    blockchainVerified: true,
    blockchainTxHash: "0x...",
    blockchainBlockNumber: 12345
}
```

### Step 3: Verify Smart Contract

Check the deployed contract address:
```
Frontend .env: VITE_CONTRACT_ADDRESS=0x532A0f21D040B1170D78f7a435C370486b89134d
Backend .env: CONTRACT_ADDRESS=0x532A0f21D040B1170D78f7a435C370486b89134d
```

Both should match!

### Step 4: Test with New Certificate

1. Upload a NEW certificate
2. Wait for blockchain confirmation
3. Verify it shows "On Blockchain" badge
4. Try to revoke it
5. Should work!

## 🐛 Common Issues

### Issue 1: Old Certificates

**Problem**: Certificates uploaded before blockchain integration don't have fileHash

**Solution**: 
- These certificates cannot be revoked
- They were never on blockchain
- Only show revoke button for `blockchainVerified === true`

### Issue 2: Wrong Contract

**Problem**: Frontend pointing to old contract address

**Solution**:
```bash
# Check frontend/.env
VITE_CONTRACT_ADDRESS=0x532A0f21D040B1170D78f7a435C370486b89134d

# Should match deployed contract
```

### Issue 3: Insufficient Gas

**Problem**: Not enough MATIC for gas fees

**Solution**:
- Get testnet MATIC from https://faucet.polygon.technology/
- Need ~0.0002 MATIC for revocation

### Issue 4: Nonce Issues

**Problem**: Pending transactions causing nonce conflicts

**Solution**:
- Wait for pending transactions to confirm
- Or cancel them in MetaMask
- Transaction queue should prevent this

## 📊 Expected Behavior

### Successful Revocation Flow:

```
1. User clicks "Revoke" button
   ↓
2. Modal opens
   ↓
3. User enters reason
   ↓
4. User clicks "Confirm Revocation"
   ↓
5. Frontend checks:
   - Certificate exists on blockchain ✓
   - Not already revoked ✓
   - User is issuer ✓
   ↓
6. Gas estimation succeeds ✓
   ↓
7. MetaMask prompts for approval
   ↓
8. User approves
   ↓
9. Transaction sent to blockchain
   ↓
10. Transaction confirms (~15-20 seconds)
    ↓
11. Backend updated with revocation data
    ↓
12. Success message shown
    ↓
13. Certificate shows "Revoked" badge
```

### Failed Revocation (Certificate Not on Blockchain):

```
1. User clicks "Revoke" button
   ↓
2. Modal opens
   ↓
3. User enters reason
   ↓
4. User clicks "Confirm Revocation"
   ↓
5. Frontend checks:
   - Certificate exists on blockchain ✗
   ↓
6. Error: "This certificate is not registered on the blockchain"
   ↓
7. Modal stays open
   ↓
8. User can cancel
```

## 🧪 Testing Checklist

- [ ] Upload a new certificate
- [ ] Wait for blockchain confirmation
- [ ] Verify "On Blockchain" badge appears
- [ ] Click "Revoke" button
- [ ] Modal opens correctly
- [ ] Enter revocation reason
- [ ] Click "Confirm Revocation"
- [ ] Check console for logs
- [ ] MetaMask prompts for approval
- [ ] Approve transaction
- [ ] Wait for confirmation
- [ ] Success message appears
- [ ] Certificate shows "Revoked" badge
- [ ] Try to revoke again (should fail)

## 📞 Still Having Issues?

1. **Check browser console** (F12) for detailed error logs
2. **Check MetaMask activity** for transaction status
3. **Verify on Polygon Scan** that contract is correct
4. **Check certificate data** has fileHash and blockchainVerified
5. **Try with a newly uploaded certificate**

## 🎯 Quick Fixes

### Fix 1: Restart Everything
```bash
# Stop frontend
Ctrl+C

# Restart frontend
cd frontend
npm run dev
```

### Fix 2: Clear MetaMask Activity
1. Open MetaMask
2. Go to Activity
3. Cancel any pending transactions
4. Try again

### Fix 3: Switch Networks
1. Switch to a different network in MetaMask
2. Switch back to Polygon Amoy
3. Try again

### Fix 4: Reconnect Wallet
1. Disconnect wallet from site
2. Refresh page
3. Reconnect wallet
4. Try again

---

**Most Common Issue**: Trying to revoke a certificate that was never registered on the blockchain. Only certificates with `blockchainVerified: true` can be revoked!
