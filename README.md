# 🩺 Diagnofy — Your AI Health Companion

AI-powered health assistant covering 18 medical specialties.
Built with React + Vite, deployed on Netlify, powered by Claude AI.

---

## 🚀 Deploy to Netlify in 5 Steps

### Step 1 — Get your Anthropic API Key
1. Go to https://console.anthropic.com
2. Sign up (free, get $5 credits)
3. Click **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)

### Step 2 — Put the code on GitHub
1. Go to https://github.com → Sign up (free)
2. Click **New Repository** → name it `diagnofy` → Create
3. Upload all these files (drag & drop the folder)
4. Click **Commit changes**

### Step 3 — Connect to Netlify
1. Go to https://netlify.com → Sign up with GitHub
2. Click **Add new site** → **Import an existing project**
3. Choose **GitHub** → Select your `diagnofy` repo
4. Build settings (auto-detected):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click **Deploy site**

### Step 4 — Add your API Key (IMPORTANT)
1. In Netlify → Your site → **Site configuration**
2. Click **Environment variables** → **Add a variable**
3. Key: `ANTHROPIC_API_KEY`
4. Value: paste your `sk-ant-...` key
5. Click **Save** → then **Trigger deploy** → **Deploy site**

### Step 5 — Go live! 🎉
Your site is live at: `https://your-site-name.netlify.app`

---

## 🌐 Get a Custom Domain (Optional)
1. Buy domain at Namecheap.com (~₹800/year)
2. Netlify → Domain management → Add custom domain
3. Follow DNS instructions (takes ~10 minutes)

---

## 🎨 Rebrand in 30 Seconds
Edit the top 4 lines in `src/App.jsx`:
```js
const BRAND_NAME    = "Diagnofy";           // Your app name
const BRAND_TAGLINE = "Your AI Health Companion"; // Your tagline
const BRAND_ICON    = "🩺";                // Any emoji
const BRAND_COLOR   = "#7c3aed";           // Any hex color
```
Then push to GitHub — Netlify auto-deploys.

---

## 💰 How to Earn From This

| Method | Potential |
|--------|-----------|
| Google AdSense (free users) | ₹500–5,000/month |
| Premium subscription via Razorpay | ₹199–499/month per user |
| B2B — license to clinics | ₹5,000–50,000/month |
| Health affiliate links (1mg, PharmEasy) | ₹100–500 per referral |

---

## ⚠️ Legal Disclaimer
Always include the disclaimer that Diagnofy provides informational
guidance only and is not a substitute for professional medical care.
This is already built into the app.

---

## 📞 Support
Built by you. Powered by Anthropic Claude AI.
