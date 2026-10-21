# InstaStory Desktop

A Chrome extension that lets you **post Instagram stories from your computer**, directly on instagram.com, in a dialog that looks like Instagram itself. Photos and videos, with mentions, links, location, hashtags, polls, questions, quizzes, sliders, countdowns, emoji, photo stickers, music, custom fonts and saved styles.

> ⚠️ This extension uses Instagram's web endpoints, which Instagram does not document or support for third parties. It can stop working at any time, and using automation on Instagram may violate its Terms of Use. Use it on your own account, at your own risk.

---

## English

### Features

- Open the story composer from Instagram's left menu (a **Story** item next to Reels), a floating button, or **Alt+Shift+S**.
- Add photos and videos by drag & drop, file picker, or Ctrl+V.
- Fit the whole media or fill the screen, with a blurred, solid or gradient background.
- Stickers: location, mention, hashtag, link, poll, questions, quiz, emoji slider, countdown, emoji, photo.
- Style every sticker: fonts (including Arabic fonts), colours, presets, icons, corners, opacity, scale and rotation.
- Upload your own font (.ttf / .otf) and save default styles per sticker type ("brand kit").
- Music: upload an MP3, M4A or WAV, choose the part of the song and the story length. The music is mixed into the story.
- Share to everyone or to Close Friends.

### Install

1. Download the latest `InstaStory-Desktop.zip` from the **Releases** page, or clone this repository.
2. Unzip it (if needed) into a folder you will keep.
3. Open `chrome://extensions`.
4. Turn on **Developer mode** (top right).
5. Click **Load unpacked** and select the folder that contains `manifest.json`.
6. Log in to `instagram.com` in the same Chrome profile.

### Usage

1. Open instagram.com and click **Story** in the left menu (or press **Alt+Shift+S**).
2. Add a photo or video.
3. Add stickers from the **Stickers** section and style them.
4. Optional: add music from the **Music** section.
5. Press **Share to story**.

Keyboard shortcuts inside the composer: **Del** removes the selected sticker, **Ctrl+D** duplicates it, **arrow keys** move it (Shift = larger steps), **Esc** closes the dialog.

### Limits

- Videos up to 60 seconds.
- One link sticker per story.
- Videos with stickers, a custom background or music are re-rendered in real time, so keep the tab open while they process.
- Instagram's own music library is not available from the web. Upload an audio file instead.

### Project structure

```
manifest.json        Extension manifest (Manifest V3)
background.js        Service worker: header rules and CDN/upload helpers
src/hook.js          Runs in Instagram's page: records its request headers
src/core.js          Instagram API calls, fonts, saved styles
src/stickers.js      Sticker types, drawing and the story parameters
src/music.js         Music search, loading and preview
src/ui.js            The composer dialog
fonts/               Open-licence fonts (SIL OFL), see the font files
icons/               Extension icons
```

### Privacy

Everything runs in your browser. The extension reads your existing Instagram session cookies only to make requests as you, and sends nothing to any other server.

---

## العربية

### المزايا

- افتح محرر الستوري من القائمة اليسرى في إنستغرام (عنصر **Story** بجانب Reels)، أو من الزر العائم، أو بالاختصار **Alt+Shift+S**.
- أضف الصور والفيديوهات بالسحب والإفلات، أو باختيار الملف، أو بـ Ctrl+V.
- اعرض الصورة كاملة أو املأ الشاشة، مع خلفية ضبابية أو لون ثابت أو متدرج.
- ملصقات: الموقع، والإشارة لحساب، والهاشتاغ، والرابط، والتصويت (Poll)، والأسئلة، والاختبار (Quiz)، ومنزلق الإيموجي، والعد التنازلي، والإيموجي، والصورة.
- خصص كل ملصق: الخطوط (بما فيها الخطوط العربية)، والألوان، والأشكال الجاهزة، والأيقونات، وانحناء الزوايا، والشفافية، والحجم والدوران.
- ارفع خطك الخاص (.ttf / .otf) واحفظ الأنماط الافتراضية لكل نوع من الملصقات (“brand kit”).
- الموسيقى: ارفع ملف MP3 أو M4A أو WAV، واختر الجزء من الأغنية ومدة الستوري. تُدمج الموسيقى داخل الستوري.
- شارك مع الجميع، أو مع الأصدقاء المقربين فقط.

### التثبيت

1. حمّل أحدث ملف `InstaStory-Desktop.zip` من صفحة **Releases**، أو انسخ (clone) هذا المستودع.
2. فك الضغط (إذا لزم) إلى مجلد تحتفظ به.
3. افتح `chrome://extensions`.
4. فعّل **Developer mode** من الأعلى على اليمين.
5. اضغط **Load unpacked** واختر المجلد الذي يحتوي على `manifest.json`.
6. سجّل الدخول إلى `instagram.com` في نفس ملف تعريف Chrome.

### طريقة الاستعمال

1. افتح instagram.com واضغط **Story** في القائمة اليسرى (أو اضغط **Alt+Shift+S**).
2. أضف صورة أو فيديو.
3. أضف ملصقات من قسم **Stickers** وخصصها.
4. اختياري: أضف موسيقى من قسم **Music**.
5. اضغط **Share to story**.

اختصارات داخل المحرر: **Del** يحذف الملصق المختار، و**Ctrl+D** ينسخه، و**الأسهم** تحركه (مع Shift تتحرك خطوات أكبر)، و**Esc** يغلق النافذة.

### الحدود

- الفيديو حتى 60 ثانية.
- ملصق رابط واحد لكل ستوري.
- الفيديوهات التي فيها ملصقات أو خلفية خاصة أو موسيقى تُعاد معالجتها في الوقت الحقيقي، لذا أبقِ التبويب مفتوحاً حتى تنتهي.
- مكتبة الموسيقى الخاصة بإنستغرام غير متاحة من الويب. ارفع ملف صوتي بدلها.

### بنية المشروع

```
manifest.json        ملف الإضافة (Manifest V3)
background.js        العامل الخلفي: قواعد الهيدرز والرفع
src/hook.js          يعمل داخل صفحة إنستغرام: يسجل هيدرز طلباتها
src/core.js          طلبات واجهة إنستغرام، والخطوط، والأنماط المحفوظة
src/stickers.js      أنواع الملصقات والرسم ومعلومات الستوري
src/music.js         بحث الموسيقى وتحميلها ومعاينتها
src/ui.js            نافذة المحرر
fonts/               خطوط بترخيص مفتوح (SIL OFL)
icons/               أيقونات الإضافة
```

### الخصوصية

كل شيء يعمل داخل متصفحك. تقرأ الإضافة كوكيز جلسة إنستغرام الموجودة فقط لتقوم بالطلبات باسمك، ولا ترسل أي شيء إلى خادم آخر.

---

## License

Not yet chosen. Until a license is added, all rights are reserved by the author.
