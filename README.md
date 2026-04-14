# South Shore Sawyer — SouthShoreSawyer.com

Astro + Tailwind CSS site for the South Shore Sawyer brand.
Deploys to Cloudflare Pages. AI lumber advisor via Cloudflare Workers.

---

## Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Framework    | Astro 4                           |
| Styling      | Tailwind CSS                      |
| Hosting      | Cloudflare Pages (free)           |
| AI API       | Claude via Cloudflare Workers     |
| Email        | ConvertKit (wire up Newsletter component) |
| Payments     | Stripe (add when community launches) |

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Site runs at http://localhost:4321

---

## Deploy to Cloudflare Pages

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial South Shore Sawyer site"
git remote add origin https://github.com/MrPlympton/southshoresawyer
git push -u origin main
```

### 2. Connect to Cloudflare Pages

1. Log into Cloudflare Dashboard → Workers & Pages → Create
2. Connect GitHub → select `southshoresawyer` repo
3. Build settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output: `dist`
4. Save and deploy

### 3. Connect your domain

In Cloudflare Pages → Custom Domains → Add `southshoresawyer.com`
(Already on Cloudflare DNS — it will connect automatically.)

---

## Deploy the AI Log Advisor (Cloudflare Worker)

### 1. Install Wrangler

```bash
npm install -g wrangler
wrangler login
```

### 2. Create the Worker

```bash
cd workers
wrangler deploy log-advisor.js --name log-advisor
```

### 3. Add your Anthropic API key

```bash
wrangler secret put ANTHROPIC_API_KEY --name log-advisor
# Paste your key when prompted
```

### 4. Add a route in Cloudflare Dashboard

Workers & Pages → log-advisor → Triggers → Add Route:
`southshoresawyer.com/api/log-advisor*`

---

## Wire up ConvertKit (Email)

1. Create free ConvertKit account at convertkit.com
2. Create a Form → get the form ID
3. In `src/components/Newsletter.astro`, replace the `handleSubscribe` TODO with:

```javascript
const res = await fetch(`https://api.convertkit.com/v3/forms/YOUR_FORM_ID/subscribe`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ api_key: 'YOUR_PUBLIC_API_KEY', email }),
});
```

---

## Pages

| Route          | File                              | Purpose                    |
|----------------|-----------------------------------|----------------------------|
| `/`            | src/pages/index.astro             | Homepage + hero            |
| `/calculator`  | src/pages/calculator.astro        | Lumber calculator (free)   |
| `/blog`        | src/pages/blog/index.astro        | Field Notes listing        |
| `/species`     | src/pages/species.astro           | Species library            |
| `/community`   | src/pages/community.astro         | Membership/community page  |

---

## Adding Blog Posts

Create `.astro` or `.md` files in `src/pages/blog/`:

```
src/pages/blog/milling-white-oak.astro
src/pages/blog/air-drying-guide.md
```

For Markdown posts, use frontmatter:

```markdown
---
title: "How to Mill White Oak"
date: 2025-04-15
category: "Field Notes"
excerpt: "White oak is unforgiving..."
---

Your post content here...
```

---

## Brand Colors

| Name      | Hex       | Usage                        |
|-----------|-----------|------------------------------|
| Forest    | #1C2E1C   | Primary dark, nav background |
| Bark      | #3D2410   | Hover states, secondary dark |
| Amber     | #C8881A   | Brand accent, CTAs           |
| Amber Lt  | #E8A832   | Hover amber                  |
| Sawdust   | #F7F0E4   | Light surfaces               |
| Cream     | #FAF6EE   | Page background              |
| Steel     | #4A5568   | Body text, secondary         |

---

## Next Steps (Week 2+)

- [ ] Connect ConvertKit for newsletter signups
- [ ] Wire Cloudflare Worker with your Anthropic API key
- [ ] Add Stripe for community membership billing
- [ ] Write first 3 real blog posts
- [ ] Add OG images for social sharing
- [ ] Set up PostHog analytics (free tier)
- [ ] Add more species to the species library
- [ ] Create the first digital product (PDF guide)
