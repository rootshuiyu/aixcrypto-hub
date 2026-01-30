/*
  Warnings:

  - You are about to drop the `RoundBet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RoundBet" DROP CONSTRAINT "RoundBet_roundId_fkey";

-- DropTable
DROP TABLE "RoundBet";

-- DropEnum
DROP TYPE "RoundBetResult";

-- DropEnum
DROP TYPE "RoundPosition";
