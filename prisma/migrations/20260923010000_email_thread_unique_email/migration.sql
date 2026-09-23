-- AlterTable
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_externalEmail_key" UNIQUE ("externalEmail");
