const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying UniversityRegistrySepolia contract to Sepolia...");

  // Get the contract factory
  const UniversityRegistrySepolia = await hre.ethers.getContractFactory("UniversityRegistrySepolia");
  
  // Deploy the contract
  const universityRegistry = await UniversityRegistrySepolia.deploy();
  
  await universityRegistry.waitForDeployment();
  
  const contractAddress = await universityRegistry.getAddress();
  
  console.log("UniversityRegistrySepolia deployed to:", contractAddress);

  // Save contract address and ABI
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: "sepolia",
    chainId: 11155111,
    deployedAt: new Date().toISOString()
  };

  // Save to backend
  const backendPath = path.join(__dirname, "../../backend/university-registry-sepolia-config.json");
  fs.writeFileSync(backendPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to backend/university-registry-sepolia-config.json");

  // Save to frontend
  const frontendPath = path.join(__dirname, "../../frontend/src/university-registry-sepolia-config.json");
  fs.writeFileSync(frontendPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to frontend/src/university-registry-sepolia-config.json");

  // Copy ABI to frontend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/UniversityRegistrySepolia.sol/UniversityRegistrySepolia.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  const abiPath = path.join(__dirname, "../../frontend/src/UniversityRegistrySepolia.json");
  fs.writeFileSync(abiPath, JSON.stringify({ abi: artifact.abi }, null, 2));
  console.log("ABI saved to frontend/src/UniversityRegistrySepolia.json");

  console.log("\nDeployment completed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("\nNext steps:");
  console.log("1. Update backend/.env with UNIVERSITY_REGISTRY_SEPOLIA_ADDRESS");
  console.log("2. Update frontend/.env with VITE_UNIVERSITY_REGISTRY_SEPOLIA_ADDRESS");
  console.log("3. Run the migration script to register existing universities");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
