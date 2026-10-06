# WhatsApp Implementation — Evolution API se (Roman Urdu)

Status: sirf proposal, code abhi likha nahi gaya
Repo: `D:\saas\SchoolERP`
Evolution API: `D:\saas\evolution-api` (already clone hai, abhi **running nahi**)

---

## 0. Pehle sab se zaroori jawab: kya QR scan ke bina test ho sakta hai?

### ❌ NAHI. Bilkul nahi. Ye 100% tay hai.

Ye meri khud ki guess nahi, WhatsApp protocol ki asli baat hai. Samjho:

**WhatsApp ko "phone number" nahi chahiye, "device pairing" chahiye.**

WhatsApp ka design aisa hai: aapka account ek **device se linked** hota hai. Har naya device
(pairing) ke liye phone par **QR scan** karna padta hai, ya phone par **8-digit pairing code**
daalna padta hai. WhatsApp ko ye confirm karna hota hai ke *"ye asli owner hai, ye naya device
hai"*. Bina iske WhatsApp **jaan-boojh ke allow nahi karta** — koi bhi script ya number se.

Isi liye:

| Kya kar sakte hain bina QR ke? | Kyun nahi? |
|---|---|
| Number daal kar WhatsApp register | WhatsApp code bhejta hai number par → phir us device ko approve karna hota hai. Sirf number se nahi hota. |
| Online temp number (SMS receive sites) | Wo sirf **SMS receive** karte hain. WhatsApp registration un numbers pe mostly **fail** hoti hai, aur jo bhi ho jaye to wo number **shared/recycled** hota hai — 1–2 din me chala jata hai. WhatsApp unhe turant ban kar deta hai. |
| Baileys / Evolution ka koi "sandbox mode" | Aisa koi official sandbox **exist nahi karta**. Evolution bhi wahi QR/pairing maangta hai. |

### ⚠️ Online temp number kyun nahi chalega (detail se)

1. Wo number **SMS** receive karne ke liye hai, WhatsApp ke liye nahi.
2. WhatsApp ab registration me **phone call/SMS verification** maangta hai — jo un sites par aata hi nahi ya aata to aap use kar nahi paate (un ka UI aapko SMS code forward nahi karta reliably).
3. Wo numbers **ek hi waqt me hazaar logon ke beech share** hote hain.
4. WhatsApp ka apna **anti-spam/anti-abuse system** un numbers ko detect karta hai → **permanent ban**.
5. Ban ho jaye to wo number dobara use nahi ho sakta — matlab test bhi nahi ho paayega.

**Mera suggestion:** in numbers pe time waste mat karein. Neeche 3 sahi tareeke bataye hain.

---

## 1. Testing ke 3 sahi tareeke (sabke apne rules hain)

### Tareeka A — Fake number + mock server ⭐ (RECOMMENDED, aaj ho sakta hai)
- Koi real number **nahi** chahiye. Koi QR **nahi**.
- Hum apna code ek **local mock server** se test karte hain jo Evolution API ka waita-karta hai.
- Verify hota hai: number kaunsi branch pe gaya, retry logic, logging, permissions, quota.
- **Yehi wo 80% bugs pakadta hai jo asli number se pakadte hain.**
- ⚠️ Ye prove **nahi** karta ke WhatsApp ka asli network kaam kar raha hai (delivery, ban risk).

### Tareeka B — Asli number + pairing code (QR ki zaroorat NAHI)
- Evolution me QR ke ilawa doosra tareeka bhi hai: **phone number daalo → 8-digit pairing code milta hai.**
- Wo code phone ke WhatsApp app me **Linked devices** me daalna hota hai.
- QR scan nahi chahiye — lekin **ek asli phone chahiye jisme WhatsApp installed ho.**
- **Ye sirf aap kar sakte hain** — main nahi (phone aapke paas hai).

### Tareeka C — Asli number + QR (jo aap pehle pooch rahe the)
- Standard tareeka. QR phone ke WhatsApp → Linked devices me scan.
- Same: **asli phone chahiye.**

### Saaf baat
> QR scan **aap** karenge, main nahi kar sakta. Main har woh kaam kar sakta hoon jo number chahiye
> ya nahi — matlab **Tareeka A mukhtasar hai aur main aaj kar sakta hoon.**

---

## 2. Sab se bada design sawaal: number kis ka?

**Meri recommendation: number BRANCH ka, admin ka nahi.**

Agar number admin ka hota, to branch admin hatate hi us branch ka WhatsApp khatam ho jayega aur
parents ko message karna ruk jayega. Ye business-wise galat hai. School ka number institutional
asset hai — staff badle to bhi number zinda rahega.

**Iska seedha jawab tere sawal ka:**

| Event | WhatsApp session? |
|---|---|
| Branch admin delete/deactivate hota hai | ❌ **Session ZAROORI NAHI** — branch ka number zinda rahega, sirf admin ke login tokens revoke |
| **Branch delete hoti hai** | ✅ **Session DELETE** — Evolution se logout + DB row + files sab udna chahiye |
| Org delete hoti hai | ✅ Sab branches ke saath |

Agar tujhe sach me **"admin delete = WhatsApp delete"** chahiye, to per-admin model banana hoga
(`WhatsAppInstance.userId`). Bol de, usi hisaab se bana dunga.

---

## 3. Codebase me already kya kya maujood hai (dobara mat banana)

| Cheez | Location | Kaam aayega |
|---|---|---|
| `MessageChannel.WHATSAPP` enum | `schema.prisma:46-51` | **Pehle se hai.** Schema change ki zaroorat nahi. |
| `Parent.whatsappNo` (unique) | `schema.prisma:457` | Parent ki WhatsApp identity. Attendance job me chun-i ja chuki hai, magar kabhi use nahi hui. |
| `OrgSecrets` model | `schema.prisma:720-739` | Branch ka encrypted credential store. Ise copy karo. |
| `secretBox.js` AES-256-GCM | `lib/utils/secretBox.js` | Evolution API key encrypt/decrypt. |
| `emailOutbox.js` retry pattern | `services/emailOutbox.js` | Atomic-claim outbox. Ise copy karo. |
| `notification.service.js` | `:149` `_sendEmail` | Bhai `_sendWhatsApp` bana do. **Ek hi chokepoint.** |
| `SmtpSettingsSection.tsx` | frontend `parts/` | Branch credentials UI ka blueprint. |
| `notification.validation.js:16-23` | validation | ⚠️ **`WHATSAPP` yahin reject hota hai** — fix karna zaroori hai. |

**Sab se ahem baat:** app ka har outbound email ek hi jagah se guzarta hai —
`notification.service.js:149 → emailOutbox.js:113 → email.service.js:256`.
Isi shape me `queueWhatsApp → sendWhatsApp` bana lo to **attendance, fees, circular, PTM, leave,
homework, admission — sab kuch ek hi jagah se WhatsApp pe chala jayega.**

---

## 4. Phone numbers normalize nahi hain — ye HARD blocker hai ⚠️

**Ye optional cleanup nahi hai. Iske bina feature chupke se fail hoga.**

Aaj ki haalat (audit se):

- `auth.validation.js:168` sirf validate karta hai, **transform nahi karta**.
- `auth.service.js:738-755` `whatsappNo` **jaisa input waisa hi save** karta hai.
- `repository.js:533` `findParentByWhatsapp` — exact string match.
- `Parent.whatsappNo` `@unique` hai.

Matlab aaj `'03001234567'` aur `'+923001234567'` **do alag parents** ban rahe hain.
Evolution ko digits-only `923001234567` chahiye.

**Phase 0 me ye karna zaroori hai, warna:**
- Adhoore numbers chupke se fail honge
- Kisi ko pata bhi nahi chalega kyun nahi gaya
- Parents dhoondhe hi nahi jaayenge

**Zaroori steps:**
1. `normalizePkPhone(input) -> '923001234567' | null` — spaces/dashes hatao, `0|0092|92|+92`
   sab accept karo, output me `+` mat rakho.
2. **Write** par normalize karo (parent create/update, admission).
3. Backfill migration — pehle **collision report** dikhao (do parents jo same ho jayein unko
   manually merge karna hoga).
4. **Send** par bhi normalize karo (safety net).

Shared validation `Frontend/src/lib/utils/validation.ts` me bhi mirror karna hoga.

---

## 5. Session lifecycle + deletion ka masla

### Sab se zaroori constraint

Codebase me User ka **hard-delete kahin exist nahi karta**. Sirf ye hai:

| Raasta | Kya hota hai |
|---|---|
| `userManagement.service.js:520` `deactivateUser` | soft: `isActive=false` |
| `school.service.js:678` (branch delete) | `updateMany({ isActive:false, schoolId:null })` — **delete nahi** kiya, taake attendance/fee/audit ke actor rows bache rahein |
| `userManagement.service.js:300` (ownership transfer) | purane admin ke `refreshToken` delete |

`User.schoolId` par `onDelete: Cascade` hai — lekin code pehle `schoolId: null` kar deta hai
(dhyan se, taake cascade accounts na mita de). **Matlab cascade kabhi fire hi nahi hota.**

> ⚠️ **Isliye: agar WhatsApp instance ko `User` se FK jodenge, to admin delete hone par session
> ZAROOR orphan rahegi.** Har lifecycle ka hook **explicit** hona padega.

### Lifecycle table

| Event | Instance DB | Evolution server par session |
|---|---|---|
| Branch admin WhatsApp connect karta hai | create | create + QR return (state `AWAITING_QR`) |
| QR scan ho gaya | — | — | state `CONNECTED`, number save |
| Admin deactivate hua | **REHNE DO** | **REHNE DO** — branch ka number institutional asset hai; sirf uske app tokens revoke |
| Ownership transfer hui | rehne do | rehne do |
| **Branch delete hui** | **row DELETE** | **`DELETE /instance/logout/{name}` + files wipe** |
| Org delete hui | cascade se sab branches | wahi branch wala rule |
| Branch apna number change kare | replace | **purana instance pehle logout** (orphan na bache) |

### Code kahan jayega

1. `whatsappInstance.service.js` — `removeForBranch(schoolId)`
2. `school.service.js` `remove()` me **transaction ke BAAD** call karo — `:689-698` me jo logo
   cleanup hai, usi ke paas. Us block se hi seekho: **external cleanup post-commit + `.catch(() => {})`**.
3. `deactivateUser` me instance delete **mat** karo.

**Order zaroori hai:** DB transaction ko external server ka network call pe depend nahi kar sakte.
Pehle DB row, phir remote teardown, best-effort, failure log ke saath retry ke liye.
**Evolution API down hone par branch delete kabhi block nahi hona chahiye.**

---

## 6. Frontend gaps jo chupke se WhatsApp reject kar denge

| File | Masla |
|---|---|
| `notification.validation.js:16-23` | enum sirf SMS/EMAIL/PORTAL → **`WHATSAPP` API boundary par reject** |
| `Frontend/src/types/notifications.ts:1-12` | type sirf `'SMS' \| 'EMAIL'` |
| `NotificationLogsToolbar.tsx:6-9` | filter: Email / SMS only |
| `NotificationLogsTable.tsx:8-21` | badges: EMAIL/SMS only |

UI jagah: `SettingsPage.tsx` credentials tab (`:99-109`), `StorageSettingsSection` ke baad teesra
card. ⚠️ Ye file **150-line cap me se 131 lines** par hai — sirf ~19 lines bache hain, is liye naya
section alag `parts/` file me banao. `SmtpSettingsSection.tsx` (127 lines) copy karke adapt karo.

---

## 7. Rollout phases

### Phase 0 — Foundation (number ki zaroorat NAHI) ⭐ main abhi kar sakta hoon
- [ ] `whatsappNo` normalize + collision report + backfill
- [ ] Schema: `SecretCategory.WHATSAPP`, `WhatsAppInstance`, `PendingMessage`, migration
- [ ] `evolution.service.js` — `createInstance`, `getQr`, `pairState`, `sendText`, `logoutInstance`, `deleteInstance`
- [ ] `whatsappOutbox.js` — `emailOutbox.js` ki atomic-claim semantics copy
- [ ] `notification.service.js` me `_sendWhatsApp`; `notifyParent({ parentWhatsapp })` widen karo
      (do callers `admission.service.js:470,760` pehle se bhejte hain, chupke se drop ho jata hai)
- [ ] Section 6 ke 4 frontend/validation gaps fix

### Phase 1 — Fake-number test (number ki zaroorat NAHI) ⭐ main abhi kar sakta hoon
- Mock Evolution server + test number `923000000000`
- Verify: routing, branch scoping, outbox retry, logging, permissions, quota

### Phase 2 — Asli number, ek branch
- [ ] `evolution-api` start karo, branch ka number connect karo
- [ ] **Pairing code ya QR** — dono me se koi bhi, **phone tumhare paas** (main nahi kar sakta)
- [ ] Ek branch end-to-end: attendance alert + fee reminder
- [ ] **Phir deletion test karo:** branch delete karo → confirm Evolution instance gayab (row + files)

### Phase 3 — Rollout
- [ ] Per-branch opt-in (`isEnabled`), org-level fallback number
- [ ] Daily quota guard (rate limit hai)
- [ ] Delivery webhooks → `MessageStatus DELIVERED/FAILED`

---

## 8. Khatraat (Risks)

| Khatra | Halaat |
|---|---|
| **WhatsApp ToS** — unofficial automation se number **ban** ho sakta hai. School client ke liye ye asli business risk hai. | Evolution ka official **Cloud API** provider use karo (Meta WABA chahiye), Baileys nahi. Client ko rollout se pehle ye batao. |
| Numbers normalize nahi → chupke se delivery fail | Phase 0 me jab tak fix na ho, koi send nahi |
| Evolution API down → branch delete block | Post-commit best-effort + retry log |
| Rate limit / kharcha | Per-branch daily quota, outbox backoff |
| Instance zyada — har branch ka instance bhaari hai | Default org-level shared number; branch-level sirf opt-in |

---

## 9. Mujhse jo decisions chahiye

1. **Number kis ka?** branch (recommended) ya admin? Isi se deletion ka behaviour badalta hai.
2. **Provider:** unofficial Baileys (free, ban risk) ya official Cloud API (paid, Meta approval)? Main official recommend karta hoon.
3. WhatsApp **saath me email bhi rahe**? (Main: additional channel — email fallback bana rahe, taake instance disconnect ho to kuch na kho jaye)
4. Pehle **kaunse messages**? Attendance + fee reminder.

---

## 10. Banane wali files

**New**
```
Backend/src/modules/whatsapp/whatsappInstance.service.js
Backend/src/modules/whatsapp/whatsappSettings.service.js
Backend/src/modules/whatsapp/whatsapp.controller.js
Backend/src/modules/whatsapp/whatsapp.routes.js
Backend/src/modules/whatsapp/whatsapp.validation.js
Backend/src/services/evolution.service.js
Backend/src/services/whatsappOutbox.js
Backend/src/jobs/cron/pendingMessage.job.js
Frontend/src/features/school/components/parts/WhatsAppSettingsSection.tsx
Frontend/src/features/school/components/parts/WhatsAppQrDialog.tsx
Frontend/src/lib/api/whatsappService.ts
Frontend/src/types/whatsapp.ts
```

**Modify**
```
Backend/prisma/schema.prisma                        SecretCategory + 2 models
Backend/src/services/notification.service.js        _sendWhatsApp + parentWhatsapp
Backend/src/modules/notification/notification.validation.js   WHATSAPP allow
Backend/src/modules/school/school.service.js:689    instance teardown hook
Backend/src/services/scheduler.service.js           pendingMessage cron
Backend/src/routes/index.js                         mount /whatsapp
Frontend/src/features/school/components/SettingsPage.tsx   +1 card
Frontend/src/types/notifications.ts                 WHATSAPP add
Frontend/src/features/.../NotificationLogs*.tsx      filter/badge add
```