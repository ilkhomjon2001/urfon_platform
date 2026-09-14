// RBAC ko'lam tekshiruvlari — "ustoz faqat o'z guruhini, ota-ona faqat o'z farzandini ko'radi".
// Har bir rol endpoint'i ma'lumotga tegishdan oldin shu funksiyalardan birini chaqirishi SHART.
// Topilmasa yoki ruxsat bo'lmasa 404 qaytariladi (boshqalarning ID'lari borligini oshkor qilmaslik uchun).
import type { Role } from "@prisma/client";
import { prisma } from "../db.js";
import { notFound } from "./errors.js";
import type { AuthUser } from "./auth.js";

// ── Ustoz ──
export async function teacherGroupIds(teacherId: string) {
  const gs = await prisma.group.findMany({ where: { teacherId }, select: { id: true } });
  return gs.map((g) => g.id);
}

export async function assertTeacherGroup(teacherId: string, groupId: string) {
  const g = await prisma.group.findFirst({ where: { id: groupId, teacherId } });
  if (!g) throw notFound("Guruh topilmadi");
  return g;
}

export async function assertTeacherLesson(teacherId: string, lessonId: string) {
  const l = await prisma.lesson.findFirst({ where: { id: lessonId, group: { teacherId } }, include: { group: true } });
  if (!l) throw notFound("Dars topilmadi");
  return l;
}

export async function assertTeacherHomework(teacherId: string, homeworkId: string) {
  const h = await prisma.homework.findFirst({ where: { id: homeworkId, group: { teacherId } } });
  if (!h) throw notFound("Vazifa topilmadi");
  return h;
}

export async function assertTeacherSubmission(teacherId: string, submissionId: string) {
  const s = await prisma.submission.findFirst({
    where: { id: submissionId, homework: { group: { teacherId } } },
    include: { homework: true },
  });
  if (!s) throw notFound("Topshiriq topilmadi");
  return s;
}

/** Ustoz shu o'quvchiga dars beradimi (o'quvchi ustozning biror guruhida). */
export async function assertTeacherStudent(teacherId: string, studentId: string) {
  const e = await prisma.groupStudent.findFirst({ where: { studentId, group: { teacherId } } });
  if (!e) throw notFound("Oʻquvchi topilmadi");
  return e;
}

// ── Ota-ona ──
export async function parentChildIds(parentId: string) {
  const links = await prisma.parentStudent.findMany({ where: { parentId }, select: { studentId: true } });
  return links.map((l) => l.studentId);
}

export async function assertParentChild(parentId: string, studentId: string) {
  const link = await prisma.parentStudent.findUnique({ where: { parentId_studentId: { parentId, studentId } } });
  if (!link) throw notFound("Farzand topilmadi");
  return link;
}

// ── O'quvchi ──
export async function studentGroupIds(studentId: string, includeWaiting = false) {
  const es = await prisma.groupStudent.findMany({
    where: { studentId, status: includeWaiting ? { in: ["ACTIVE", "WAITING"] } : "ACTIVE" },
    select: { groupId: true },
  });
  return es.map((e) => e.groupId);
}

export async function assertStudentInGroup(studentId: string, groupId: string) {
  const e = await prisma.groupStudent.findFirst({ where: { studentId, groupId } });
  if (!e) throw notFound("Guruh topilmadi");
  return e;
}

// ── Xabarlar ──
export async function assertThreadParticipant(userId: string, threadId: string) {
  const p = await prisma.threadParticipant.findUnique({ where: { threadId_userId: { threadId, userId } } });
  if (!p) throw notFound("Suhbat topilmadi");
  return p;
}

/**
 * Kim kim bilan yozisha oladi:
 * ADMIN — hamma bilan; TEACHER — o'z o'quvchilari, ularning ota-onalari, adminlar;
 * PARENT — farzandining ustozlari va adminlar; STUDENT — o'z ustozlari.
 */
export async function canMessage(from: AuthUser, toUserId: string): Promise<boolean> {
  if (from.userId === toUserId) return false;
  const to = await prisma.user.findUnique({ where: { id: toUserId }, select: { role: true, isActive: true } });
  if (!to?.isActive) return false;
  if (from.role === "ADMIN" || to.role === "ADMIN") return true;
  const pair = (a: Role, b: Role) => (from.role === a && to.role === b) || (from.role === b && to.role === a);
  const [teacherId, otherId] = from.role === "TEACHER" ? [from.userId, toUserId] : [toUserId, from.userId];
  if (pair("TEACHER", "STUDENT")) {
    return !!(await prisma.groupStudent.findFirst({ where: { studentId: otherId, group: { teacherId } } }));
  }
  if (pair("TEACHER", "PARENT")) {
    return !!(await prisma.parentStudent.findFirst({
      where: { parentId: otherId, student: { enrollments: { some: { group: { teacherId } } } } },
    }));
  }
  return false;
}

// ── Fayllar ──
/** Fayl kimga ko'rinadi. Admin — hammaga; qolganlar faylga bog'langan obyekt orqali. */
export async function canAccessFile(u: AuthUser, fileId: string) {
  const f = await prisma.file.findUnique({
    where: { id: fileId },
    include: {
      material: { select: { groupId: true } },
      submission: { select: { studentId: true, homework: { select: { groupId: true } } } },
      homework: { select: { groupId: true } },
      message: { select: { threadId: true } },
    },
  });
  if (!f) return null;
  if (u.role === "ADMIN" || f.uploadedById === u.userId) return f;

  const inGroup = async (groupId: string) => {
    if (u.role === "TEACHER") return !!(await prisma.group.findFirst({ where: { id: groupId, teacherId: u.userId } }));
    if (u.role === "STUDENT") return !!(await prisma.groupStudent.findFirst({ where: { groupId, studentId: u.userId } }));
    if (u.role === "PARENT")
      return !!(await prisma.groupStudent.findFirst({ where: { groupId, student: { parents: { some: { parentId: u.userId } } } } }));
    return false;
  };

  if (f.material) {
    if (!f.material.groupId) return f; // umumiy resurslar bazasi — barcha foydalanuvchilarga
    return (await inGroup(f.material.groupId)) ? f : null;
  }
  if (f.submission) {
    const { studentId } = f.submission;
    if (u.role === "STUDENT") return studentId === u.userId ? f : null;
    if (u.role === "PARENT") return (await prisma.parentStudent.findFirst({ where: { parentId: u.userId, studentId } })) ? f : null;
    if (u.role === "TEACHER") return (await inGroup(f.submission.homework.groupId)) ? f : null;
    return null;
  }
  if (f.homework) return (await inGroup(f.homework.groupId)) ? f : null;
  if (f.message) {
    return (await prisma.threadParticipant.findUnique({ where: { threadId_userId: { threadId: f.message.threadId, userId: u.userId } } }))
      ? f
      : null;
  }
  return null;
}
