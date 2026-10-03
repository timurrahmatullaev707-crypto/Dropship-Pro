# VALMORA deploy qo'llanmasi

## Netlify — do'kon sayti

Netlify repodagi `netlify.toml` sozlamasidan foydalanadi. Build jarayoni faqat HTML, JavaScript va CSS fayllarini `dist/` ga chiqaradi; SQLite bazasi va Python backend saytga joylanmaydi.

## Render — backend

- Repository: shu loyiha.
- Start command: `python valmora_server.py`
- `VALMORA_ADMIN_TOKEN`: uzun, tasodifiy sirli kalit. Uni Render Environment bo'limida saqlang; repoga yoki chatga yozmang. Admin API birinchi kirishda shu kalitni so'raydi.
- Doimiy disk ulang va mount yo'lini, masalan `/var/data`, belgilang.
- `VALMORA_DB_PATH=/var/data/valmora.db` environment qiymatini qo'shing. Doimiy disksiz buyurtmalar va sozlamalar deploy/restartdan keyin yo'qolishi mumkin.

Render `PORT` qiymatini o'zi beradi. Lokal ishga tushirishda backend `8080` portidan foydalanadi.

Telegram xabarnomasi admin sozlamalarida bot tokeni va chat ID saqlangandan keyin ishlaydi. Hozir buyurtmalar eshik oldida to'lash usulida qabul qilinadi; Click/Payme merchant integratsiyasi ulanmagan.
