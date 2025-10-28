const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying CertificateRegistrySeoplia contract to Sepolia...");

  // Get the contract factory
  const CertificateRegistrySeoplia = await hre.ethers.getContractFactory("CertificateRegistrySeoplia");
  
  // Deploy the contract
  const certificateRegistry = await CertificateRegistrySeoplia.deploy();
  
  await certificateRegistry.waitForDeployment();
  
  const contractAddress = await certificateRegistry.getAddress();
  
  console.log("CertificateRegistrySeoplia deployed to:", contractAddress);

  // Save contract address and ABI
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: "sepolia",
    chainId: 11155111,
    deployedAt: new Date().toISOString()
  };

  // Save to backend
  const backendPath = path.join(__dirname, "../../backend/blockchain-config-sepolia.json");
  fs.writeFileSync(backendPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to backend/blockchain-config-sepolia.json");

  // Save to frontend
  const frontendPath = path.join(__dirname, "../../frontend/src/blockchain-config-sepolia.json");
  fs.writeFileSync(frontendPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to frontend/src/blockchain-config-sepolia.json");

  // Copy ABI to frontend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/CertificateRegistrySeoplia.sol/CertificateRegistrySeoplia.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  const abiPath = path.join(__dirname, "../../frontend/src/CertificateRegistrySeoplia.json");
  fs.writeFileSync(abiPath, JSON.stringify({ abi: artifact.abi }, null, 2));
  console.log("ABI saved to frontend/src/CertificateRegistrySeoplia.json");

  console.log("\nDeployment completed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("\nNext steps:");
  console.log("1. Update backend/.env with CONTRACT_ADDRESS_SEPOLIA");
  console.log("2. Update frontend/.env with VITE_CONTRACT_ADDRESS_SEPOLIA");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
