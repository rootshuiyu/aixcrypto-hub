const hre = require("hardhat");

async function main() {
  console.log("🚀 開始部署 SuperoctopVault 合約...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 部署者地址:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 部署者餘額:", hre.ethers.formatEther(balance), "ETH\n");

  console.log("📦 正在部署合約...");
  const Vault = await hre.ethers.getContractFactory("SuperoctopVault");
  const vault = await Vault.deploy();
  
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  
  console.log("\n✅ SuperoctopVault 已部署!");
  console.log("📍 合約地址:", vaultAddress);
  console.log("🔗 網絡:", hre.network.name);

  console.log("\n" + "=".repeat(60));
  console.log("📋 請將以下配置添加到 server/.env:");
  console.log("=".repeat(60));
  console.log(`VAULT_CONTRACT_ADDRESS=${vaultAddress}`);
  console.log(`\n🔗 查看合約: https://sepolia.etherscan.io/address/${vaultAddress}`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失敗:", error);
    process.exit(1);
  });
