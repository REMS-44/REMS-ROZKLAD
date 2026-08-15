# РЕМС-РОЗКЛАД v0.9.1 — Firebase підключено

У цій збірці вже записана клієнтська конфігурація Firebase-проєкту `rems-rozklad-2026-2027`.

## Що ще треба увімкнути у Firebase Console
1. Authentication → Sign-in method → Email/Password → Enable.
2. Authentication → Users → створити першого користувача.
3. Firestore Database → Create database.
4. У Firestore → Rules вставити вміст `firestore.rules` і натиснути Publish.
5. Для GitHub Pages додати домен сайту до Authentication → Settings → Authorized domains, якщо Firebase його не додав автоматично.

## Перший запуск
Перший користувач, який увійде у ще порожню спільну базу, автоматично стане адміністратором РЕМС-Розкладу.
Після входу локальні дані цього браузера будуть перенесені в Firestore як початкова спільна база.

## Файли для GitHub Pages
Замінити всі файли збірки, включно з:
- `index.html`
- `styles.css`
- `app.js`
- `data.js`
- `firebase-config.js`
- `cloud.js`

Файл `firestore.rules` не потрібен сайту — його вміст треба вставити у вкладку Rules у Firestore Console.
