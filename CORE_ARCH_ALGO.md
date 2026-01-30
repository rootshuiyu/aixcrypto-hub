# AIxC Hub - Core Architecture & Algorithm Specification

This document serves as the "Source of Truth" for all financial logic, quantitative algorithms, and Web3 engineering standards within the Superoctop platform.

---

## 1. C10 Index Methodology (Market Cap Weighted)

### 1.1 Calculation Formula
The index value is determined by the total market capitalization of the top 10 crypto assets relative to a dynamic divisor.
- **Formula**: `Index = Σ (Price_i * Supply_i) / Divisor`
- **Precision**: 
    - Internal calculations must use `Decimal.js` (8-18 decimal places).
    - UI display standardized to 2 decimal places.

### 1.2 Divisor Management (Rebalancing)
To prevent artificial jumps in the index price during asset rebalancing or supply changes:
- **Rule**: The index value must remain constant immediately before and after a rebalance.
- **New Divisor Formula**: `New Divisor = (New Total Market Cap after change) / (Current Index Value before change)`

---

## 2. Oracle & Price Aggregation (Anti-Manipulation)

### 2.1 Aggregation Filter (The "Anti-忽悠" Filter)
- **Sources**: Request data from at least 3 providers (Primary: Chainlink Multi-RPC Racing; Secondary: Exchange API simulations).
- **Algorithm**:
    1. `fetch_prices_concurrently()`
    2. `sort_prices()`
    3. `median_selection()` (Take the middle value to avoid outliers)
- **Real-time Sync**:
    - Oracle Sync: Every 15 seconds (Chainlink `latestRoundData`).
    - Interpolation: Every 5 seconds (Smoothing for K-line continuity).
- **Variance Circuit Breaker**:
    - If `max_price_divergence > 1%`, trigger a `Divergence Warning`.
    - Automatically pause playground settlements during divergence events.

---

## 3. AI Strategy & Interpretation Engine

### 3.1 Structural Separation
- **Signal Engine**: Calculates quantitative indicators (RSI, MACD, Bollinger Bands) using the `technicalindicators` library.
- **Interpretation Layer**: Feeds structured JSON (OHLCV + Calculated Indicators) to the LLM (DeepSeek/GPT).

### 3.2 Output Requirements
- **Confidence Score**: Every AI recommendation must return a score (0-100).
- **Reasoning**: AI must cite specific technical data (e.g., "RSI overbought at 75") rather than generic market sentiment.

### 3.3 Transparency & Backtesting
- **Data Transparency**: Users must have access to the raw structured data (JSON) fed to the LLM to verify indicators.
- **Automated Backtesting**: Every AI prediction must be logged and compared against the market result after the settlement period. 
- **Real-time Performance**: AI model "Win Rates" displayed on the UI must be derived from the actual historical performance stored in the database.

---

## 4. Web3 Transaction Integrity

### 4.1 Deterministic Confirmation
- **Rule**: Never rely on client-side timeouts for transaction state updates.
- **Implementation**: Use `useWaitForTransactionReceipt` (wagmi) or server-side event listening (Web3 Webhooks). A transaction is only "Confirmed" after at least 1 block confirmation.

---

## 5. Engineering Standards

### 4.1 Backend (NestJS)
- Use Service/Repository pattern.
- Ensure all financial inputs are validated.

### 4.2 Frontend (Next.js)
- Use `framer-motion` for industrial-grade animations.
- Icons must be minimalist SVG geometric designs (1.5px stroke).

### 4.3 Web3 (Wagmi/Viem)
- Use multi-RPC failover for Chainlink calls.
- Mandatory transaction status feedback (Loading/Success/Error).

---

## 5. Security & Risk Control

- **Environment**: No hardcoded API keys.
- **Prompt Safety**: Sanitize user strategy inputs to prevent prompt injection.
- **Risk Limits**: Maximum PTS per bet based on user's tiered loyalty status.

---

## Change Log (Algorithmic Updates)

| Date | Author | Description of Change | Status |
|------|--------|-----------------------|--------|
| 2026-01-17 | AI | Initial Architecture Analysis & Optimization Roadmap | [Completed] |
| 2026-01-17 | AI | Implemented C10 Divisor Model & Decimal.js Precision | [Completed] |
| 2026-01-17 | AI | Oracle Aggregation & Divergence Circuit Breaker | [Completed] |
| 2026-01-17 | AI | Structured Signal Engine (RSI, MACD, BB) Integrated | [Completed] |
| 2026-01-17 | AI | AI Data Visualization & Web3 Transaction Determinism | [Completed] |
| 2026-01-17 | AI | Multi-RPC Racing & Global Divergence Alert System | [Completed] |

