/*
  Warnings:

  - Added the required column `provider` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "provider" TEXT NOT NULL;
ALTER TABLE "User" ADD COLUMN "profileImage" TEXT;
ALTER TABLE "User" ADD COLUMN "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
