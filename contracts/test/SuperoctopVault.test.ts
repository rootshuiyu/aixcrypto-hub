import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("SuperoctopVault", function () {
  async function deployVaultFixture() {
    const [owner, user1, user2] = await ethers.getSigners();
    const Vault = await ethers.getContractFactory("SuperoctopVault");
    const vault = await Vault.deploy();
    return { vault, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);
      expect(await vault.owner()).to.equal(owner.address);
    });

    it("ETH should be supported by default", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      expect(await vault.supportedTokens(ethers.ZeroAddress)).to.be.true;
    });
  });

  describe("Deposits", function () {
    it("Should deposit ETH successfully", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      const depositAmount = ethers.parseEther("1.0");
      await expect(vault.connect(user1).depositETH({ value: depositAmount }))
        .to.emit(vault, "Deposit");
      expect(await vault.getBalance(user1.address, ethers.ZeroAddress)).to.equal(depositAmount);
    });

    it("Should reject deposits below minimum", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      const tooSmall = ethers.parseEther("0.00001");
      await expect(vault.connect(user1).depositETH({ value: tooSmall }))
        .to.be.revertedWithCustomError(vault, "InvalidAmount");
    });
  });

  describe("Withdrawals", function () {
    it("Should withdraw ETH after cooldown", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);
      await vault.connect(owner).setWithdrawCooldown(0);
      const depositAmount = ethers.parseEther("1.0");
      await vault.connect(user1).depositETH({ value: depositAmount });
      
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      const tx = await vault.connect(user1).withdrawETH(depositAmount);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(user1.address);
      
      expect(balanceAfter + gasUsed - balanceBefore).to.equal(depositAmount);
    });

    it("Should revert withdrawal if cooldown active", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      await vault.connect(user1).depositETH({ value: ethers.parseEther("1.0") });
      await expect(vault.connect(user1).withdrawETH(ethers.parseEther("0.5")))
        .to.be.revertedWithCustomError(vault, "CooldownActive");
    });
  });

  describe("Admin Functions", function () {
    it("Only owner can pause", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      await expect(vault.connect(user1).pause())
        .to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });
  });
});
