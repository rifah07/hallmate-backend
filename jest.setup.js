// Tests create and delete users, so they must never reach a real database.
// .env.test wins over .env; anything but a local database stops the run.
require('dotenv').config({ path: '.env.test', override: true, quiet: true });

const host = URL.canParse(process.env.DATABASE_URL ?? '') && new URL(process.env.DATABASE_URL).hostname;
if (!['localhost', '127.0.0.1'].includes(host)) {
  throw new Error(
    `Refusing to run tests against "${host || 'no DATABASE_URL'}". Copy .env.test.example to .env.test (npm run test:db starts a local database).`,
  );
}
