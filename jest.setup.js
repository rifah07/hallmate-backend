// Tests create and delete users, so they must never reach a real database.
// .env.test wins over .env; anything but a local database stops the run.
require('dotenv').config({ path: '.env.test', override: true, quiet: true });
process.env.RESEND_API_KEY = ''; // tests never send real email, even if .env has a key

const hostOf = (url) => (URL.canParse(url ?? '') ? new URL(url).hostname : '');
const host = hostOf(process.env.DATABASE_URL);
// DIRECT_URL too: the Prisma CLI prefers it, and .env holds the real one
const direct = process.env.DIRECT_URL ? hostOf(process.env.DIRECT_URL) : 'localhost';
const remote = [host, direct].find((h) => !['localhost', '127.0.0.1'].includes(h));
if (remote !== undefined) {
  throw new Error(
    `Refusing to run tests against "${remote || 'no DATABASE_URL'}". Copy .env.test.example to .env.test (npm run test:db starts a local database).`,
  );
}
