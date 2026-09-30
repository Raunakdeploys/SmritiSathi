# SmritiSaathi – Layer 9: Hosting & Cloud Strategy

## 1. Production Topology
SmritiSaathi is containerized and deployable to any standard modern cloud provider:
- **Primary Hosting**: Port 3000 Web Service (Google Cloud Run / Render / AWS ECS / Vercel).
- **Regions**: `asia-south1` (Mumbai) / `asia-southeast1` (Singapore) for sub-50ms latency to users across India and Asia.
- **SSL / TLS**: Automated Let's Encrypt HTTPS with HSTS headers enabled.
- **Reverse Proxy**: Cloudflare / Fastly CDN terminating SSL, caching static assets, and providing DDoS protection.

## 2. Infrastructure Cost Breakdown

| Component | Launch Stage (1k users) | 10x Scale (10k users) | Provider |
| :--- | :--- | :--- | :--- |
| **Frontend & API Compute** | $7/month (Starter Node) | $25 - $40/month (Autoscaled instances) | Cloud Run / Render |
| **Firestore Database** | $0/month (Free Tier) | $25/month | Google Cloud Firestore |
| **Object / Photo Storage** | $0.50/month | $5/month | Cloud Storage / R2 |
| **Gemini AI Grounding** | $5 - $10/month | $30 - $60/month | Google AI Studio / Vertex |
| **WhatsApp Emergency Gateway** | $0 (1k free service msgs) | $20/month | Meta Cloud API |
| **Total Estimated Cost** | **~$15/month** | **~$120/month** | High Margin SaaS |

## 3. Environment Variable Integrity
- Zero secrets committed to git.
- Full inventory maintained in `.env.example`.
- Production startup fails loudly if any required environment variable is missing or malformed.
