// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SuperoctopVault
 * @notice Superoctop 平台資金金庫合約
 */
contract SuperoctopVault is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    address public constant ETH_ADDRESS = address(0);
    uint256 public constant MIN_DEPOSIT = 0.0001 ether;
    uint256 public constant MAX_DEPOSIT = 100 ether;

    mapping(address => mapping(address => uint256)) public balances;
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public totalDeposited;
    mapping(address => uint256) public totalWithdrawn;
    mapping(address => uint256) public userDepositCount;
    mapping(address => uint256) public userWithdrawCount;
    mapping(address => uint256) public lastActionTime;
    uint256 public withdrawCooldown = 1 minutes;

    event Deposit(address indexed user, address indexed token, uint256 amount, uint256 timestamp);
    event Withdraw(address indexed user, address indexed token, uint256 amount, uint256 timestamp);
    event TokenWhitelistUpdated(address indexed token, bool supported);
    event EmergencyWithdraw(address indexed token, uint256 amount, address indexed to);
    event CooldownUpdated(uint256 oldCooldown, uint256 newCooldown);

    error InsufficientBalance();
    error InvalidAmount();
    error TokenNotSupported();
    error TransferFailed();
    error ZeroAddress();
    error CooldownActive();

    constructor() Ownable(msg.sender) {
        supportedTokens[ETH_ADDRESS] = true;
    }

    function depositETH() external payable nonReentrant whenNotPaused {
        if (msg.value < MIN_DEPOSIT) revert InvalidAmount();
        if (msg.value > MAX_DEPOSIT) revert InvalidAmount();
        
        balances[msg.sender][ETH_ADDRESS] += msg.value;
        totalDeposited[ETH_ADDRESS] += msg.value;
        userDepositCount[msg.sender]++;
        lastActionTime[msg.sender] = block.timestamp;
        
        emit Deposit(msg.sender, ETH_ADDRESS, msg.value, block.timestamp);
    }

    function depositToken(address token, uint256 amount) external nonReentrant whenNotPaused {
        if (token == address(0)) revert ZeroAddress();
        if (!supportedTokens[token]) revert TokenNotSupported();
        if (amount == 0) revert InvalidAmount();
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        balances[msg.sender][token] += amount;
        totalDeposited[token] += amount;
        userDepositCount[msg.sender]++;
        lastActionTime[msg.sender] = block.timestamp;
        
        emit Deposit(msg.sender, token, amount, block.timestamp);
    }

    function withdrawETH(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (balances[msg.sender][ETH_ADDRESS] < amount) revert InsufficientBalance();
        if (block.timestamp < lastActionTime[msg.sender] + withdrawCooldown) revert CooldownActive();
        
        balances[msg.sender][ETH_ADDRESS] -= amount;
        totalWithdrawn[ETH_ADDRESS] += amount;
        userWithdrawCount[msg.sender]++;
        lastActionTime[msg.sender] = block.timestamp;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit Withdraw(msg.sender, ETH_ADDRESS, amount, block.timestamp);
    }

    function withdrawToken(address token, uint256 amount) external nonReentrant whenNotPaused {
        if (token == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();
        if (balances[msg.sender][token] < amount) revert InsufficientBalance();
        if (block.timestamp < lastActionTime[msg.sender] + withdrawCooldown) revert CooldownActive();
        
        balances[msg.sender][token] -= amount;
        totalWithdrawn[token] += amount;
        userWithdrawCount[msg.sender]++;
        lastActionTime[msg.sender] = block.timestamp;
        
        IERC20(token).safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, token, amount, block.timestamp);
    }

    function getBalance(address user, address token) external view returns (uint256) {
        return balances[user][token];
    }

    function getContractETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getUserStats(address user) external view returns (uint256 ethBalance, uint256 depositCount, uint256 withdrawCount) {
        return (balances[user][ETH_ADDRESS], userDepositCount[user], userWithdrawCount[user]);
    }

    function getGlobalStats() external view returns (uint256 totalETHDeposited, uint256 totalETHWithdrawn, uint256 netETHFlow) {
        return (totalDeposited[ETH_ADDRESS], totalWithdrawn[ETH_ADDRESS], totalDeposited[ETH_ADDRESS] - totalWithdrawn[ETH_ADDRESS]);
    }

    function canWithdraw(address user) external view returns (bool, uint256) {
        if (block.timestamp >= lastActionTime[user] + withdrawCooldown) {
            return (true, 0);
        }
        return (false, (lastActionTime[user] + withdrawCooldown) - block.timestamp);
    }

    function setTokenSupport(address token, bool supported) external onlyOwner {
        supportedTokens[token] = supported;
        emit TokenWhitelistUpdated(token, supported);
    }

    function setWithdrawCooldown(uint256 newCooldown) external onlyOwner {
        emit CooldownUpdated(withdrawCooldown, newCooldown);
        withdrawCooldown = newCooldown;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function emergencyWithdraw(address token, uint256 amount, address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (token == ETH_ADDRESS) {
            (bool success, ) = payable(to).call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
        emit EmergencyWithdraw(token, amount, to);
    }

    receive() external payable {
        if (msg.value >= MIN_DEPOSIT && msg.value <= MAX_DEPOSIT) {
            balances[msg.sender][ETH_ADDRESS] += msg.value;
            totalDeposited[ETH_ADDRESS] += msg.value;
            userDepositCount[msg.sender]++;
            lastActionTime[msg.sender] = block.timestamp;
            emit Deposit(msg.sender, ETH_ADDRESS, msg.value, block.timestamp);
        }
    }

    fallback() external payable {}
}
