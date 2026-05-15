# Security Specification: Namma-Yantra Share

## 1. Data Invariants
- A **User** profile must belong to the authenticated user. Roles can only be 'Farmer' or 'Owner'.
- A **Machine** must have a valid `ownerId` matching the creator's UID.
- A **Booking** must link a `farmerId` (authenticated user) and a `machineId` (existing machine).
- **Owners** can only update their own machine listings.
- **Farmers** can only read/write their own bookings, while **Owners** can read/update bookings for their own machines.

## 2. The Dirty Dozen (Attack Vectors)
1. **Identity Spoofing**: User A tries to create a machine listing with `ownerId` of User B.
2. **Role Escalation**: A 'Farmer' tries to update their profile to 'Owner' without permission (if restricted).
3. **Price Poisoning**: A user tries to set an hourly rate of -₹100 or ₹1,000,000,000.
4. **Orphaned Booking**: Creating a booking for a machine ID that doesn't exist.
5. **Ghost Update**: Adding a field `isVerified: true` to a machine listing when updating as an owner.
6. **State Jumping**: A farmer tries to set a booking status directly to 'Completed' (should be 'Pending' by default).
7. **Cross-User Leak**: Farmer A tries to 'get' the private contact info of Farmer B's booking.
8. **Resource Exhaustion**: Sending a 1MB string as the machine description.
9. **Timestamp Manipulation**: Setting `createdAt` to a future date instead of `request.time`.
10. **ID Injection**: Using a 1024-character junk string as a machine ID.
11. **PII Scraping**: Trying to list all users to harvest emails.
12. **Double Booking**: Attempting to book a machine that is already marked as `available: false`.

## 3. Test Runner (Draft)
A comprehensive test suite will verify the `PERMISSION_DENIED` status for these payloads in `firestore.rules.test.ts`.
