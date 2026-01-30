-- CreateEnum
CREATE TYPE "PositionSide" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('OPEN', 'CLOSED', 'SETTLED');

-- CreateEnum
CREATE TYPE "TradeType" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "LiquidityPool" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "yesReserve" DOUBLE PRECISION NOT NULL,
    "noReserve" DOUBLE PRECISION NOT NULL,
    "kConstant" DOUBLE PRECISION NOT NULL,
    "initialLiquidity" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "yesPrice" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "noPrice" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "totalVolume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tradeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiquidityPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "side" "PositionSide" NOT NULL,
    "shares" DOUBLE PRECISION NOT NULL,
    "avgCost" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "status" "PositionStatus" NOT NULL DEFAULT 'OPEN',
    "closedShares" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closedAt" TIMESTAMP(3),
    "exitPrice" DOUBLE PRECISION,
    "realizedPnL" DOUBLE PRECISION,
    "settledAt" TIMESTAMP(3),
    "settlementPayout" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AMMTrade" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tradeType" "TradeType" NOT NULL,
    "side" "PositionSide" NOT NULL,
    "shares" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,
    "yesPriceAfter" DOUBLE PRECISION NOT NULL,
    "noPriceAfter" DOUBLE PRECISION NOT NULL,
    "yesReserveAfter" DOUBLE PRECISION NOT NULL,
    "noReserveAfter" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AMMTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceCandle" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "tradeCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceCandle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LiquidityPool_roundId_key" ON "LiquidityPool"("roundId");

-- CreateIndex
CREATE INDEX "Position_userId_status_idx" ON "Position"("userId", "status");

-- CreateIndex
CREATE INDEX "Position_roundId_side_idx" ON "Position"("roundId", "side");

-- CreateIndex
CREATE UNIQUE INDEX "Position_userId_roundId_side_key" ON "Position"("userId", "roundId", "side");

-- CreateIndex
CREATE INDEX "AMMTrade_roundId_createdAt_idx" ON "AMMTrade"("roundId", "createdAt");

-- CreateIndex
CREATE INDEX "AMMTrade_poolId_createdAt_idx" ON "AMMTrade"("poolId", "createdAt");

-- CreateIndex
CREATE INDEX "AMMTrade_userId_createdAt_idx" ON "AMMTrade"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PriceCandle_roundId_interval_startTime_idx" ON "PriceCandle"("roundId", "interval", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "PriceCandle_roundId_interval_startTime_key" ON "PriceCandle"("roundId", "interval", "startTime");

-- AddForeignKey
ALTER TABLE "LiquidityPool" ADD CONSTRAINT "LiquidityPool_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AMMTrade" ADD CONSTRAINT "AMMTrade_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "LiquidityPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
