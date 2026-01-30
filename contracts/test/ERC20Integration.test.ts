import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("SuperoctopVault - ERC20 Integration", function () {
  async function deployFixture() {
    const [owner, user1, user2] = await ethers.getSigners();
    
    const Vault = await ethers.getContractFactory("SuperoctopVault");
    const vault = await Vault.deploy();
    
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20Factory.deploy("USD Coin", "USDC", 6);
    
    const usdcAddress = await usdc.getAddress();
    await vault.setTokenSupport(usdcAddress, true);
    await vault.setWithdrawCooldown(0);
    
    await usdc.mint(user1.address, ethers.parseUnits("10000", 6));
    
    return { vault, usdc, owner, user1, user2 };
  }

  it("Should deposit and withdraw ERC20 tokens", async function () {
    const { vault, usdc, user1 } = await loadFixture(deployFixture);
    const usdcAddress = await usdc.getAddress();
    const vaultAddress = await vault.getAddress();
    const amount = ethers.parseUnits("1000", 6);

    await usdc.connect(user1).approve(vaultAddress, amount);
    await vault.connect(user1).depositToken(usdcAddress, amount);
    expect(await vault.getBalance(user1.address, usdcAddress)).to.equal(amount);

    await vault.connect(user1).withdrawToken(usdcAddress, amount);
    expect(await vault.getBalance(user1.address, usdcAddress)).to.equal(0);
  });
});
