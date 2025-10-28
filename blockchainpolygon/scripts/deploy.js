const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying CertificateRegistry contract to Polygon Amoy...");

  // Get the contract factory
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  
  // Deploy the contract
  const certificateRegistry = await CertificateRegistry.deploy();
  
  await certificateRegistry.waitForDeployment();
  
  const contractAddress = await certificateRegistry.getAddress();
  
  console.log("CertificateRegistry deployed to:", contractAddress);

  // Save contract address and ABI
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: "polygonAmoy",
    chainId: 80002,
    deployedAt: new Date().toISOString()
  };

  // Save to backend
  const backendPath = path.join(__dirname, "../../backend/blockchain-config.json");
  fs.writeFileSync(backendPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to backend/blockchain-config.json");

  // Save to frontend
  const frontendPath = path.join(__dirname, "../../frontend/src/blockchain-config.json");
  fs.writeFileSync(frontendPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to frontend/src/blockchain-config.json");

  // Copy ABI to frontend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  const abiPath = path.join(__dirname, "../../frontend/src/CertificateRegistry.json");
  fs.writeFileSync(abiPath, JSON.stringify({ abi: artifact.abi }, null, 2));
  console.log("ABI saved to frontend/src/CertificateRegistry.json");

  console.log("\nDeployment completed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("\nNext steps:");
  console.log("1. Update backend/.env with CONTRACT_ADDRESS");
  console.log("2. Update frontend/.env with VITE_CONTRACT_ADDRESS");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
