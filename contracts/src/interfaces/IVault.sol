// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Vault 接口，便於後端與前端類型引用
interface IVault {
    // 常量/公開變量讀取
    function ETH_ADDRESS() external view returns (address);
    function MIN_DEPOSIT() external view returns (uint256);
    function MAX_DEPOSIT() external view returns (uint256);
    function withdrawCooldown() external view returns (uint256);
    function balances(address user, address token) external view returns (uint256);
    function supportedTokens(address token) external view returns (bool);
    function totalDeposited(address token) external view returns (uint256);
    function totalWithdrawn(address token) external view returns (uint256);
    function userDepositCount(address user) external view returns (uint256);
    function userWithdrawCount(address user) external view returns (uint256);
    function lastActionTime(address user) external view returns (uint256);

    // 事件
    event Deposit(address indexed user, address indexed token, uint256 amount, uint256 timestamp);
    event Withdraw(address indexed user, address indexed token, uint256 amount, uint256 timestamp);
    event TokenWhitelistUpdated(address indexed token, bool supported);
    event EmergencyWithdraw(address indexed token, uint256 amount, address indexed to);
    event CooldownUpdated(uint256 oldCooldown, uint256 newCooldown);

    // 用戶操作
    function depositETH() external payable;
    function depositToken(address token, uint256 amount) external;
    function withdrawETH(uint256 amount) external;
    function withdrawToken(address token, uint256 amount) external;

    // 查詢
    function getBalance(address user, address token) external view returns (uint256);
    function getContractETHBalance() external view returns (uint256);
    function getUserStats(address user) external view returns (uint256 ethBalance, uint256 depositCount, uint256 withdrawCount);
    function getGlobalStats() external view returns (uint256 totalETHDeposited, uint256 totalETHWithdrawn, uint256 netETHFlow);
    function canWithdraw(address user) external view returns (bool, uint256);

    // 管理員操作
    function setTokenSupport(address token, bool supported) external;
    function setWithdrawCooldown(uint256 newCooldown) external;
    function pause() external;
    function unpause() external;
    function emergencyWithdraw(address token, uint256 amount, address to) external;
}








