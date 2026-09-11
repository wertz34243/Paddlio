# Paddlio Supabase Auth-E-Mail-Templates

Diese Templates sind fuer `paddlio-dev` im Supabase Dashboard unter **Authentication -> Email Templates** einzutragen. Die Links bleiben Supabase-sicher ueber `{{ .ConfirmationURL }}`; Redirect-URLs werden in Supabase ueber die erlaubten Site-/Redirect-URLs gepflegt (`https://dev.paddlio.de`, spaeter `https://app.paddlio.de`).

## E-Mail-Adresse Bestaetigen

Subject:

```text
Paddlio – E-Mail-Adresse bestätigen
```

HTML:

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Paddlio – E-Mail-Adresse bestätigen</title>
  </head>
  <body style="margin:0;background:#071019;color:#eef7fb;font-family:Inter,Segoe UI,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#071019;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#101927;border:1px solid rgba(54,211,238,.22);border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:30px 28px 10px;">
                <div style="font-size:26px;font-weight:800;letter-spacing:.2px;color:#ffffff;">Paddlio</div>
                <div style="margin-top:6px;color:#36d3ee;font-size:13px;font-weight:700;">Train. Analyze. Improve.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 8px;">
                <h1 style="margin:0 0 14px;font-size:24px;line-height:1.2;color:#ffffff;">Willkommen bei Paddlio.</h1>
                <p style="margin:0;color:#c8d3df;font-size:16px;line-height:1.55;">Bitte bestätige deine E-Mail-Adresse, damit du dein Konto verwenden kannst.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#36d3ee;color:#061019;text-decoration:none;font-weight:800;font-size:16px;padding:14px 22px;border-radius:999px;">E-Mail-Adresse bestätigen</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <p style="margin:0;color:#9aa8b6;font-size:14px;line-height:1.5;">Falls du dich nicht bei Paddlio registriert hast, kannst du diese E-Mail ignorieren.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;background:#0b1420;color:#8ea0af;font-size:13px;line-height:1.5;">
                <strong style="color:#eef7fb;">Paddlio</strong><br />
                Train. Analyze. Improve.<br />
                paddlio.de
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Passwort Zuruecksetzen

Subject:

```text
Paddlio – Passwort zurücksetzen
```

HTML:

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Paddlio – Passwort zurücksetzen</title>
  </head>
  <body style="margin:0;background:#071019;color:#eef7fb;font-family:Inter,Segoe UI,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#071019;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#101927;border:1px solid rgba(54,211,238,.22);border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:30px 28px 10px;">
                <div style="font-size:26px;font-weight:800;letter-spacing:.2px;color:#ffffff;">Paddlio</div>
                <div style="margin-top:6px;color:#36d3ee;font-size:13px;font-weight:700;">Train. Analyze. Improve.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 8px;">
                <h1 style="margin:0 0 14px;font-size:24px;line-height:1.2;color:#ffffff;">Passwort zurücksetzen</h1>
                <p style="margin:0;color:#c8d3df;font-size:16px;line-height:1.55;">Du hast angefordert, dein Passwort für dein Paddlio-Konto zurückzusetzen.</p>
                <p style="margin:12px 0 0;color:#c8d3df;font-size:16px;line-height:1.55;">Klicke auf den Button unten und lege anschließend ein neues Passwort fest.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#36d3ee;color:#061019;text-decoration:none;font-weight:800;font-size:16px;padding:14px 22px;border-radius:999px;">Neues Passwort festlegen</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <p style="margin:0;color:#9aa8b6;font-size:14px;line-height:1.5;">Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail einfach ignorieren.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;background:#0b1420;color:#8ea0af;font-size:13px;line-height:1.5;">
                <strong style="color:#eef7fb;">Paddlio</strong><br />
                Train. Analyze. Improve.<br />
                paddlio.de
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Optional Genutzte Auth-Mails

Falls Magic Link, Einladung oder E-Mail-Aenderung in Supabase aktiviert werden, sollte derselbe Wrapper verwendet werden. Die CTA-URL bleibt jeweils `{{ .ConfirmationURL }}`.

- Magic Link Subject: `Paddlio – Anmelden`
- Einladung Subject: `Paddlio – Einladung annehmen`
- E-Mail-Änderung Subject: `Paddlio – Neue E-Mail-Adresse bestätigen`

Sicherheitsnotiz: Keine Secrets in Mail-Templates eintragen. Keine statischen localhost- oder Vercel-Links in die Templates schreiben; erlaubte Redirects gehoeren in die Supabase Auth URL-Konfiguration.
