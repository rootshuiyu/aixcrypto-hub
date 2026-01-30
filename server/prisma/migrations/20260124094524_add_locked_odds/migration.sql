/*
  Warnings:

  - A unique constraint covering the columns `[inviteCode]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[privyId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[twitterId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[discordId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[referralCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,taskId]` on the table `UserTask` will be added. If there are existing duplicate values, this will fail.
  - The required column `referralCode` was added to the `User` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('PENDING', 'ACTIVE', 'SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BetResult" AS ENUM ('WIN', 'LOSE', 'BREAKEVEN');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('BETTING', 'LOCKED', 'SETTLING', 'SETTLED');

-- CreateEnum
CREATE TYPE "RoundResult" AS ENUM ('LONG_WIN', 'SHORT_WIN', 'DRAW');

-- CreateEnum
CREATE TYPE "RoundPosition" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "RoundBetResult" AS ENUM ('WIN', 'LOSE', 'REFUND');

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "aggressiveness" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "difficultyBias" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "personality" TEXT,
ADD COLUMN     "trapFrequency" DOUBLE PRECISION NOT NULL DEFAULT 0.1;

-- AlterTable
ALTER TABLE "Battle" ADD COLUMN     "agentStrategy" TEXT,
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "entryPrice" DOUBLE PRECISION,
ADD COLUMN     "exitPrice" DOUBLE PRECISION,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "marketType" TEXT,
ADD COLUMN     "priceChange" DOUBLE PRECISION,
ADD COLUMN     "reasoning" TEXT,
ADD COLUMN     "reward" DOUBLE PRECISION,
ADD COLUMN     "seasonId" TEXT,
ADD COLUMN     "technicalData" TEXT,
ADD COLUMN     "timeframe" TEXT,
ADD COLUMN     "tournamentId" TEXT,
ADD COLUMN     "userStrategy" TEXT;

-- AlterTable
ALTER TABLE "Bet" ADD COLUMN     "entryPrice" DOUBLE PRECISION,
ADD COLUMN     "exitPrice" DOUBLE PRECISION,
ADD COLUMN     "exitReason" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "holdDuration" TEXT,
ADD COLUMN     "lockedOdds" DOUBLE PRECISION,
ADD COLUMN     "payout" DOUBLE PRECISION,
ADD COLUMN     "potentialPayout" DOUBLE PRECISION,
ADD COLUMN     "result" "BetResult",
ADD COLUMN     "settledAt" TIMESTAMP(3),
ADD COLUMN     "status" "BetStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "stopLoss" DOUBLE PRECISION,
ADD COLUMN     "strategyId" TEXT,
ADD COLUMN     "takeProfit" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'C10',
ADD COLUMN     "endPrice" DECIMAL(18,6),
ADD COLUMN     "lockTime" TIMESTAMP(3),
ADD COLUMN     "noPool" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "startPrice" DECIMAL(18,6),
ADD COLUMN     "timeframe" TEXT NOT NULL DEFAULT '24H',
ADD COLUMN     "yesPool" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "isDaily" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "inviteCode" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "leaderId" TEXT,
ADD COLUMN     "maxMembers" INTEGER NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "combo" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discordId" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "maxCombo" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "onChainBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "privyId" TEXT,
ADD COLUMN     "referralCode" TEXT NOT NULL,
ADD COLUMN     "referrerId" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER',
ADD COLUMN     "totalBattles" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalWins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "twitterId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "address" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserTask" ADD COLUMN     "claimedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserStrategy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "trendFollowing" BOOLEAN NOT NULL DEFAULT true,
    "volatilityPref" TEXT NOT NULL DEFAULT 'NORMAL',
    "holdDuration" TEXT NOT NULL DEFAULT '1H',
    "maxBetPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "stopLoss" DOUBLE PRECISION,
    "takeProfit" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "strategyId" TEXT,
    "suggestion" "MarketOutcome" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "followed" BOOLEAN NOT NULL DEFAULT false,
    "result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AISuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "prizePool" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rewards" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonRanking" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalBattles" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPts" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "rewardAmount" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonRanking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "entryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prizePool" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxPlayers" INTEGER NOT NULL DEFAULT 100,
    "minLevel" TEXT,
    "rules" TEXT,
    "rewards" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentParticipant" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "eliminated" BOOLEAN NOT NULL DEFAULT false,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "rewardAmount" DOUBLE PRECISION,

    CONSTRAINT "TournamentParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketIndex" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "change24h" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "token" TEXT NOT NULL DEFAULT 'ETH',
    "txHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'C10',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "lockTime" TIMESTAMP(3) NOT NULL,
    "openPrice" DOUBLE PRECISION,
    "closePrice" DOUBLE PRECISION,
    "highPrice" DOUBLE PRECISION,
    "lowPrice" DOUBLE PRECISION,
    "status" "RoundStatus" NOT NULL DEFAULT 'BETTING',
    "result" "RoundResult",
    "longPool" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shortPool" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "longBetCount" INTEGER NOT NULL DEFAULT 0,
    "shortBetCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundBet" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" "RoundPosition" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "lockedOdds" DOUBLE PRECISION,
    "potentialPayout" DOUBLE PRECISION,
    "payout" DOUBLE PRECISION,
    "result" "RoundBetResult",
    "settled" BOOLEAN NOT NULL DEFAULT false,
    "settledAt" TIMESTAMP(3),
    "comboMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoundBet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexWeight" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'C10',
    "symbol" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "supply" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketSnapshot" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "snapshotType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "indexValue" DECIMAL(18,6) NOT NULL,
    "components" JSONB NOT NULL,
    "formulaParams" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "chainId" INTEGER NOT NULL,
    "chainName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "abi" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "deployedAt" TIMESTAMP(3),
    "deployTxHash" TEXT,
    "deployer" TEXT,
    "metadata" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractDeployment" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "deployer" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "gasUsed" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserStrategy_userId_idx" ON "UserStrategy"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStrategy_userId_name_key" ON "UserStrategy"("userId", "name");

-- CreateIndex
CREATE INDEX "AISuggestion_userId_createdAt_idx" ON "AISuggestion"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Season_status_endDate_idx" ON "Season"("status", "endDate");

-- CreateIndex
CREATE INDEX "SeasonRanking_seasonId_totalPts_idx" ON "SeasonRanking"("seasonId", "totalPts");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonRanking_seasonId_userId_key" ON "SeasonRanking"("seasonId", "userId");

-- CreateIndex
CREATE INDEX "Tournament_status_startDate_idx" ON "Tournament"("status", "startDate");

-- CreateIndex
CREATE INDEX "TournamentParticipant_tournamentId_score_idx" ON "TournamentParticipant"("tournamentId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentParticipant_tournamentId_userId_key" ON "TournamentParticipant"("tournamentId", "userId");

-- CreateIndex
CREATE INDEX "MarketIndex_type_timestamp_idx" ON "MarketIndex"("type", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_txHash_key" ON "Transaction"("txHash");

-- CreateIndex
CREATE INDEX "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- CreateIndex
CREATE INDEX "Round_status_endTime_idx" ON "Round"("status", "endTime");

-- CreateIndex
CREATE INDEX "Round_category_roundNumber_idx" ON "Round"("category", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Round_category_roundNumber_key" ON "Round"("category", "roundNumber");

-- CreateIndex
CREATE INDEX "RoundBet_userId_createdAt_idx" ON "RoundBet"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RoundBet_roundId_position_idx" ON "RoundBet"("roundId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "RoundBet_roundId_userId_key" ON "RoundBet"("roundId", "userId");

-- CreateIndex
CREATE INDEX "IndexWeight_category_isActive_idx" ON "IndexWeight"("category", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "IndexWeight_category_symbol_key" ON "IndexWeight"("category", "symbol");

-- CreateIndex
CREATE INDEX "MarketSnapshot_marketId_snapshotType_idx" ON "MarketSnapshot"("marketId", "snapshotType");

-- CreateIndex
CREATE INDEX "MarketSnapshot_marketId_timestamp_idx" ON "MarketSnapshot"("marketId", "timestamp");

-- CreateIndex
CREATE INDEX "ContractConfig_type_chainId_idx" ON "ContractConfig"("type", "chainId");

-- CreateIndex
CREATE INDEX "ContractConfig_isActive_idx" ON "ContractConfig"("isActive");

-- CreateIndex
CREATE INDEX "ContractConfig_type_isActive_isPrimary_idx" ON "ContractConfig"("type", "isActive", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "contract_type_chain_primary" ON "ContractConfig"("type", "chainId", "isPrimary");

-- CreateIndex
CREATE INDEX "ContractDeployment_configId_idx" ON "ContractDeployment"("configId");

-- CreateIndex
CREATE INDEX "ContractDeployment_status_idx" ON "ContractDeployment"("status");

-- CreateIndex
CREATE INDEX "Battle_userId_timestamp_idx" ON "Battle"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "Battle_seasonId_idx" ON "Battle"("seasonId");

-- CreateIndex
CREATE INDEX "Battle_tournamentId_idx" ON "Battle"("tournamentId");

-- CreateIndex
CREATE INDEX "Battle_isPublic_timestamp_idx" ON "Battle"("isPublic", "timestamp");

-- CreateIndex
CREATE INDEX "Bet_userId_status_timestamp_idx" ON "Bet"("userId", "status", "timestamp");

-- CreateIndex
CREATE INDEX "Bet_marketId_status_idx" ON "Bet"("marketId", "status");

-- CreateIndex
CREATE INDEX "Bet_status_expiresAt_idx" ON "Bet"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Team_inviteCode_key" ON "Team"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_privyId_key" ON "User"("privyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_twitterId_key" ON "User"("twitterId");

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "UserTask_userId_taskId_key" ON "UserTask"("userId", "taskId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonRanking" ADD CONSTRAINT "SeasonRanking_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonRanking" ADD CONSTRAINT "SeasonRanking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundBet" ADD CONSTRAINT "RoundBet_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketSnapshot" ADD CONSTRAINT "MarketSnapshot_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;
