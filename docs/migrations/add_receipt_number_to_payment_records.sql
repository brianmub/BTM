ALTER TABLE payment_records
ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_payment_records_receipt_number
ON payment_records(receipt_number);
