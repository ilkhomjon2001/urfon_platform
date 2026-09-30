# URFON landing (urfon-edu.uz)

Markazning ommaviy sayti va ariza (lid) qabul qiluvchi kichik server. Serverda `/opt/urfon` papkasida,
`urfon-landing.service` (systemd) sifatida, 4601-portda ishlaydi; tashqariga coach Caddy orqali chiqadi.
Platformadan (app.urfon-edu.uz) mustaqil — bu yerdagi fayllar shu papkaning nusxasi, tahrir shu yerda qilinadi.

## Fayllar

| Fayl | Nima |
|---|---|
| `urfon_landing.html` | Butun sayt — bitta HTML (CSS ichida). `<head>` da SEO bloki: canonical, Open Graph, JSON-LD. |
| `server.js` | Node (bogʻliqliksiz): sahifa, `/api/lead`, `robots.txt`, `sitemap.xml`, `/static/*`, kesh va 404. |
| `static/` | Ikonkalar, `og-image.jpg`, `site.webmanifest`, Manrope shrifti (oʻz serverimizda). |
| `deploy.sh` | Serverga birinchi marta oʻrnatish (Node, foydalanuvchi, systemd). Odatda kerak emas. |

## SEO qoidalari

- Sayt **bitta sahifa**: `sitemap.xml` da ham bitta `loc` — `https://urfon-edu.uz/`.
- `<head>` dagi SEO bloki `<!-- SEO: boshi -->` va `<!-- SEO: oxiri -->` orasida. JSON-LD ichida
  markaz (EducationalOrganization + LocalBusiness), kurs (Course), sayt (WebSite) va savol-javoblar (FAQPage).
- **FAQ JSON-LD sahifadagi matn bilan bir xil boʻlishi shart** — savol yoki javob oʻzgarsa, JSON-LD ham yangilanadi,
  aks holda Google strukturali maʼlumotni rad etadi.
- Shrift Google Fonts dan emas, `/static/fonts/` dan yuklanadi (tashqi soʻrov yoʻq, sahifa tezroq ochiladi).
- Kabinet (app.urfon-edu.uz) `noindex` — `web/public/robots.txt` va `web/index.html` dagi meta orqali.

## Yangilash

```bash
TS=$(date +%Y%m%d-%H%M%S)
ssh -i ~/.ssh/tarbion_server root@169.58.130.201 \
  "cd /opt/urfon && cp urfon_landing.html urfon_landing.html.bak-$TS && cp server.js server.js.bak-$TS"
scp -i ~/.ssh/tarbion_server server.js urfon_landing.html root@169.58.130.201:/opt/urfon/
scp -i ~/.ssh/tarbion_server -r static root@169.58.130.201:/opt/urfon/
ssh -i ~/.ssh/tarbion_server root@169.58.130.201 \
  "chown -R urfon:urfon /opt/urfon/server.js /opt/urfon/urfon_landing.html /opt/urfon/static && systemctl restart urfon-landing"
```

HTML server ishga tushganda xotiraga oʻqiladi — tahrirdan keyin **servisni qayta ishga tushirish shart**.

## Tekshirish

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://urfon-edu.uz/{,robots.txt,sitemap.xml,favicon.ico}
curl -s https://urfon-edu.uz/ | grep -c "application/ld+json"
```

Qidiruv tizimlarida: Google Search Console va Yandex Webmaster ga saytni qoʻshib, `sitemap.xml` ni yuborish kerak
(tasdiqlash uchun meta tegi yoki DNS TXT yozuvi markaz egasidan olinadi).
