-- Slot yang pernah dibooking tidak dihapus, cuma ditutup (riwayat booking tetap ada).
ALTER TYPE "AvailabilityStatus" ADD VALUE 'CLOSED';
