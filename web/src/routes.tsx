import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet, ScrollRestoration, type RouteObject } from "react-router-dom";
import { AppShell } from "@/components/shell/AppShell";
import { RouteError } from "@/components/shell/RouteError";
import { FullScreenSpinner } from "@/components/ui";
import { RequireRole, useAuth } from "@/lib/auth";
import { ROLE_BASE, roleHome } from "@/lib/roles";
import type { Role } from "@/lib/types";

// ---------------------------------------------------------------- sahifalar (lazy, har biri alohida chunk)
const Login = lazy(() => import("@/pages/common/Login"));
const Settings = lazy(() => import("@/pages/common/Settings"));
const NotFound = lazy(() => import("@/pages/common/NotFound"));

const Admin = {
  Dashboard: lazy(() => import("@/pages/admin/Dashboard")),
  Groups: lazy(() => import("@/pages/admin/Groups")),
  Teachers: lazy(() => import("@/pages/admin/Teachers")),
  Students: lazy(() => import("@/pages/admin/Students")),
  Parents: lazy(() => import("@/pages/admin/Parents")),
  Curriculum: lazy(() => import("@/pages/admin/Curriculum")),
  Payments: lazy(() => import("@/pages/admin/Payments")),
  Reports: lazy(() => import("@/pages/admin/Reports")),
  Audit: lazy(() => import("@/pages/admin/Audit")),
};

const Teacher = {
  Dashboard: lazy(() => import("@/pages/teacher/Dashboard")),
  Groups: lazy(() => import("@/pages/teacher/Groups")),
  GroupDetail: lazy(() => import("@/pages/teacher/GroupDetail")),
  LessonConduct: lazy(() => import("@/pages/teacher/LessonConduct")),
  Schedule: lazy(() => import("@/pages/teacher/Schedule")),
  Homework: lazy(() => import("@/pages/teacher/Homework")),
  Exams: lazy(() => import("@/pages/teacher/Exams")),
  Resources: lazy(() => import("@/pages/teacher/Resources")),
  Messages: lazy(() => import("@/pages/teacher/Messages")),
};

const Parent = {
  Dashboard: lazy(() => import("@/pages/parent/Dashboard")),
  Lessons: lazy(() => import("@/pages/parent/Lessons")),
  LessonDetail: lazy(() => import("@/pages/parent/LessonDetail")),
  Grades: lazy(() => import("@/pages/parent/Grades")),
  Homework: lazy(() => import("@/pages/parent/Homework")),
  Payments: lazy(() => import("@/pages/parent/Payments")),
  Contact: lazy(() => import("@/pages/parent/Contact")),
};

const Student = {
  Dashboard: lazy(() => import("@/pages/student/Dashboard")),
  Lessons: lazy(() => import("@/pages/student/Lessons")),
  Homework: lazy(() => import("@/pages/student/Homework")),
  HomeworkDo: lazy(() => import("@/pages/student/HomeworkDo")),
  Materials: lazy(() => import("@/pages/student/Materials")),
  Achievements: lazy(() => import("@/pages/student/Achievements")),
  Chat: lazy(() => import("@/pages/student/Chat")),
};

// ---------------------------------------------------------------- yordamchi elementlar

function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Suspense fallback={<FullScreenSpinner />}>
        <Outlet />
      </Suspense>
    </>
  );
}

function RootRedirect() {
  const { status, user } = useAuth();
  if (status === "loading") return <FullScreenSpinner />;
  return <Navigate to={user ? roleHome(user.role) : "/login"} replace />;
}

/** Rol daraxti: RequireRole + AppShell; har rolda /sozlamalar va ichki 404. */
function roleTree(role: Role, pages: RouteObject[]): RouteObject {
  return {
    path: ROLE_BASE[role],
    element: (
      <RequireRole role={role}>
        <AppShell role={role} />
      </RequireRole>
    ),
    children: [
      {
        errorElement: <RouteError inline />,
        children: [...pages, { path: "sozlamalar", element: <Settings /> }, { path: "*", element: <NotFound /> }],
      },
    ],
  };
}

// ---------------------------------------------------------------- marshrutlar

export const router = createBrowserRouter(
  [
    {
      element: <RootLayout />,
      errorElement: <RouteError />,
      children: [
        { path: "/", element: <RootRedirect /> },
        { path: "/login", element: <Login /> },

        roleTree("ADMIN", [
          { index: true, element: <Admin.Dashboard /> },
          { path: "guruhlar", element: <Admin.Groups /> },
          { path: "ustozlar", element: <Admin.Teachers /> },
          { path: "oquvchilar", element: <Admin.Students /> },
          { path: "ota-onalar", element: <Admin.Parents /> },
          { path: "mavzular", element: <Admin.Curriculum /> },
          { path: "tolovlar", element: <Admin.Payments /> },
          { path: "hisobotlar", element: <Admin.Reports /> },
          { path: "jurnal", element: <Admin.Audit /> },
        ]),

        roleTree("TEACHER", [
          { index: true, element: <Teacher.Dashboard /> },
          { path: "guruhlar", element: <Teacher.Groups /> },
          { path: "guruhlar/:groupId", element: <Teacher.GroupDetail /> },
          { path: "darslar/:lessonId", element: <Teacher.LessonConduct /> },
          { path: "jadval", element: <Teacher.Schedule /> },
          { path: "vazifalar", element: <Teacher.Homework /> },
          { path: "imtihonlar", element: <Teacher.Exams /> },
          { path: "resurslar", element: <Teacher.Resources /> },
          { path: "xabarlar", element: <Teacher.Messages /> },
        ]),

        roleTree("PARENT", [
          { index: true, element: <Parent.Dashboard /> },
          { path: "darslar", element: <Parent.Lessons /> },
          { path: "darslar/:lessonId", element: <Parent.LessonDetail /> },
          { path: "baholar", element: <Parent.Grades /> },
          { path: "vazifalar", element: <Parent.Homework /> },
          { path: "tolovlar", element: <Parent.Payments /> },
          { path: "aloqa", element: <Parent.Contact /> },
        ]),

        roleTree("STUDENT", [
          { index: true, element: <Student.Dashboard /> },
          { path: "darslar", element: <Student.Lessons /> },
          { path: "vazifalar", element: <Student.Homework /> },
          { path: "vazifalar/:homeworkId", element: <Student.HomeworkDo /> },
          { path: "materiallar", element: <Student.Materials /> },
          { path: "yutuqlar", element: <Student.Achievements /> },
          { path: "chat", element: <Student.Chat /> },
        ]),

        { path: "*", element: <NotFound /> },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);
