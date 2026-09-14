import { prisma } from "../db.js";

/** /api/me va login javobidagi foydalanuvchi obyekti (web: src/lib/types.ts → User). */
export async function buildUserDto(userId: string) {
  const u = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { studentProfile: true, telegramLink: true },
  });
  const base = {
    id: u.id,
    login: u.login,
    role: u.role,
    fullName: u.fullName,
    title: u.title,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    mustChangePassword: u.mustChangePassword,
    telegramLinked: !!u.telegramLink?.isActive,
    branch: await prisma.branch.findFirst({ select: { name: true }, orderBy: { name: "asc" } }),
  };

  if (u.role === "STUDENT" && u.studentProfile) {
    const enr = await prisma.groupStudent.findFirst({
      where: { studentId: u.id, status: "ACTIVE" },
      orderBy: { joinedAt: "desc" },
      include: { group: { include: { level: true } } },
    });
    let level: { name: string; progress: number } | null = null;
    if (enr) {
      const done = await prisma.lesson.count({ where: { groupId: enr.groupId, status: "DONE" } });
      const lv = enr.group.level;
      level = {
        name: lv ? `${lv.code.startsWith("L") ? `Level ${lv.code.slice(1)} · ` : ""}${lv.name}` : enr.group.name,
        progress: Math.min(100, Math.round((done / Math.max(1, enr.group.totalLessons)) * 100)),
      };
    }
    return {
      ...base,
      student: {
        code: u.studentProfile.code,
        coinBalance: u.studentProfile.coinBalance,
        streakDays: u.studentProfile.streakDays,
        level,
        group: enr ? { id: enr.group.id, name: enr.group.name } : null,
      },
    };
  }

  if (u.role === "PARENT") {
    const links = await prisma.parentStudent.findMany({
      where: { parentId: u.id },
      include: {
        student: {
          include: {
            studentProfile: true,
            enrollments: { where: { status: { in: ["ACTIVE", "WAITING"] } }, include: { group: true }, orderBy: { joinedAt: "desc" } },
          },
        },
      },
    });
    // birinchi o'qishni boshlagan farzand birinchi (standart tanlov)
    links.sort(
      (a, b) =>
        (a.student.studentProfile?.enrolledAt.getTime() ?? 0) - (b.student.studentProfile?.enrolledAt.getTime() ?? 0) ||
        a.student.fullName.localeCompare(b.student.fullName),
    );
    return {
      ...base,
      children: links.map((l) => ({
        id: l.student.id,
        fullName: l.student.fullName,
        code: l.student.studentProfile?.code ?? "",
        groupName: l.student.enrollments[0]?.group.name ?? null,
        relation: l.relation,
      })),
    };
  }
  return base;
}
