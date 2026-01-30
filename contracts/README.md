# Superoctop Vault 智能合約

## 概述

這是 Superoctop 平台的資金金庫合約，支持 ETH 和 ERC20 代幣的存入和提取。

## 目錄結構

```
contracts/
├── src/
│   ├── SuperoctopVault.sol      # 主合約
│   ├── interfaces/
│   │   └── IVault.sol           # 合約接口
│   └── mocks/
│       └── MockERC20.sol        # 測試用代幣
├── scripts/
│   └── deploy.ts                # 部署腳本
├── test/
│   ├── SuperoctopVault.test.ts  # 主合約測試
│   └── ERC20Integration.test.ts # ERC20 集成測試
├── hardhat.config.ts            # Hardhat 配置
└── package.json
```

## 功能特性

- ✅ ETH 存款/提款
- ✅ ERC20 代幣存款/提款（需管理員添加白名單）
- ✅ 重入攻擊防護 (ReentrancyGuard)
- ✅ 緊急暫停功能 (Pausable)
- ✅ 管理員權限控制 (Ownable)
- ✅ 提現冷卻時間（防止閃電貸攻擊）
- ✅ 事件日誌（用於後端監聽）
- ✅ 統計數據追蹤

## 安裝

```bash
cd contracts
npm install
```

## 編譯合約

```bash
npm run compile
```

## 運行測試

```bash
npm test

# 查看測試覆蓋率
npm run test:coverage
```

## 部署

### 1. 配置環境變量

複製 `env.example.txt` 為 `.env` 並填入您的配置：

```bash
# Windows
copy env.example.txt .env

# Linux/Mac
cp env.example.txt .env
```

編輯 `.env` 文件：

```env
# 部署者私鑰 (不要提交到代碼庫!)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# RPC URLs
SEPOLIA_RPC_URL=https://rpc.ankr.com/eth_sepolia
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# 區塊瀏覽器 API Keys (用於合約驗證)
ETHERSCAN_API_KEY=your_etherscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key
```

### 2. 部署到測試網

```bash
# Sepolia (Ethereum 測試網)
npm run deploy:sepolia

# Base Sepolia (Base 測試網)
npm run deploy:base-sepolia

# Arbitrum Sepolia (Arbitrum 測試網)
npm run deploy:arbitrum-sepolia
```

### 3. 部署到主網

```bash
# Base 主網
npm run deploy:base

# Arbitrum 主網
npm run deploy:arbitrum
```

### 4. 本地測試

```bash
# 啟動本地 Hardhat 節點
npm run node

# 另一個終端部署到本地
npm run deploy:local
```

## 合約函數

### 用戶函數

| 函數 | 說明 |
|------|------|
| `depositETH()` | 存入 ETH (payable)，最小 0.0001 ETH，最大 100 ETH |
| `withdrawETH(uint256 amount)` | 提取 ETH（需等待冷卻時間） |
| `depositToken(address token, uint256 amount)` | 存入 ERC20 代幣（需先授權） |
| `withdrawToken(address token, uint256 amount)` | 提取 ERC20 代幣（需等待冷卻時間） |
| `getBalance(address user, address token)` | 查詢餘額 |
| `getUserStats(address user)` | 查詢用戶統計 |
| `canWithdraw(address user)` | 檢查是否可以提現 |

### 管理員函數

| 函數 | 說明 |
|------|------|
| `setTokenSupport(address token, bool supported)` | 設置代幣白名單 |
| `setWithdrawCooldown(uint256 cooldown)` | 設置提現冷卻時間 |
| `pause()` | 暫停合約 |
| `unpause()` | 恢復合約 |
| `emergencyWithdraw(address token, uint256 amount, address to)` | 緊急提款 |

## 事件

```solidity
// 存款事件
event Deposit(address indexed user, address indexed token, uint256 amount, uint256 timestamp);

// 提款事件
event Withdraw(address indexed user, address indexed token, uint256 amount, uint256 timestamp);

// 代幣白名單更新事件
event TokenWhitelistUpdated(address indexed token, bool supported);

// 緊急提款事件
event EmergencyWithdraw(address indexed token, uint256 amount, address indexed to);

// 冷卻時間更新事件
event CooldownUpdated(uint256 oldCooldown, uint256 newCooldown);
```

## 後端集成

部署成功後，將合約地址添加到 `server/.env`：

```env
VAULT_CONTRACT_ADDRESS=0x您的合約地址
SEPOLIA_RPC_URL=https://rpc.ankr.com/eth_sepolia
```

後端 `VaultService` 會：
1. 監聽 Deposit/Withdraw 事件
2. 更新用戶 PTS 積分（1 ETH = 10,000 PTS）
3. 記錄交易歷史

### 事件監聽示例（TypeScript）

```typescript
import { createPublicClient, http, parseAbi } from 'viem';
import { sepolia } from 'viem/chains';

const VAULT_ABI = parseAbi([
  'event Deposit(address indexed user, address indexed token, uint256 amount, uint256 timestamp)',
  'event Withdraw(address indexed user, address indexed token, uint256 amount, uint256 timestamp)',
]);

const client = createPublicClient({
  chain: sepolia,
  transport: http('https://rpc.ankr.com/eth_sepolia'),
});

// 監聽存款事件
client.watchContractEvent({
  address: '0x你的合約地址',
  abi: VAULT_ABI,
  eventName: 'Deposit',
  onLogs: (logs) => {
    for (const log of logs) {
      console.log('存款:', log.args);
      // 更新用戶 PTS...
    }
  },
});
```

## 安全注意事項

⚠️ **重要**：

1. **私鑰安全**：永遠不要將私鑰提交到代碼庫
2. **合約驗證**：部署後務必在區塊瀏覽器上驗證合約
3. **測試網先行**：先在測試網完成所有測試再部署到主網
4. **緊急暫停**：保管好管理員私鑰，以便緊急情況下暫停合約
5. **冷卻時間**：默認 1 分鐘提現冷卻時間防止閃電貸攻擊

## 合約地址

| 網絡 | 地址 | 狀態 |
|------|------|------|
| Sepolia | `待部署` | - |
| Base Sepolia | `待部署` | - |
| Arbitrum Sepolia | `待部署` | - |
| Base 主網 | `待部署` | - |
| Arbitrum 主網 | `待部署` | - |

## 授權

MIT License
