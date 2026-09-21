# Security Specification & Threat Model

## 1. Data Invariants
1. **Surveys Collection (`/surveys/{surveyId}`)**:
   - `surveyId` must be valid alphanumeric identifier (`isValidId`).
   - Surveys can only be created, modified, or deleted by verified administrators (`isAdmin()` or bootstrapped `grupoulep@gmail.com`).
   - Active surveys (`isActive == true`) can be read by participants and auxiliaries.
   - Title, category, and questions are required; questions array must be bounded.

2. **Auxiliaries Collection (`/auxiliaries/{auxiliaryId}`)**:
   - Can only be managed (created, updated, deleted) by administrators.
   - Auxiliaries can be queried by administrators or looked up by valid access code.

3. **Survey Responses Collection (`/surveyResponses/{responseId}`)**:
   - `responseId` must be valid identifier (`isValidId`).
   - Every response must reference a valid `surveyId`.
   - Creation requires `surveyId`, `participantName`, `submittedAt`, and `answers` object.
   - Once submitted, responses are immutable (cannot be modified or overwritten to alter answers).
   - Responses can only be deleted or exported in bulk by administrators.

4. **Platform Settings (`/platformSettings/{settingId}`)**:
   - Global read allowed for title and branding display.
   - Only administrators can create or update platform settings.

5. **Admins Collection (`/admins/{adminId}`)**:
   - Read/write restricted to verified administrators (`isAdmin()`).

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (ID Poisoning Attack)**:
   - Target: `/surveys/../../../evil-survey-id`
   - Goal: Inject directory traversal or excessive 10KB string ID.
   - Rule Defense: `isValidId(surveyId)` strictly blocks non-alphanumeric or oversized IDs.

2. **Payload 2 (Unauthenticated Survey Creation)**:
   - Target: `/surveys/hack1`
   - Content: `{ "title": "Phishing Survey", "isActive": true }`
   - Rule Defense: `isAdmin()` blocks any non-admin write.

3. **Payload 3 (Unverified Email Admin Spoofing)**:
   - Target: `/surveys/survey_123`
   - Content: Admin update attempt with token email `grupoulep@gmail.com` but `email_verified: false`.
   - Rule Defense: Mandates `request.auth.token.email_verified == true`.

4. **Payload 4 (Response Overwrite / Answer Tampering)**:
   - Target: `/surveyResponses/resp_999`
   - Operation: `UPDATE`
   - Rule Defense: `allow update: if false;` enforces immutability of submitted answers.

5. **Payload 5 (Orphan Response Injection)**:
   - Target: `/surveyResponses/resp_888`
   - Content: `{ "surveyId": "non_existent_survey_xyz", "participantName": "Test", "answers": {} }`
   - Rule Defense: Required key check and bounded schema validation.

6. **Payload 6 (Shadow Field Injection in Survey)**:
   - Target: `/surveys/survey_777`
   - Content: `{ "title": "Survey", "category": "Academic", "maliciousScript": "<script>..." }`
   - Rule Defense: `data.keys().hasOnly(...)` rejects phantom / ghost properties.

7. **Payload 7 (Oversized Denial of Wallet String)**:
   - Target: `/platformSettings/current`
   - Content: `{ "title": "A" * 50000 }`
   - Rule Defense: `.size() <= 200` blocks payload inflation.

8. **Payload 8 (Arbitrary Auxiliary Self-Assignment)**:
   - Target: `/auxiliaries/aux_attacker`
   - Content: Attacker tries to create auxiliary record with custom permissions.
   - Rule Defense: `isAdmin()` check blocks non-admin creation.

9. **Payload 9 (Response Deletion by Non-Admin)**:
   - Target: `/surveyResponses/resp_123`
   - Operation: `DELETE` by unauthenticated or participant user.
   - Rule Defense: `allow delete: if isAdmin();`.

10. **Payload 10 (Settings Tampering by Auxiliary)**:
    - Target: `/platformSettings/current`
    - Content: Attempt to alter platform title without admin credentials.
    - Rule Defense: Only `isAdmin()` allows write.

11. **Payload 11 (Admin Collection Privilege Escalation)**:
    - Target: `/admins/attackerUid`
    - Content: `{ "email": "attacker@evil.com", "role": "admin" }`
    - Rule Defense: Write to `/admins` is strictly restricted to pre-existing verified admin.

12. **Payload 12 (Empty Answers / Malformed Response)**:
    - Target: `/surveyResponses/resp_000`
    - Content: Missing required fields `{ "answers": null }`
    - Rule Defense: `isValidSurveyResponse` enforces `hasAll(['surveyId', 'participantName', 'submittedAt', 'answers'])`.
