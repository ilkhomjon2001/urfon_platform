// Gamifikatsiya qoidalari — YAGONA JOY. Kodning boshqa joyida tanga miqdori yozilmaydi.
// KANON §8: faqat "kumush tanga"; bolani boshqalar bilan solishtiruvchi matnlar yo'q.

export const GAMIFICATION = {
  coins: {
    HOMEWORK_ON_TIME: 10, // uyga vazifa o'z vaqtida topshirildi (tekshiruvdan keyin beriladi)
    ATTENDANCE: 5, // darsga keldi (PRESENT yoki LATE)
    ACTIVITY: { min: 1, max: 5 }, // darsdagi faollik — ustoz belgilaydi
    STREAK: 2, // kunlik seriya (har kuni birinchi faollik uchun)
  },
  // unvonlar (o'sish tartibida)
  titles: [
    { min: 0, name: "Yangi boshlovchi" },
    { min: 500, name: "Faol oʻquvchi" },
    { min: 1000, name: "Kumush burgut" },
    { min: 1500, name: "Oltin qanot" },
    { min: 2500, name: "Olmos burgut" },
  ],
  leaderboard: {
    scope: "group" as const, // markaz bo'yicha reyting yo'q
    period: "week" as const,
    showOthersStreak: false,
    showOthersLevel: false,
  },
} as const;

export function coinTitle(balance: number) {
  const titles = GAMIFICATION.titles;
  let current: (typeof titles)[number] = titles[0];
  for (const t of titles) if (balance >= t.min) current = t;
  const next = titles.find((t) => t.min > balance) ?? null;
  return { current: current.name, next: next ? { name: next.name, remaining: next.min - balance } : null };
}
