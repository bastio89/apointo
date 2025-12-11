# Daylane Deployment Guide für Vercel

## Voraussetzungen

- GitHub Account
- Vercel Account (vercel.com)
- MongoDB Atlas Account (cloud.mongodb.com)
- Supabase Account (supabase.com)
- Stripe Account (stripe.com)
- Supabase CLI installiert: `brew install supabase/tap/supabase`

## 1. MongoDB Atlas Setup

1. Gehe zu https://cloud.mongodb.com
2. Erstelle neues Cluster oder nutze bestehendes
3. Erstelle Datenbank: `daylane_production`
4. Erstelle Database User mit Lese-/Schreibrechten
5. **Network Access**: `0.0.0.0/0` erlauben (für Vercel)
6. Kopiere Connection String

## 2. Supabase Setup

### 2.1 Projekt erstellen
1. Gehe zu https://supabase.com/dashboard
2. Erstelle neues Projekt (Region: EU)
3. Notiere Project Reference ID

### 2.2 Projekt lokal verbinden
```bash
cd "/pfad/zu/daylane"
supabase link --project-ref <DEINE_PROJECT_ID>
```

### 2.3 Migrationen ausführen
```bash
# Aktualisiere config.toml mit neuer project_id
# Dann:
supabase db push
```

### 2.4 Edge Functions deployen
```bash
supabase functions deploy customer-portal
supabase functions deploy check-subscription
supabase functions deploy create-checkout
supabase functions deploy create-appointment
supabase functions deploy signup-tenant
```

### 2.5 Secrets setzen
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_KEY
```

### 2.6 API Keys notieren
Aus Dashboard → Settings → API:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## 3. Vercel Deployment

### 3.1 GitHub Repository erstellen
```bash
cd "/pfad/zu/daylane"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

### 3.2 Backend auf Vercel deployen

1. Gehe zu https://vercel.com/new
2. Importiere GitHub Repository
3. **Root Directory**: `backend`
4. **Framework Preset**: Other
5. Setze Environment Variables:
   ```
   MONGO_URL=mongodb+srv://...
   DB_NAME=daylane_production
   JWT_SECRET=<generiere_mit: openssl rand -base64 32>
   STRIPE_API_KEY=sk_live_...
   CORS_ORIGINS=https://dein-frontend.vercel.app
   ```
6. Deploy

### 3.3 Frontend auf Vercel deployen

1. Neues Projekt in Vercel
2. Importiere dasselbe GitHub Repository
3. **Root Directory**: `frontend`
4. **Framework Preset**: Create React App
5. Setze Environment Variable:
   ```
   REACT_APP_BACKEND_URL=https://dein-backend.vercel.app
   ```
6. Deploy

## 4. Secrets generieren

### JWT Secret
```bash
openssl rand -base64 32
```

### Alle benötigten Credentials

**MongoDB:**
- MONGO_URL: `mongodb+srv://user:pass@cluster.mongodb.net/...`
- DB_NAME: `daylane_production`

**Supabase:**
- SUPABASE_URL: `https://xxx.supabase.co`
- SUPABASE_ANON_KEY: `eyJ...`
- SUPABASE_SERVICE_ROLE_KEY: `eyJ...`

**Stripe:**
- STRIPE_API_KEY: `sk_live_...` (oder `sk_test_...`)

**Auth:**
- JWT_SECRET: generiert mit openssl

## 5. Nach dem Deployment

### Testen
1. Backend API: `https://dein-backend.vercel.app/api/dashboard/overview`
2. Frontend: `https://dein-frontend.vercel.app`

### Domain verbinden (Optional)
1. Vercel Dashboard → Project → Settings → Domains
2. Füge Custom Domain hinzu
3. DNS Records aktualisieren

### CORS aktualisieren
Nachdem Frontend deployed ist, aktualisiere `CORS_ORIGINS` in Backend Environment Variables:
```
CORS_ORIGINS=https://deine-domain.com,https://dein-frontend.vercel.app
```

## 6. Deployment Updates

Bei Code-Änderungen:
```bash
git add .
git commit -m "Update xyz"
git push
```

Vercel deployed automatisch bei jedem Push zu `main`.

## Troubleshooting

**Backend startet nicht:**
- Prüfe Environment Variables in Vercel Dashboard
- Prüfe Vercel Logs: Dashboard → Deployments → Logs

**Frontend kann Backend nicht erreichen:**
- Prüfe REACT_APP_BACKEND_URL
- Prüfe CORS_ORIGINS im Backend

**Supabase Functions nicht erreichbar:**
- Prüfe ob Functions deployed sind: `supabase functions list`
- Prüfe Secrets: `supabase secrets list`

**MongoDB Connection failed:**
- Prüfe Network Access in MongoDB Atlas
- Prüfe Connection String Format
