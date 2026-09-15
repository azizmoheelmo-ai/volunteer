# بيان - التطوع المدرسي الذكي (Smart School Volunteering)

نظام كامل (Full-Stack) لإدارة دورة العمل التطوعي المدرسي: من إنشاء الفرصة
التطوعية، مروراً بالتقديم والفرز، التحضير، اعتماد الساعات، وحتى تصدير
البيانات بصيغة متوافقة مع الجهات الرسمية.

## البنية التقنية (Architecture)

مشروع مقسم إلى تطبيقين مستقلين يتواصلان عبر REST API:

```
volunteer/
├── backend/    Node.js + Express + TypeScript + Prisma + SQLite (قابل للتحويل لـ PostgreSQL)
└── frontend/   React + TypeScript + Vite + TailwindCSS (RTL / عربي بالكامل)
```

**لماذا هذا الاختيار؟**
- **Prisma + SQLite** للتطوير: صفر إعداد، ملف قاعدة بيانات واحد (`dev.db`)، مع
  إمكانية التحويل لـ PostgreSQL في الإنتاج بتغيير سطر واحد في `schema.prisma`
  (السكيما لا تستخدم أنواع خاصة بـ SQLite، فهي متوافقة مباشرة).
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

## التشغيل محلياً

### الخادم (Backend)

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev --name init   # ينشئ قاعدة بيانات SQLite ويزرع بيانات تجريبية
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
