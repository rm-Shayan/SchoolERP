-- Fee payment idempotency replay ledger.
-- Stores the outcome of a payment submission keyed by the client-supplied
-- idempotency key so a retried request returns the original result instead of
-- creating a duplicate payment entry.

CREATE TABLE "FeePaymentReplay" (
    "idempotencyKey" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeRecordId" TEXT NOT NULL,
    "paymentIds" TEXT[],
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeePaymentReplay_pkey" PRIMARY KEY ("idempotencyKey")
);

CREATE INDEX "FeePaymentReplay_schoolId_idx" ON "FeePaymentReplay"("schoolId");