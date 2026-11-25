# Backend setup (Supabase and Resend), for Jose

Written 2026-11-25 for Phase 2. Do these in order; each step is a few clicks. Menu
names in the Supabase dashboard move now and then: if one doesn't match, tell Claude. Nothing
here goes in the repo or in a chat except where it says so. Prices were checked
2026-11-25 (supabase.com/pricing, resend.com/pricing).

## 1. Supabase account and two projects (free)

1. Sign up at supabase.com.
2. Make two projects in the same region (pick the one closest to most members):
   - `cgs-test`: for testing with made-up accounts.
   - `cgs-live`: the real one.
   The free plan allows two active projects. If you already have a free Supabase
   project for another app, tell Claude: we'll use one project instead.
3. Save each project's database password in your password manager. Claude never needs it.

## 2. Load the database rules (each project)

In each project: SQL Editor, New query, paste the whole of
`supabase/migrations/0001_phase2.sql` from the repo, Run. It should say "Success. No
rows returned".

## 3. Sign-in settings (each project)

Authentication, URL Configuration:

```
Site URL:       https://jvtomax99.github.io/Curly-girl-Sanctuary-/
Redirect URLs:  https://jvtomax99.github.io/Curly-girl-Sanctuary-/**
```

Authentication, Sign In / Providers, Email:
- `cgs-test`: turn **Confirm email** off (made-up test accounts can't receive email).
- `cgs-live`: leave **Confirm email** on.
- Both: minimum password length 8.

## 4. Email for `cgs-live` (Resend, free)

Supabase's own email only reaches the project's team, 2 messages an hour
(supabase.com/docs/guides/auth/auth-smtp), so real members need Resend (free: 3,000 emails a month, 100 a day).

1. Sign up at resend.com. Add a domain you own (Susan's, if she has one) and add the
   DNS records Resend shows you. Wait until it says Verified.
2. In Resend: API Keys, Create, "Sending access". Copy it once.
3. In `cgs-live`: Authentication, Email (under Notifications), SMTP Settings, turn on
   custom SMTP (values from resend.com/docs/send-with-supabase-smtp, checked 2026-11-25):

```
Sender email:  hello@YOUR_DOMAIN_HERE
Sender name:   Curly Girl Sanctuary
Host:          smtp.resend.com
Port:          465
Username:      resend
Password:      YOUR_VALUE_HERE   (the Resend API key; paste it only here)
```

4. Authentication, Rate Limits: emails per hour starts at 30; raise it when sign-ups open.

## 5. The two public settings for the app (GitHub)

In each Supabase project: Project Settings, API Keys. Copy the project URL and the
**publishable** key (it starts with `sb_publishable_`; older projects call it "anon
public"). Never copy the secret or service_role key anywhere.

In GitHub: the repo, Settings, Secrets and variables, Actions, **Variables** tab, New
repository variable, for the live project:

```
SUPABASE_URL          https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLIC_KEY   sb_publishable_YOUR_VALUE_HERE
```

These two are made to be public: the app needs them in the browser, and the database
rules decide what anyone can see. Leave `SIGNUPS_OPEN` unset until sign-ups open.

Then send Claude the `cgs-test` URL and publishable key in chat (both are public): it
runs the server check against the real test project with made-up members.

## 6. Make yourself the owner (after you join)

Join through the app (`#/preview`), then in `cgs-live`, SQL Editor:

```
insert into public.staff (member, role)
select id, 'owner' from public.profiles where username = 'YOUR_CURLY_USERNAME';
```

## Before sign-ups open to everyone

- Susan's privacy policy, terms and community guidelines replace the drafts.
- Minimum age decided (the app says 16 as a stand-in).
- Resend domain verified, and a real test sign-up received its email.
- Upgrade `cgs-live` to Pro (from $25 a month): daily backups, and it never pauses.
  Free projects pause after a week without activity.
- Consider giving the app its own domain: today it shares jvtomax99.github.io (and
  its browser storage) with Jose's other apps.
- Then add the repo variable `SIGNUPS_OPEN` = `true`.
