/*
  Warnings:

  - The primary key for the `Announcement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `officeId` on the `Announcement` table. All the data in the column will be lost.
  - The primary key for the `AuditLog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `details` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `entityId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `entityType` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `performedById` on the `AuditLog` table. All the data in the column will be lost.
  - The primary key for the `Category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `description` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Category` table. All the data in the column will be lost.
  - The primary key for the `MaintenanceNote` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `authorId` on the `MaintenanceNote` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `MaintenanceNote` table. All the data in the column will be lost.
  - The primary key for the `Office` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `Office` table. All the data in the column will be lost.
  - The primary key for the `TechnicianOffice` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Ticket` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `priority` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `technicianId` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `officeId` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `preferredLanguage` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[ticketId]` on the table `MaintenanceNote` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[technicianId,officeId]` on the table `TechnicianOffice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Announcement` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `Announcement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `authorId` on the `Announcement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `actorId` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticketId` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `expectedResolutionHours` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameAm` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameEn` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `Category` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `diagnosis` to the `MaintenanceNote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workPerformed` to the `MaintenanceNote` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `MaintenanceNote` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ticketId` on the `MaintenanceNote` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `nameAm` to the `Office` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameEn` to the `Office` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `Office` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - The required column `id` was added to the `TechnicianOffice` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Changed the type of `technicianId` on the `TechnicianOffice` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `officeId` on the `TechnicianOffice` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `Ticket` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `categoryId` on the `Ticket` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `employeeId` on the `Ticket` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `officeId` on the `Ticket` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'TECHNICIAN', 'ADMIN');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('AM', 'EN');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('HARDWARE', 'SOFTWARE', 'NETWORKING', 'OTHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'AWAITING_PURCHASE';

-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_officeId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_performedById_fkey";

-- DropForeignKey
ALTER TABLE "MaintenanceNote" DROP CONSTRAINT "MaintenanceNote_authorId_fkey";

-- DropForeignKey
ALTER TABLE "MaintenanceNote" DROP CONSTRAINT "MaintenanceNote_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "TechnicianOffice" DROP CONSTRAINT "TechnicianOffice_officeId_fkey";

-- DropForeignKey
ALTER TABLE "TechnicianOffice" DROP CONSTRAINT "TechnicianOffice_technicianId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_officeId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_technicianId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_officeId_fkey";

-- DropIndex
DROP INDEX "Announcement_officeId_idx";

-- DropIndex
DROP INDEX "AuditLog_entityType_entityId_idx";

-- DropIndex
DROP INDEX "AuditLog_performedById_idx";

-- DropIndex
DROP INDEX "Category_name_key";

-- DropIndex
DROP INDEX "MaintenanceNote_authorId_idx";

-- DropIndex
DROP INDEX "MaintenanceNote_ticketId_idx";

-- DropIndex
DROP INDEX "Ticket_categoryId_idx";

-- DropIndex
DROP INDEX "Ticket_employeeId_idx";

-- AlterTable
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_pkey",
DROP COLUMN "officeId",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "authorId",
ADD COLUMN     "authorId" UUID NOT NULL,
ADD CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_pkey",
DROP COLUMN "details",
DROP COLUMN "entityId",
DROP COLUMN "entityType",
DROP COLUMN "performedById",
ADD COLUMN     "actorId" UUID NOT NULL,
ADD COLUMN     "newValue" TEXT,
ADD COLUMN     "previousValue" TEXT,
ADD COLUMN     "ticketId" UUID NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Category" DROP CONSTRAINT "Category_pkey",
DROP COLUMN "description",
DROP COLUMN "name",
ADD COLUMN     "expectedResolutionHours" INTEGER NOT NULL,
ADD COLUMN     "nameAm" TEXT NOT NULL,
ADD COLUMN     "nameEn" TEXT NOT NULL,
ADD COLUMN     "type" "CategoryType" NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "Category_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MaintenanceNote" DROP CONSTRAINT "MaintenanceNote_pkey",
DROP COLUMN "authorId",
DROP COLUMN "content",
ADD COLUMN     "diagnosis" TEXT NOT NULL,
ADD COLUMN     "partsReplaced" TEXT,
ADD COLUMN     "purchasedByOffice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recommendations" TEXT,
ADD COLUMN     "workPerformed" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "ticketId",
ADD COLUMN     "ticketId" UUID NOT NULL,
ADD CONSTRAINT "MaintenanceNote_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Office" DROP CONSTRAINT "Office_pkey",
DROP COLUMN "name",
ADD COLUMN     "nameAm" TEXT NOT NULL,
ADD COLUMN     "nameEn" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "Office_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "TechnicianOffice" DROP CONSTRAINT "TechnicianOffice_pkey",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "technicianId",
ADD COLUMN     "technicianId" UUID NOT NULL,
DROP COLUMN "officeId",
ADD COLUMN     "officeId" UUID NOT NULL,
ADD CONSTRAINT "TechnicianOffice_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_pkey",
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "isApproved" BOOLEAN,
ADD COLUMN     "purchaseDetails" TEXT,
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "requiresPurchase" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "categoryId",
ADD COLUMN     "categoryId" UUID NOT NULL,
ALTER COLUMN "deviceOrSystem" DROP NOT NULL,
DROP COLUMN "priority",
ADD COLUMN     "priority" "Priority",
DROP COLUMN "employeeId",
ADD COLUMN     "employeeId" UUID NOT NULL,
DROP COLUMN "technicianId",
ADD COLUMN     "technicianId" UUID,
DROP COLUMN "officeId",
ADD COLUMN     "officeId" UUID NOT NULL,
ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL,
DROP COLUMN "officeId",
ADD COLUMN     "officeId" UUID,
DROP COLUMN "preferredLanguage",
ADD COLUMN     "preferredLanguage" "Language" NOT NULL DEFAULT 'AM',
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- DropEnum
DROP TYPE "PreferredLanguage";

-- DropEnum
DROP TYPE "TicketPriority";

-- DropEnum
DROP TYPE "UserRole";

-- CreateIndex
CREATE INDEX "Announcement_authorId_idx" ON "Announcement"("authorId");

-- CreateIndex
CREATE INDEX "AuditLog_ticketId_idx" ON "AuditLog"("ticketId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceNote_ticketId_key" ON "MaintenanceNote"("ticketId");

-- CreateIndex
CREATE INDEX "TechnicianOffice_technicianId_idx" ON "TechnicianOffice"("technicianId");

-- CreateIndex
CREATE INDEX "TechnicianOffice_officeId_idx" ON "TechnicianOffice"("officeId");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicianOffice_technicianId_officeId_key" ON "TechnicianOffice"("technicianId", "officeId");

-- CreateIndex
CREATE INDEX "Ticket_officeId_idx" ON "Ticket"("officeId");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_createdAt_idx" ON "Ticket"("createdAt");

-- CreateIndex
CREATE INDEX "Ticket_technicianId_idx" ON "Ticket"("technicianId");

-- CreateIndex
CREATE INDEX "User_officeId_idx" ON "User"("officeId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianOffice" ADD CONSTRAINT "TechnicianOffice_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianOffice" ADD CONSTRAINT "TechnicianOffice_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceNote" ADD CONSTRAINT "MaintenanceNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
