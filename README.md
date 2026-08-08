# 🏡 Neighborly Trust — Production Hyperlocal Services Marketplace

**Neighborly Trust** connects rural customers with nearby verified service providers (electricians, plumbers, carpenters, home cleaners).

Built with **Next.js 14+ (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase (Postgres, Auth, RLS, Storage, Realtime)**, **Leaflet OpenStreetMap**, and **HTML5 GPS WatchPosition**.

---

## 🚀 Correct Deployment Sequencing & Prerequisites

Because Next.js bakes `NEXT_PUBLIC_*` environment variables into the static bundle during `npm run build`, you **MUST** configure Supabase and GitHub Action Secrets BEFORE pushing your repository for deployment.

### 1️⃣ Step 1: Create Supabase Backend First
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Open **SQL Editor** in your Supabase dashboard.
3. Copy the contents of **`supabase/schema.sql`**, paste it into the SQL editor, and click **Run**.
4. Go to **Project Settings** -> **API**, and copy:
   - `Project URL`
   - `anon public key`

### 2️⃣ Step 2: Create GitHub Repo & Add Secrets
1. Go to GitHub and create a **new empty repository** (do NOT initialize with README or .gitignore).
2. In your GitHub repository, go to **Settings** -> **Secrets and variables** -> **Actions**.
3. Click **New repository secret** and add:
   - Secret Name: `NEXT_PUBLIC_SUPABASE_URL` | Value: *(Your Supabase URL)*
   - Secret Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Value: *(Your Supabase Anon Key)*

### 3️⃣ Step 3: Push Code & Enable GitHub Pages
Run in PowerShell:
```powershell
cd C:\Users\DELL\.gemini\antigravity-ide\scratch\neighborly-trust
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/neighborly-trust.git
git push -u origin main
```
*Note: If GitHub prompts for a password, use a Personal Access Token (PAT) with `repo` scope generated under GitHub Settings -> Developer settings -> Personal access tokens.*

4. Go to GitHub Repo -> **Settings** -> **Pages** -> Under **Source**, select **GitHub Actions**.

GitHub Actions will automatically build your static site with baked Supabase credentials and deploy it to GitHub Pages!

---

## 🧪 Running Local Automated Tests
```bash
npm run test
```

---

## 🛡️ License & Copyright
© 2026 Neighborly Trust Inc. All rights reserved.
