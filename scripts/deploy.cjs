const { ethers } = require("hardhat");

async function main() {
  const Factory = await ethers.getContractFactory("PrivateLending");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  console.log("PrivateLending deployed:", await contract.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});