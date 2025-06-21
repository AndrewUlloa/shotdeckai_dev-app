# 🌍 Colombian Spanish Localization Testing Guide

## Overview

This guide helps you test the Colombian Spanish (es-CO) localization to ensure it's working correctly for visitors from Colombia.

## 🧪 Testing Methods

### 1. Local Development Testing

#### Method A: Browser Cookie Manipulation

1. Open your site in the browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Run these commands:

```javascript
// Check current locale
console.log(
  "Current locale:",
  document.cookie
    .split("; ")
    .find((row) => row.startsWith("locale="))
    ?.split("=")[1] || "not set"
);

// Set to Colombian Spanish
document.cookie = "locale=es-CO; path=/; max-age=31536000";
location.reload(); // Refresh to see changes

// Set back to English
document.cookie = "locale=en; path=/; max-age=31536000";
location.reload();
```

#### Method B: Modify Headers with Browser Extension

1. Install a browser extension like "ModHeader" (Chrome/Firefox)
2. Add custom header: `cf-ipcountry: CO`
3. Clear cookies and refresh the page
4. You should see Spanish content automatically

### 2. VPN Testing

1. Use a VPN service and connect to a Colombian server
2. Clear your browser cookies
3. Visit your site
4. You should automatically see Spanish content

### 3. Manual Content Verification

#### What to Check:

**English Version:**

- Hero Title: "Your Creative Vision, Realized Instantly—With AI That Feels Like Magic."
- Input Placeholder: "My story looks and feels like..."
- Button: "Get your invitation" / "Get invited" (mobile)
- Modal Title: "Get Early Access"
- Modal Subtitle: "Sign up to be notified when we launch!"
- Email Placeholder: "Enter your email"
- Footer: "built with ❤️ in Bogotá"

**Spanish Version (es-CO):**

- Hero Title: "Tu Visión Creativa, Realizada Instantáneamente—Con IA Que Se Siente Como Magia."
- Input Placeholder: "Mi historia se ve y se siente como..."
- Button: "Obtén tu invitación" / "Obtén invitación" (mobile)
- Modal Title: "Acceso Anticipado"
- Modal Subtitle: "¡Regístrate para ser notificado cuando lancemos!"
- Email Placeholder: "Ingresa tu correo electrónico"
- Footer: "hecho con ❤️ en Bogotá"

### 4. Automated Testing Script

Run this in your browser console to check all translations at once:

```javascript
// Comprehensive locale test
function testLocalization() {
  const tests = {
    "Current Locale":
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("locale="))
        ?.split("=")[1] || "not set",
    "HTML Lang": document.documentElement.lang,
    "Hero Title":
      document.querySelector("h1")?.textContent?.trim().substring(0, 30) +
      "...",
    "Input Placeholder": document.querySelector("textarea")?.placeholder,
    "Button Text": Array.from(document.querySelectorAll("button"))
      .find((btn) => btn.textContent?.includes("invit"))
      ?.textContent?.trim(),
    "Footer Text": Array.from(document.querySelectorAll("footer div"))
      .find((el) => el.textContent?.includes("Bogotá"))
      ?.textContent?.trim(),
  };

  console.table(tests);

  // Check if Spanish
  const isSpanish = tests["Input Placeholder"]?.includes("Mi historia");
  console.log(
    isSpanish ? "✅ Spanish locale detected" : "🇬🇧 English locale detected"
  );
}

testLocalization();
```

### 5. Production Testing

#### Using cURL to Test Headers:

```bash
# Test with Colombian IP header
curl -H "cf-ipcountry: CO" -I https://your-site.com

# Check the Set-Cookie header in response
# Should see: Set-Cookie: locale=es-CO
```

#### Using Online Tools:

1. Use services like [GeoPeeker](https://geopeeker.com) to view your site from different locations
2. Select a Colombian location
3. Verify Spanish content is displayed

### 6. Cloudflare Testing

Since you're using Cloudflare Pages:

1. **Check Cloudflare Analytics:**

   - Go to Cloudflare Dashboard → Analytics
   - Check visitor countries
   - Colombian visitors should have longer session times if seeing native language

2. **Use Cloudflare Workers Playground:**

   ```javascript
   // Test middleware logic
   addEventListener("fetch", (event) => {
     const request = event.request;
     const country = request.headers.get("cf-ipcountry");

     event.respondWith(
       new Response(`Country: ${country}`, {
         headers: { "content-type": "text/plain" },
       })
     );
   });
   ```

### 7. Debug Checklist

- [ ] Middleware file exists at `/middleware.ts`
- [ ] Translation files exist in `/lib/translations/`
- [ ] Layout wraps app with `TranslationProvider`
- [ ] Components use `useTranslations()` hook
- [ ] Cookies are being set (check DevTools → Application → Cookies)
- [ ] HTML lang attribute changes with locale
- [ ] All text content switches between English/Spanish

### 8. Quick Test URLs

After deployment, test these scenarios:

1. **Direct Access from Colombia:** Share link with someone in Colombia
2. **Cookie Override:** `your-site.com?test=es-CO` (if you add this feature)
3. **Different Browsers:** Test in Chrome, Firefox, Safari to ensure consistency

## 🚨 Common Issues & Solutions

**Issue:** Always seeing English

- **Solution:** Clear cookies, check if middleware is running

**Issue:** Locale cookie not being set

- **Solution:** Check middleware matcher config, ensure it's not excluding your routes

**Issue:** Translations not updating

- **Solution:** Hard refresh (Ctrl+F5), clear cache

**Issue:** Mixed languages showing

- **Solution:** Check all components are using translations consistently

## 📊 Success Metrics

Your localization is working if:

- ✅ Colombian IP addresses automatically see Spanish
- ✅ Locale preference persists across sessions
- ✅ No mixed language content
- ✅ Page loads without flashing English first
- ✅ All interactive elements are translated
