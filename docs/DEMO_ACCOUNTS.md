# Demo accounts

Try every role on the live site: **https://hallmate.vercel.app/login**

Every demo account uses the password **`HallMate@Demo1`**.

| Role | University ID | What to look at |
|---|---|---|
| Administrator | `9900000001` | People, floor plan, billing, every request |
| Provost | `9900000002` | Decide requests, issue renewal bills, notices for the whole hall |
| House tutor (floor 9) | `9900000003` | Only floor 9: its residents, rooms, requests and visitors |
| Guard | `9900000004` | Today's visitors, check an ID card |
| Dining staff | `9900000005` | How many meals to cook each day |
| Maintenance staff | `9900000006` | The repair assigned to them (a ceiling fan in A-901) |
| Office staff | `9900000007` | Assigned tasks only, no residents' details |
| Resident | `9900000011` | Room A-901, ID card with QR, a bill to pay, a leave request, a visitor today |
| Resident | `9900000012` | A paid bill, a repair request, a visitor waiting for approval |

## Read-only

Demo accounts can open every screen but **cannot change anything**: the API answers any change with
"Demo accounts can look around but not change anything." Real accounts are not affected.
The rule lives in one place, [`src/shared/middleware/authenticate.ts`](../src/shared/middleware/authenticate.ts), and is covered by test #13 in `src/shared/tests/security.test.ts`.

## Sample content

Events, achievements, the FAQ, dining and admission details, two notices with PDFs, the gallery illustrations
and the house tutors' floors are sample content, marked **Sample** on the site. No photos of real people are used anywhere.

The residents, rooms, bills, requests and visitors behind the demo accounts are fictional.

## For maintainers

```bash
npm run db:demo          # add the demo accounts and sample content (re-run to refresh dates)
npm run db:demo:remove   # delete all of it; real data is untouched
```
