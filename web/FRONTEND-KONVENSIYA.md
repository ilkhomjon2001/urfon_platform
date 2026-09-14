# URFON web — frontend konvensiyalari

Rol sahifalarini yozuvchi agentlar uchun qoʻllanma. Poydevor (`src/lib`, `src/components/ui`, `src/components/shell`, `src/components/chat`, `src/routes.tsx`) **tayyor va barqaror**. Ularning eksport qilingan API'sini oʻzgartirmang: faqat qoʻshimcha (additive) oʻzgarish mumkin, va buni koordinatorga ayting. Oʻz sahifangizni `src/pages/<rol>/<Fayl>.tsx` ichida yozasiz.

Asosiy manbalar: `design-system/KANON.md` (matn, raqam, atama qoidalari) va mockuplar `stitch_urfon_edtech_teacher_dashboard/urfon_*/code.html`. Mockup klasslari ilovada ham xuddi shunday ishlaydi, chunki preset bir xil.

---

## 0. Ishga tushirish

```bash
# D:\urfon\platforma
npm run typecheck -w web     # har oʻzgarishdan keyin
npm run build -w web
# oʻz backend + web instansiyangiz (3000/5173 lead uchun band):
PORT=3001 npm run dev -w api
WEB_PORT=5174 VITE_API_PROXY=http://localhost:3001 npm run dev -w web
```

Dev admin: `+998901000001` / `urfon2024`.

## 1. Tuzilma

```
src/
  main.tsx, App.tsx, routes.tsx       # provayderlar, router (tayyor)
  lib/
    api.ts          # api.get/post/…, ApiError, upload, fayllar
    auth.tsx        # AuthProvider, useAuth, useCurrentUser, RequireRole
    parent-child.tsx# useSelectedChild (ota-ona)
    query.ts        # queryClient, useApiQuery, useApiMutation, toastError
    format.ts       # fmtNum, fmtMoney, fmtDate … (KANON §3)
    hooks.ts        # useDocumentTitle, useDebouncedValue, useMediaQuery, useSearchParamState, useFlagParam
    roles.ts        # ROLE_BASE, roleHome, settingsPath, ROLE_LABEL, CABINET_NAME
    types.ts        # User, Role, Tone, Paginated, AppNotification, FileMeta …
    cn.ts           # cn() = clsx + tailwind-merge (preset tokenlarini biladi)
  components/
    ui/             # UI kit — import { … } from "@/components/ui"
    shell/          # AppShell, Sidebar, Header, nav.ts, useShellSearch
    chat/ChatView.tsx
  pages/{admin,teacher,parent,student,common}/*.tsx
```

- Import faqat `@/` alias orqali: `import { Button } from "@/components/ui"`.
- Sahifa fayli **default export** qiladi. Fayl nomi va yoʻli oʻzgarmaydi (router lazy import qiladi).
- Sahifaga xos kichik komponentlarni shu sahifa fayli ichida yoki `src/pages/<rol>/components/*.tsx` da saqlang. Umumiy `components/ui` ga yangi fayl qoʻshmang, avval koordinator bilan kelishing.

## 2. Qatʼiy qoidalar

1. **Ranglar faqat tokenlardan:** `bg-primary`, `text-on-surface-variant`, `border-outline-variant`, `bg-surface-container-low`, `text-success`, `bg-warning-container`, `bg-gold`, `text-navy` va h.k. Hex (`bg-[#1e4fc2]`) ishlatilmaydi. Istisno: Telegram/Excel/Click/Payme brend belgilari.
2. **Oʻzbekcha matn.** oʻ/gʻ harflari `ʻ` (U+02BB) bilan, tutuq belgisi `ʼ` (U+02BC) bilan yoziladi: `Oʻquvchilar`, `Toʻlov`, `Aʼlo`, `maʼlumot`. UI matnida ASCII `'` **yoʻq**. Nusxalash uchun belgilar: `ʻ ʼ`.
3. **Atamalar:** oʻquvchi (talaba emas), ustoz (oʻqituvchi emas), guruh (sinf emas), kumush tanga / "tanga" (XP yoki yulduz emas), uyga vazifa, Mock imtihon.
4. **Raqam, pul va sana** faqat `@/lib/format` orqali chiqariladi. `toLocaleString`, `date-fns format` va qoʻlda `toFixed` ishlatilmaydi.
5. **Baholar** 5 ballik tizimda: `gradeLabel(5)` beradi "Aʼlo". "/100", "92 b." kabi yozuvlar ishlatilmaydi. Test natijasi `%` bilan, IELTS band esa `6.5` koʻrinishida.
6. **Bosimsiz gamifikatsiya (KANON §8):** boshqa bolalar bilan solishtiruv, "Top N" yoki markaz reytingi yoʻq.
7. **Bolalar surati yoʻq.** Oʻquvchi uchun `<Avatar name=… />` src'siz ishlatiladi va bosh harflar chiqadi.
8. **Ikonkalar** faqat `<Icon name="…" />` (Material Symbols Outlined). Emoji ishlatilmaydi.
9. **Radius va soya.** Radius: tugma/input `rounded-lg`, karta `rounded-xl`, modal `rounded-2xl`, chip `rounded-full`. Soya: `shadow-card` (karta), `shadow-float` (dropdown/hover), `shadow-modal` (dialog).
10. **Tipografiya klasslari** mockuplardagi juftlik bilan yoziladi: `font-headline-md text-headline-md`, `font-label-md text-label-md`, `text-body-sm`, `font-metric-num text-metric-num`. Raqamli ustunlarda `tabular-nums` ishlatiladi.

## 3. Sahifa skeleti

Qobiq (AppShell) sahifaga padding va max-width beradi. Sahifa tashqi `p-*` qoʻshmaydi.

```tsx
import { Badge, Button, Card, CardContent, CardHeader, PageHeader, StatCard } from "@/components/ui";
import { useApiQuery } from "@/lib/query";
import { fmtNum } from "@/lib/format";

export default function TeacherGroupsPage() {
  const { data, isLoading } = useApiQuery<GroupRow[]>(["teacher", "groups"], "/teacher/groups");
  return (
    <>
      <PageHeader
        title="Guruhlarim"
        subtitle="Biriktirilgan guruhlar va oʻquvchilar"
        breadcrumbs={[{ label: "Bosh sahifa", to: "/ustoz" }, { label: "Guruhlarim" }]} // ixtiyoriy
        actions={<Button icon="add">Yangi guruh</Button>}
      />
      {/* KPI qatori */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Faol guruhlarim" value={fmtNum(5)} unit="ta guruh" icon="groups" loading={isLoading} />
      </div>
      {/* Asosiy ish maydoni: 8/4 ustun */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
          <Card>
            <CardHeader title="Bugungi darslar" badge={<Badge tone="primary">4 ta</Badge>} action={<Button variant="link" size="sm">Barchasi</Button>} />
            <CardContent>…</CardContent>
          </Card>
        </div>
        <aside className="flex min-w-0 flex-col gap-6 lg:col-span-4">…</aside>
      </div>
    </>
  );
}
```

- `PageHeader` `document.title` ni avtomatik qoʻyadi ("Guruhlarim · URFON").
- Sahifa ichidagi boʻshliqlar: kartalar orasida `gap-6`, KPI qatorida `gap-4`, karta ichida `gap-4`.
- Grid ustunlariga `min-w-0` qoʻying, aks holda uzun jadval sahifani gorizontal kengaytirib yuboradi.

## 4. Foydalanuvchi va auth

```tsx
import { useAuth, useCurrentUser } from "@/lib/auth";
const user = useCurrentUser();          // RequireRole ichida har doim mavjud (User)
user.role, user.fullName, user.title, user.avatarUrl
user.student?.coinBalance, user.student?.streakDays, user.student?.level?.name, user.student?.group?.id
user.children                           // ota-ona uchun [{ id, fullName, code, groupName }]
const { refreshMe, logout } = useAuth(); // profil oʻzgargandan keyin refreshMe()
```

- Rol yoʻllari `@/lib/roles` da: `roleHome(role)` beradi `/ustoz`, `settingsPath(role)` beradi `/ustoz/sozlamalar`.
- Himoya routerda qilingan (`RequireRole`), sahifada tekshirish shart emas.
- `mustChangePassword === true` boʻlsa, foydalanuvchi avtomatik Sozlamalarga yoʻnaltiriladi.

## 5. Ota-ona: tanlangan farzand

```tsx
import { useSelectedChild } from "@/lib/parent-child";
const { child } = useSelectedChild();   // ChildSummary | null
const q = useApiQuery<Grades>(["parent", "grades", child?.id], child ? `/parent/children/${child.id}/grades` : null);
```

- Farzandni almashtirish **faqat sidebar'da** (mobilda "Yana" oynasida) qilinadi. Sahifada tanlagich qoʻymang.
- `child.id` ni har doim queryKey ga qoʻshing.
- `child` null boʻlsa, `<EmptyState title="Farzand biriktirilmagan" />` koʻrsating.

## 6. API mijozi

```ts
import { api, ApiError, apiUrl, downloadFile, fileUrl, openFile, useFileObjectUrl } from "@/lib/api";

await api.get<Group[]>("/teacher/groups");                          // → GET /api/teacher/groups
await api.get<Paginated<Row>>("/admin/students", { params: { page, pageSize: 20, q } });
await api.post<Group>("/admin/groups", body);
await api.put / api.patch / api.delete<T>(path, body?)

// multipart (fayl yuklash)
const fd = new FormData();
files.forEach((f) => fd.append("files", f));
fd.append("text", text);
await api.upload<Submission>(`/student/homework/${id}/submit`, fd);   // POST; { method: "PUT" } ham mumkin
```

- Yoʻl `/api` siz yoziladi, prefiksni mijoz oʻzi qoʻshadi. Bearer token va `credentials: "include"` ham avtomatik.
- 401 kelsa, mijoz refresh qilib soʻrovni qayta yuboradi. Refresh ham oʻtmasa, sessiya yopiladi va `/login?next=…` ga yoʻnaltiriladi.
- Xato har doim `ApiError` boʻlib keladi: `{ status, code, message }`. `message` oʻzbekcha, UI'da toʻgʻridan-toʻgʻri koʻrsatish mumkin. Zod xatolarida `e.details?.issues` ham bor. Tarmoq xatosida `status === 0` va `code === "NETWORK"`.
- Sahifalangan roʻyxat shakli: `Paginated<T> = { items, total, page, pageSize, pages }`. Soʻrov `?page=&pageSize=&q=` bilan yuboriladi.
- **Fayllar** (`/api/files/:id`) auth bilan himoyalangan, shuning uchun `<img src="/api/files/…">` **ishlamaydi**:
  - Rasm yoki audio: `const { url, loading } = useFileObjectUrl(file?.id);` keyin `<audio src={url ?? undefined} controls />`.
  - Yuklab olish: `downloadFile(file.id, file.originalName)`.
  - Yangi tabda ochish (PDF): `openFile(file.id)`.
  - Fayl metamaʼlumoti turi: `FileMeta { id, originalName, mime, size }`. Hajmi uchun `fmtFileSize(size)`.
- Statik suratlar (`/avatars/alisher-qosimov.jpg`) `public/` dan keladi va oddiy `<img>` bilan ishlaydi.

## 7. React Query

```ts
import { useApiQuery, useApiMutation, toastError, toastSuccess } from "@/lib/query";
import { toast } from "sonner";

const { data, isLoading, error } = useApiQuery<T>(key, path | null, { params, enabled, refetchInterval, select … });

const save = useApiMutation((body: NewGroup) => api.post<Group>("/admin/groups", body), {
  invalidate: [["admin", "groups"], ["me", "nav-badges"]],   // prefiks boʻyicha
  success: "Guruh yaratildi",                                // toast
  onSuccess: (g) => setOpen(false),
});
save.mutate(form);          // yoki await save.mutateAsync(form)
```

- **queryKey konvensiyasi:** `[rol, resurs, …id]`, masalan `["admin", "students"]`, `["teacher", "group", groupId]`, `["parent", "grades", childId]`. `params` berilsa, kalit oxiriga avtomatik qoʻshiladi. Umumiy kalitlar: `["me"]`, `["me", "nav-badges"]` (sidebar badge'lari, 60 s), `["me", "notifications"]`.
- **Sukut boʻyicha sozlamalar:** `staleTime` 30 s, `retry` 1 marta (4xx xatolarda qayta urinmaydi).
- **Mutation xatosi** avtomatik toast qilinadi. Xatoni forma ichida oʻzingiz koʻrsatsangiz, `silentError: true` bering.
- Qoʻlda toast: `toast.success("…")`, `toastError(e)`.
- Sidebar badge'iga taʼsir qiladigan amaldan keyin `["me", "nav-badges"]` ni invalidate qiling.

## 8. URL parametrlari (`?new=1`, `?t=`)

```ts
import { useFlagParam, useSearchParamState, useDebouncedValue } from "@/lib/hooks";

// Header'dagi "Yangi qoʻshish" menyusi: /admin/oquvchilar?new=1, /admin/guruhlar?new=1, /admin/tolovlar?new=1
const [createOpen, setCreateOpen] = useFlagParam("new");
<Dialog open={createOpen} onOpenChange={setCreateOpen} title="Yangi oʻquvchi">…</Dialog>

// Tab yoki filtr URL'da saqlanadi (default qiymat URL'ga yozilmaydi)
const [tab, setTab] = useSearchParamState("t", "all");
<Tabs value={tab} onValueChange={setTab}>…</Tabs>

// Qidiruv
const [q, setQ] = useSearchParamState("q");
const dq = useDebouncedValue(q, 300);
```

- Bildirishnoma `link` lari va boshqa sahifalardan kelgan havolalar shu parametrlarni ishlatadi (masalan `/ustoz/vazifalar?t=review`). Shuning uchun tab'larni `useSearchParamState("t")` bilan bogʻlang.
- Header qidiruv satri: `const { query } = useShellSearch()` (`@/components/shell/ShellSearch`). Joriy sahifadagi roʻyxatni filtrlash uchun ixtiyoriy. Sahifa almashganda tozalanadi.

## 9. Format helperlari (`@/lib/format`)

Barcha vaqtlar Asia/Tashkent (UTC+5) boʻyicha. Kirish qiymati ISO satr, Date yoki ms boʻlishi mumkin.

| Funksiya | Natija |
|---|---|
| `fmtNum(1240)` | `1 240` (NBSP). `fmtNum(4.6)` → `4.6`. `fmtNum(x, 1)` — aniq 1 kasr |
| `fmtMoney(850000)` | `850 000 soʻm` |
| `fmtPercent(92.8)` / `fmtPercent(93)` | `92.8%` / `93%` |
| `fmtDate(d)` / `fmtDate(d, { year: false })` / `fmtDayMonth(d)` | `24-may, 2024` / `24-may` |
| `fmtDateShort(d)` | `24.05.2024` (jadval) |
| `fmtTime(d)` / `fmtDateTime(d)` | `14:00` / `24.05.2024 14:00` |
| `fmtRelDay(d)` | `Bugun` · `Kecha` · `Ertaga`, boshqa kunlar `fmtDate` |
| `fmtRelDateTime(d)` | `Bugun, 16:32` · `23-may, 16:40` (lenta, xabarlar) |
| `relDayWord(d)` | `"Bugun"`, `"Kecha"`, `"Ertaga"` yoki `null` |
| `fmtWeekday(d)` / `fmtWeekday(d, true)` | `Juma` / `Ju` |
| `fmtMonthYear(d)` | `May, 2024` |
| `fmtDays([1,3,5], "14:00", "15:30")` | `Du · Cho · Ju, 14:00–15:30` (kunlar ISO: 1=Du … 7=Ya) |
| `fmtTimeRange("14:00", "15:30")` | `14:00–15:30` |
| `gradeLabel(5)` / `gradeTone(5)` | `Aʼlo` (4 Yaxshi, 3 Qoniqarli, 2 Qoniqarsiz) / `"success"` |
| `avgLabel(4.6)` / `avgTone(4.6)` / `fmtAvg(4.6)` | `Aʼlo` (≥4.5), `Yaxshi` (≥3.5) … / `"success"` / `4.6` |
| `initials("Ali Valiyev")` | `AV` |
| `fmtPhone("+998901234567")` | `+998 90 123-45-67` |
| `fmtFileSize(4404019)` / `fmtDuration(195)` | `4.2 MB` / `3:15` |
| `academicYearLabel()` | `2023–2024 oʻquv yili · Bahorgi semestr` |
| `toYmd(d)` / `todayYmd()` / `dayDiff(a, b)` / `tzParts(d)` | API uchun `YYYY-MM-DD`, kun farqi, Toshkent qismlari |
| `MONTHS`, `WEEKDAYS_FULL`, `WEEKDAYS_SHORT` | kalendarlar uchun |

## 10. UI kit (`@/components/ui`)

| Komponent | Foydalanish |
|---|---|
| `Button` | `<Button variant="primary\|navy\|secondary\|outline\|ghost\|danger\|link" size="sm\|md\|lg" icon="add" iconRight="arrow_forward" loading block>Saqlash</Button>` |
| `IconButton` | `<IconButton icon="more_vert" label="Amallar" variant="ghost" size="sm" dot />` (`label` majburiy) |
| `buttonVariants` | `<Link to="…" className={buttonVariants({ variant: "outline", size: "sm" })}>…</Link>` |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | `<Card><CardHeader title="…" description="…" icon="groups" badge={…} action={…} divider /><CardContent>…</CardContent></Card>` |
| `StatCard` | `<StatCard label="Jami oʻquvchilar" value={fmtNum(124)} unit="nafar" icon="school" iconTone="gold" badge={<Badge>…</Badge>} delta={{ value: "+12%", positive: true }} sub="oʻtgan oyga nisbatan" progress={93} loading />` |
| `Badge` / `Chip` | `<Badge tone="neutral\|primary\|success\|warning\|danger\|gold\|navy" variant="soft\|solid\|outline" icon="check" dot shape="pill\|square" size="sm\|md">Faol</Badge>` |
| `Alert` | `<Alert tone="primary\|success\|warning\|danger" title="…" action={<Button/>}>matn</Alert>` |
| `Field` | `<Field label="Telefon" hint="…" error={err} required labelAction={…}><Input … /></Field>` (id va aria bogʻlanishi avtomatik) |
| `Input` | `<Input icon="search" rightSlot="soʻm" size="sm\|md\|lg" invalid />` |
| `PasswordInput` | `<PasswordInput value onChange autoComplete="new-password" />` |
| `Textarea` | `<Textarea rows={4} />` |
| `Select` | `<Select value onChange placeholder="Tanlang…" options={[{ value, label }]} />` (native) |
| `Checkbox` | `<Checkbox checked onChange label="Keldi" description="…" />` |
| `SearchInput` | `<SearchInput value={q} onValueChange={setQ} placeholder="Oʻquvchi qidirish…" />` |
| `Dialog` | `<Dialog open onOpenChange title="…" description="…" size="sm\|md\|lg\|xl" footer={<>…</>} trigger={<Button/>}>…</Dialog>` |
| `ConfirmDialog` | `<ConfirmDialog open onOpenChange title="Oʻchirilsinmi?" description="…" tone="danger" confirmLabel="Oʻchirish" onConfirm={() => del.mutateAsync(id)} />` |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | `<Tabs value onValueChange variant="underline\|segmented"><TabsList><TabsTrigger value="all" count={18} icon="list">Barchasi</TabsTrigger></TabsList><TabsContent value="all">…</TabsContent></Tabs>` |
| `DataTable` | `<DataTable rows={data?.items} loading getRowId={(r) => r.id} onRowClick={…} empty={{ icon, title, description, action }} columns={[{ key, header, cell: (r) => …, align: "right", hideBelow: "md", width: 120 }]} />` |
| `Table`, `THead`, `TBody`, `TR`, `TH`, `TD` | Erkin jadval uchun primitivlar. `Table` oʻz ichida gorizontal skroll qiladi |
| `Pagination` | `<Pagination page={page} pageCount={data.pages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} />` |
| `Avatar` | `<Avatar name="Ali Valiyev" src={adultPhotoOrNull} size="xs\|sm\|md\|lg\|xl" tone="soft\|solid\|gold\|neutral" ring />` |
| `Icon` | `<Icon name="groups" filled size={18} className="text-primary" />` |
| `ProgressBar` | `<ProgressBar value={58} tone="primary" size="sm\|md\|lg" label="Level 2" showValue />` |
| `Skeleton` | `<Skeleton className="h-4 w-32" />` |
| `Spinner`, `PageSpinner`, `FullScreenSpinner` | `<Spinner size={20} />` |
| `EmptyState` | `<EmptyState icon="assignment" title="Vazifalar yoʻq" description="…" action={<Button/>} compact />` |
| `PageHeader` | `<PageHeader title subtitle breadcrumbs={[{ label, to }]} badge actions documentTitle />` |
| `DropdownMenu` | `<DropdownMenu trigger={<IconButton … />} label="Amallar" items={[{ label, icon, onSelect, to, tone: "danger", checked, description }, "separator"]} />` |
| `Popover` | `<Popover trigger={<Button/>} className="w-72 p-4" align="end">…</Popover>` |
| `Toaster` | ilova ildizida bor. Chaqirish: `toast.success()` yoki `toastError(e)` |
| `softTone`, `solidTone`, `textTone`, `barTone`, `iconTileTone` | `Tone` → klass xaritalari (oʻz chip/ikonkangiz uchun) |

Mockup naqshlari (koʻchirib ishlatish mumkin):
- **Guruh tegi:** `<Badge tone="navy" shape="square">IELTS Foundation #3</Badge>`.
- **Holat chiplari:** `<Badge tone="success" dot>Faol</Badge>`, `<Badge tone="gold">Navbatdagi</Badge>`.
- **Vaqt bloki** (dars kartasi): `w-16 h-16 rounded-lg bg-surface-container` ichida `font-label-lg` vaqt.
- **Ichki panel:** `rounded-xl bg-surface-container-low p-4`.

## 11. Chat (`@/components/chat/ChatView`)

```tsx
<ChatView
  threads={threads}                       // ChatThread[]: { id, title, subtitle, avatarUrl, icon: "groups", lastMessage, lastAt, unread, online }
  activeId={activeId} onSelect={setActiveId}
  messages={messages}                     // ChatMessage[] (eski → yangi): { id, authorId, authorName, authorAvatarUrl, authorRole, text, createdAt, attachments: [{ id, name, size, mime, fileId }], pending }
  currentUserId={user.id}
  onSend={(text, files) => send.mutateAsync({ threadId: activeId, text, files })}   // reject → matn qaytadi
  threadsLoading={…} messagesLoading={…} sending={send.isPending}
  quickReplies={["Topshiriq qabul qilindi va tekshirilmoqda."]}
  allowAttachments accept="image/*,audio/*,.pdf" threadFilters={…} headerActions={…} composerNote={…}
  className="h-[640px]"                   // ixtiyoriy; default balandlik ekranga moslashadi
/>
```

- Backend: `/api/messages/threads`, `/api/messages/threads/:id`, `/api/messages/threads/:id/messages`, `/api/messages/contacts`, `POST /api/messages`.
- Fayl yuborish `api.upload` (FormData) orqali boʻladi.
- Mobil ekranda bir vaqtda bitta panel koʻrinadi; bu komponent ichida hal qilingan.

## 12. Qobiq (shell)

- Menyu `src/components/shell/nav.ts` da. Sidebar badge'lari `GET /api/me/nav-badges` dan keladi (`{ [navKey]: 12 | "2 kechikkan" }`). Kalitlar:
  - ADMIN: `home, groups, teachers, students, parents, curriculum, payments, reports, audit`
  - TEACHER: `home, groups, schedule, homework, exams, resources, messages`
  - PARENT: `home, lessons, grades, homework, payments, contact`
  - STUDENT: `home, lessons, homework, materials, achievements, chat`
- Faol menyu punkti eng uzun mos prefiks boʻyicha tanlanadi. `/ustoz/darslar/:id` da "Dars jadvali" faol boʻladi.
- Header'da qidiruv, rol chiplari, bildirishnomalar (`/api/me/notifications`) va profil menyusi bor. Sahifa bularni takrorlamaydi.
- Yangi marshrut kerak boʻlsa, `src/routes.tsx` ga faqat **qoʻshing**. Mavjud yoʻllarni oʻzgartirmang.

## 13. Mobil qoidalar (<1024px)

- Sidebar yashiriladi. Pastda 4 ta punktli panel va "Yana" tugmasi turadi; farzand tanlagich va Level widgeti "Yana" oynasida.
- Header balandligi `h-16`, pastki panel `h-16`. Qobiq kontentga `pb-24` beradi, sahifa buni oʻzi qoʻshmaydi.
- **Sahifa gorizontal skroll qilmasligi kerak:**
  - Gridlar `grid-cols-1` dan boshlanadi, keyin `sm:`/`lg:` bilan kengayadi.
  - Ustunlarga `min-w-0` qoʻyiladi.
  - Uzun matnga `truncate` yoki `break-words`.
  - Jadval `Table`/`DataTable` ichida oʻzi skroll qiladi.
  - Tor ekranda kerakmas ustunlarga `hideBelow`.
- Tugmalar qatori `flex flex-wrap gap-2`. Muhim amal mobilda `block` (toʻliq kenglik) boʻlishi mumkin.
- Toʻliq balandlikdagi layoutlarda (chat, kalendar) `dvh` birligidan foydalaning.
- Tekshirish: 390px kenglikda sahifa oʻz eniga sigʻishi kerak.

## 14. Tokenlar tezkor roʻyxati (`tailwind.urfon.cjs`)

- **Sirtlar:** `background` (sahifa), `surface-container-lowest` (karta, oq), `surface-container-low` / `surface-container` / `surface-container-high` (ichki panellar).
- **Matn:** `on-surface` (asosiy), `on-surface-variant` (ikkilamchi), `on-surface-muted` (izoh), `outline` (placeholder, ikonka).
- **Chegara:** `outline-variant`.
- **Brend:** `primary` (koʻk #1E4FC2), `primary-container` / `navy` (#16307E), `gold` (#FFC93C), `primary-fixed` (och koʻk fon), `primary-light`.
- **Semantik:** `success` / `success-container`, `warning` / `warning-container`, `error` / `error-container`. Har biriga mos `on-*-container` matn rangi bor.
- **Tanga va yutuq:** `tertiary-fixed` fon, `text-tertiary` ikonka (Material `toll`, filled).
- **Tipografiya:** `display-lg/sm`, `headline-xl/lg/md/sm`, `metric-num`, `body-lg/md/sm`, `label-lg/md/sm`. `font-*` va `text-*` juft yoziladi.
