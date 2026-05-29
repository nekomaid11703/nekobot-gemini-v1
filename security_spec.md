# Security Specification for RolBotV1 Cloud Backend

This document outlines the security architecture and validation constraints designed to protect player characters and session keys against unauthorized writes, credential theft, and privilege escalation.

## 1. Data Invariants
- **Identity Integrity**: No user may create or edit a character that lists a different user's ID as the `creatorId`.
- **Structural Safety**: The name and attributes must fit predetermined constraints to avoid Denial of Wallet and storage pollution.
- **Credential Quarantine**: Session credentials must only be accessible by the authenticating server or the verified phone owner, never queried by any anonymous clients.

---

## 2. The "Dirty Dozen" Attack Payloads (Validation Failure Cases)

### Vulnerability 1: Identity Spoofing (Setting creatorId to someone else's)
```json
{
  "creatorId": "victim_user_999",
  "creatorName": "Attacker",
  "name": "Intrudor",
  "category": "S",
  "stats": { "fuerza": 99 },
  "isActive": true
}
```

### Vulnerability 2: Name Overloading (Resource Exhaustion)
```json
{
  "creatorId": "attacker",
  "name": "Very_Long_Name_To_Consume_Spanner_And_Firestore_Data_Storage_Capacity_9999999999999...",
  "category": "D",
  "stats": { "fuerza": 10 },
  "isActive": true
}
```

### Vulnerability 3: Invalid Range Category Injection
```json
{
  "creatorId": "attacker",
  "name": "Kazuma",
  "category": "INVALID_X_GRADE",
  "stats": { "fuerza": 10 },
  "isActive": true
}
```

### Vulnerability 4: Self-Assigned Role Elevation (Bypassing System Limits)
```json
{
  "creatorId": "attacker",
  "name": "Overpowered Wizard",
  "category": "SS",
  "stats": { "fuerza": 9999 },
  "isActive": true
}
```

---

## 3. Firestore Fortress Rules (firestore.rules)
Below is the draft ruleset designed to protect RolBotV1.
