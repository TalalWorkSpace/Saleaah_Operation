# سلعة — Web App لوحة التحكم

## الملفات

| الملف       | الوصف                                  |
| ----------- | -------------------------------------- |
| `Code.gs`   | Server: doGet, wrappers, logs, stats   |
| `index.html`| واجهة المستخدم (HTML Service)           |

## خطوات النشر

### 1) إضافة الملفات

- افتح مشروع Apps Script المربوط بالشيت.
- أضف محتوى `Code.gs` **بجانب** ملفاتك الحالية
  (لا تستبدل دوالك الأصلية).
- أنشئ ملف HTML باسم `index` والصق فيه محتوى `index.html`.

### 2) رفع الصور

**الخيار أ — Google Drive (موصى به):**

1. ارفع `logo.png` و `pattern.png` إلى Google Drive.
2. اضغط "مشاركة" → "أي شخص لديه الرابط".
3. انسخ معرّف الملف (الجزء بين `/d/` و `/view`).
4. في `index.html` استبدل:
   - `LOGO_URL_HERE` بـ:
     `https://drive.google.com/uc?export=view&id=XXXXXX`
   - `PATTERN_URL_HERE` بـ:
     `https://drive.google.com/uc?export=view&id=YYYYYY`

**الخيار ب — Base64:**

- حوّل الصورة إلى Base64 واستخدمها مباشرة:
  `url('data:image/png;base64,...')`

### 3) النشر كـ Web App

1. في محرر السكربت: **Deploy → New deployment**.
2. النوع: **Web app**.
3. الإعدادات:
   - Execute as: **Me**
   - Who has access:
     - `Anyone` (بدون تسجيل دخول)
     - أو `Anyone within [domain]` (أكثر أماناً)
4. اضغط **Deploy**.
5. انسخ الرابط وافتحه في المتصفح.

### 4) منح الصلاحيات (أول مرة فقط)

عند فتح الرابط لأول مرة سيطلب الموافقة على:

- ✅ عرض وإدارة جداول البيانات
- ✅ إدارة التريقرات
- ✅ الاتصال بخدمات خارجية (Shipday API)

اضغط **Review Permissions** → اختر حسابك → **Allow**.

## الأزرار وعملها

| الزر                        | Wrapper            | الدالة الأصلية                  |
| --------------------------- | ------------------ | ------------------------------- |
| رفع طلبات Shipday (غدًا)    | `opFetchUpload`    | `fetchTomorrowOrdersFromMain()` |
| تحديث طلبات Shipday         | `opUpdateExisting` | `updateExistingShipdayOrders()` |
| توزيع Sweep                 | `opDistributeSweep`| `distributeOrders()`            |
| توزيع إلى Main              | `opDistributeToMain`| `distributeToMain()`           |
| إنشاء Trigger / 5 دقائق    | `opSetupTrigger`   | `setupAutoUpdateTrigger()`      |
| حذف جميع Triggers           | `opDeleteTriggers` | `deleteAllUpdateTriggers()`     |

## الأمان

- مفتاح `SHIPDAY_API_KEY` يبقى فقط في Code.gs
  ولا يُرسل أبداً إلى المتصفح.
- جميع العمليات تمر عبر `google.script.run` فقط.
- لا يوجد اتصال مباشر من الواجهة بأي API خارجي.

## التسجيل (Logging)

- كل عملية تُسجَّل تلقائياً في ورقة `Operations_Log`.
- الأعمدة: Timestamp, Task, Status, Details, Duration(ms), User.
- تُنشأ الورقة تلقائياً عند أول عملية إن لم تكن موجودة.

## الإحصاءات

- **Sent to Courier**: عدد الصفوف في العمود G
  التي قيمتها `Sent to Courier`.
- **لديها OrderId**: عدد الصفوف غير الفارغة
  في العمود AZ (رقم 52).
