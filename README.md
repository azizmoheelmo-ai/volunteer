# بيان - التطوع المدرسي الذكي (Smart School Volunteering)

نظام كامل (Full-Stack) لإدارة دورة العمل التطوعي المدرسي: من إنشاء الفرصة
التطوعية، مروراً بالتقديم والفرز، التحضير، اعتماد الساعات، وحتى تصدير
البيانات بصيغة متوافقة مع الجهات الرسمية.

## البنية التقنية (Architecture)

مشروع مقسم إلى تطبيقين مستقلين يتواصلان عبر REST API:

```
volunteer/
├── backend/    Node.js + Express + TypeScript + Prisma + PostgreSQL
└── frontend/   React + TypeScript + Vite + TailwindCSS (RTL / عربي بالكامل)
```

**لماذا هذا الاختيار؟**
- **Prisma + PostgreSQL**: قاعدة بيانات علائقية قوية ومناسبة للإنتاج، مع
  Prisma كطبقة ORM آمنة الأنواع (Type-safe) تسهّل التوسع لاحقاً.
- **REST API بسيط** بدل GraphQL: يسهّل الدمج المستقبلي مع أنظمة وزارة التعليم
  والمنصة الوطنية للعمل التطوعي التي غالباً تتعامل مع REST/Webhooks.
- **QR Code + رابط فريد** يُولَّدان من الخادم مباشرة (مكتبة `qrcode`) بحيث لا
  يعتمد التطبيق على أي خدمة خارجية لتوليد الرموز.

## هيكلية قاعدة البيانات (Database Schema)

| الجدول | الوصف |
|---|---|
| **User** | المستخدمون (مشرف تطوع / طالب / مسؤول نظام) - الاسم، البريد، الدور، رقم الطالب، الصف |
| **Opportunity** | الفرصة التطوعية - العنوان، الوصف، المجال، التوقيت، الساعات، الحد الأقصى، رابط فريد (`uniqueSlug`) |
| **Application** | طلب تقديم الطالب على فرصة - المهارات، الحالة (قيد المراجعة/مقبول/مرفوض) |
| **Attendance** | كشف التحضير الرقمي - سطر واحد لكل طالب مقبول، يُنشأ تلقائياً عند القبول |
| **HoursCredit** | سجل اعتماد الساعات (يشكّل المحفظة الرقمية) - يُنشأ عند الضغط على "اعتماد ورصد الساعات" |
| **Notification** | إشعارات الطالب عند القبول/الرفض/اعتماد الساعات |

مخطط العلاقات الكامل موجود في [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).

**قرار تصميمي مهم:** لا يوجد جدول "محفظة" منفصل. المحفظة الرقمية للطالب هي
ببساطة تجميع (`SUM`) لسجلات `HoursCredit` الخاصة به — هذا يمنع تكرار الحالة
(state) بين جدولين ويُبقي مصدر الحقيقة واحداً.

## واجهات API (REST Endpoints)

جميع المسارات تحت `/api`، والمصادقة عبر `Authorization: Bearer <JWT>`.

| المسار | الوصف |
|---|---|
| `POST /auth/register` `/auth/login` `GET /auth/me` | المصادقة |
| `POST /opportunities` | إنشاء فرصة (مشرف) - يولّد رابط فريد تلقائياً |
| `GET /opportunities?mine=true&status=&field=` | قائمة فرص المشرف |
| `GET /opportunities/student-feed` | الفرص المتاحة للطالب حسب صفه |
| `GET /opportunities/:id` | تفاصيل الفرصة + رمز QR (base64) |
| `PATCH /opportunities/:id` `DELETE /opportunities/:id` | تعديل/حذف |
| `POST /opportunities/:id/applications` | تقديم الطالب (مع حقل مهارات اختياري) |
| `GET /opportunities/:id/applications?grade=&status=&skills=` | لوحة الفرز مع الفلاتر |
| `PATCH /applications/:id/decision` | قبول/رفض + إشعار تلقائي |
| `GET /opportunities/:id/attendance` | كشف التحضير |
| `PATCH /opportunities/:id/attendance/:attendanceId` | تسجيل حضور/غياب بضغطة زر |
| `PATCH /opportunities/:id/attendance/bulk` | تسجيل جماعي |
| `POST /opportunities/:id/attendance/approve-hours` | اعتماد ورصد الساعات لكل الحاضرين |
| `GET /students/me/wallet` `GET /students/:id/wallet` | المحفظة التطوعية الرقمية |
| `GET /students/me/applications` | سجل تقديمات الطالب |
| `GET /reports/opportunities/:id/roster.xlsx` `.../roster.pdf` | تصدير كشف المتطوعين |
| `GET /reports/students/me/certificate.pdf` | شهادة سجل التطوع للطالب |
| `GET /public/opportunities/:slug` | صفحة عامة (بدون تسجيل دخول) لعرض الفرصة عبر رابط QR/المشاركة |

## النشر السحابي المجاني (بدون طرفية) — Render

أسهل طريقة لتجربة النظام كرابط تفتحه من أي جهاز، بدون تثبيت أي برامج:

1. أنشئ حساباً مجانياً على [render.com](https://render.com) (يمكن الدخول مباشرة بحساب GitHub).
2. من لوحة Render اضغط **New +** ثم اختر **Blueprint**.
3. اربط حساب GitHub وحدد المستودع `azizmoheelmo-ai/volunteer` والفرع
   `claude/smart-school-volunteering-system-v75dy9`.
4. سيكتشف Render ملف [`render.yaml`](render.yaml) تلقائياً وينشئ 3 خدمات:
   قاعدة بيانات PostgreSQL، خادم الـ Backend، وموقع الـ Frontend الثابت.
   اختر الخطة **Free** لكل خدمة إذا ظهرت لك خيارات الخطط، ثم اضغط **Apply**.
5. انتظر 3-5 دقائق حتى تكتمل عملية البناء والنشر (تقدر تتابع السجلات "Logs").
6. افتح رابط خدمة `bayan-frontend` (يظهر أعلى صفحتها في لوحة Render، عادة
   بصيغة `https://bayan-frontend.onrender.com`) — هذا رابط النظام الجاهز.

> ملاحظة: أول طلب بعد فترة خمول قد يأخذ حتى 30-50 ثانية ليستيقظ الخادم
> (سلوك طبيعي في الخطة المجانية من Render). إذا كان اسم الخدمة محجوزاً من
> مستخدم آخر، سيضيف Render لاحقة عشوائية للرابط — تحقق من الرابط الفعلي في
> لوحة التحكم وحدّث متغير `VITE_API_URL` في خدمة الـ Backend إذا لزم الأمر.

## التشغيل محلياً

يتطلب التشغيل المحلي وجود PostgreSQL (محلي عبر Docker، أو رابط مجاني من
[neon.tech](https://neon.tech) أو [supabase.com](https://supabase.com)).

### الخادم (Backend)

```bash
cd backend
npm install
cp .env.example .env                 # عدّل DATABASE_URL برابط قاعدة بياناتك
npx prisma migrate dev --name init   # ينشئ الجداول ويزرع بيانات تجريبية
npm run dev                          # يعمل على http://localhost:4000
```

### الواجهة (Frontend)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                          # يعمل على http://localhost:5173
```

### حسابات تجريبية (بعد الزراعة/seed)

| الدور | البريد | كلمة المرور |
|---|---|---|
| مشرف تطوع | teacher@bayan.edu.sa | password123 |
| طالبة | sara@bayan.edu.sa | password123 |

## الميزات المُنفّذة

- **لوحة مشرف التطوع:** إنشاء فرصة، توليد رابط + QR تلقائياً، لوحة فرز مع
  فلترة (الصف/الحالة/المهارات) وأزرار قبول/رفض سريعة مع إشعار الطالب، كشف
  تحضير رقمي بضغطة زر، زر "اعتماد ورصد الساعات" يُرحّل الساعات للمحفظة
  الرقمية دفعة واحدة لكل الحاضرين.
- **واجهة الطالب:** استعراض الفرص المناسبة لصفه فقط، تقديم سريع بضغطة زر مع
  حقل مهارات اختياري، محفظة رقمية بعداد ساعات إجمالي وسجل كامل بالمبادرات.
- **التصدير:** Excel (ورقتين: كشف المتطوعين + بيانات المبادرة) و PDF لكل من
  كشف المتطوعين وشهادة سجل التطوع الفردية للطالب — جاهزة للتسليم كملفات
  رسمية.

## نقاط للتوسع المستقبلي (خارج نطاق هذا التسليم)

- ربط مباشر (API integration) مع المنصة الوطنية للعمل التطوعي عبر Webhook
  عند اعتماد الساعات.
- إشعارات فورية عبر Push/SMS بدل الإشعارات داخل النظام فقط.
- تسجيل دخول موحّد (SSO) مع نظام نور/بيانات وزارة التعليم بدل التسجيل المباشر.
