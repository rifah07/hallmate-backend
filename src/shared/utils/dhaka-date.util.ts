// The hall runs on Bangladesh time. A server in UTC would flip "today" at
// 6 a.m. Dhaka time, so a guard's morning list would show yesterday.
const dhakaDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }); // en-CA → YYYY-MM-DD

/** Today in Dhaka as a UTC-midnight Date: the form Postgres DATE columns use. */
export const dhakaToday = (): Date => new Date(dhakaDay.format(new Date()));

export const addDays = (day: Date, days: number): Date =>
  new Date(day.getTime() + days * 24 * 60 * 60 * 1000);
