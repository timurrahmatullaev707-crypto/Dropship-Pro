# VALMORA deploy qo'llanmasi

## Netlify — do'kon sayti

Netlify repodagi `netlify.toml` sozlamasidan foydalanadi. Build jarayoni faqat HTML, JavaScript va CSS fayllarini `dist/` ga chiqaradi; SQLite bazasi va Python backend saytga joylanmaydi.

## Render — backend

- Repository: shu loyiha.
- Start command: `python valmora_server.py`
- `VALMORA_ADMIN_TOKEN`: uzun, tasodifiy sirli kalit. Uni Render Environment bo'limida saqlang; repoga yoki chatga yozmang. Admin API birinchi so'rovida kalit so'raladi va faqat joriy brauzer sessiyasida saqlanadi. Boshqaruv panelidagi **Chiqish** tugmasi sessiya kalitini o'chiradi.
- Doimiy disk ulang va mount yo'lini, masalan `/var/data`, belgilang.
- `VALMORA_DB_PATH=/var/data/valmora.db` environment qiymatini qo'shing. Doimiy disksiz buyurtmalar va sozlamalar deploy/restartdan keyin yo'qolishi mumkin.
- Mijoz tracking kod orqali faqat buyurtma raqami va holatini ko'ruvchi `GET /api/tracking?code=...` endpointidan foydalanadi.

Render `PORT` qiymatini o'zi beradi. Lokal ishga tushirishda backend `8080` portidan foydalanadi.

Telegram xabarnomasi admin sozlamalarida bot tokeni va chat ID saqlangandan keyin ishlaydi. Hozir buyurtmalar eshik oldida to'lash usulida qabul qilinadi; Click/Payme merchant integratsiyasi ulanmagan.

## Git va maxfiy ma'lumotlar

`.env` fayllari, virtual muhit, Python bytecode va lokal SQLite fayllari `.gitignore` orqali yangi commitlardan chiqariladi. Repository'da oldin kuzatilgan `valmora.db` faylining mahalliy nusxasi saqlanadi, ammo Git indeksidan chiqarilgan. Bu o'zgarish Git tarixidagi oldingi nusxalarni o'chirmaydi; repository ilgari GitHub'ga yuborilgan bo'lsa, tarixdagi mijoz ma'lumotlarini alohida tekshirish va tarixni tozalash zarur.
