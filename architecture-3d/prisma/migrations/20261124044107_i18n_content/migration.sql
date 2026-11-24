-- AlterTable
ALTER TABLE "Offering" ADD COLUMN     "translations" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "translations" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "translations" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en';
