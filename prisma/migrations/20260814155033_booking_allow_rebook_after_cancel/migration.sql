-- DropIndex
DROP INDEX "Booking_availabilityId_key";

-- CreateIndex
CREATE INDEX "Booking_availabilityId_idx" ON "Booking"("availabilityId");

-- Partial unique index: cuma boleh ada 1 booking berstatus BOOKED per
-- availability di satu waktu (defense-in-depth buat race condition),
-- tapi gak ngeblok histori booking yang udah CANCELLED/COMPLETED --
-- itu bug lama yang bikin slot gak bisa di-rebook abis dibatalin.
CREATE UNIQUE INDEX "Booking_availabilityId_active_unique" ON "Booking"("availabilityId") WHERE "status" = 'BOOKED';
