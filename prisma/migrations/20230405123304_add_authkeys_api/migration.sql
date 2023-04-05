-- CreateTable
CREATE TABLE "AuthKey" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AuthKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthKey_key_key" ON "AuthKey"("key");
