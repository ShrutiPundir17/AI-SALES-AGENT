# Deployment Guide

Complete guide for deploying the AI Sales Agent to production.

## Prerequisites

Before deployment, ensure you have:

- [x] Supabase account (free tier works)
- [x] Node.js 18+ installed locally
- [x] Git repository set up
- [ ] OpenAI API key (optional, but recommended)
- [ ] Custom domain (optional)

## Deployment Steps

### Step 1: Supabase Project Setup

Your Supabase project is already configured with:
- Database tables (leads, conversations, lead_activities)
- Edge function (chat)
- Row Level Security policies

No additional Supabase setup is needed!

### Step 2: Environment Variables Setup

#### For Local Development

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

You can find these values in your Supabase dashboard:
1. Go to **Settings** → **API**
2. Copy **Project URL** → Use as `VITE_SUPABASE_URL`
3. Copy **anon/public key** → Use as `VITE_SUPABASE_ANON_KEY`

#### For Edge Function (OpenAI - Optional)

If you want to use OpenAI for better responses:

1. Get your OpenAI API key from https://platform.openai.com/api-keys
2. In Supabase Dashboard, go to **Edge Functions** → **Secrets**
3. Add secret:
   - Key: `OPENAI_API_KEY`
   - Value: `your_openai_api_key`

**Note**: The system works perfectly without OpenAI using rule-based responses!

### Step 3: Deploy Frontend

You have multiple options for deploying the frontend:

#### Option A: Vercel (Recommended)

**One-Click Deploy**:

1. Push your code to GitHub
2. Go to https://vercel.com
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
6. Click "Deploy"

**Vercel CLI**:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

#### Option B: Netlify

**One-Click Deploy**:

1. Push your code to GitHub
2. Go to https://netlify.com
3. Click "Add new site" → "Import an existing project"
4. Connect to GitHub and select your repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
7. Click "Deploy site"

**Netlify CLI**:

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

#### Option C: Supabase Hosting

Supabase has built-in hosting via **Storage + Functions**:

```bash
# Build the project
npm run build

# Upload to Supabase Storage
# (Create a public bucket named 'website')
# Upload contents of 'dist' folder

# Access via: https://your-project.supabase.co/storage/v1/object/public/website/index.html
```

#### Option D: Custom Server (VPS/Cloud)

**Using nginx**:

```bash
# Build the project
npm run build

# Copy dist folder to server
scp -r dist/* user@your-server:/var/www/ai-sales-agent/

# Configure nginx
sudo nano /etc/nginx/sites-available/ai-sales-agent
```

nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/ai-sales-agent;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site and restart nginx
sudo ln -s /etc/nginx/sites-available/ai-sales-agent /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 4: Configure Custom Domain (Optional)

#### For Vercel:

1. Go to your project dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed

#### For Netlify:

1. Go to "Site settings" → "Domain management"
2. Click "Add custom domain"
3. Follow DNS configuration instructions

### Step 5: Enable HTTPS

All hosting providers (Vercel, Netlify, Supabase) automatically provide free SSL certificates via Let's Encrypt.

For custom servers:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

### Step 6: Verify Deployment

After deployment, verify everything works:

1. **Frontend loads**: Visit your deployed URL
2. **Form submission**: Fill out lead form and submit
3. **Chat works**: Send a test message
4. **Intent detection**: Try different intents:
   - "What's the pricing?" (pricing_inquiry)
   - "I want a demo" (demo_request)
   - "Tell me about features" (feature_inquiry)
5. **Lead scoring**: Check if score updates
6. **Database**: Verify data in Supabase dashboard

### Step 7: Monitor and Maintain

#### Monitoring

**Supabase Dashboard**:
- Database usage: **Settings** → **Usage**
- Edge function logs: **Edge Functions** → **Logs**
- API usage: **Settings** → **API** → **Logs**

**Frontend Monitoring**:
- Vercel Analytics (if using Vercel)
- Google Analytics (add to index.html)
- Sentry for error tracking

#### Maintenance Tasks

**Weekly**:
- Check error logs
- Monitor lead conversion rates
- Review intent detection accuracy

**Monthly**:
- Update dependencies: `npm update`
- Review and optimize database queries
- Check OpenAI usage and costs

**Quarterly**:
- Security audit
- Performance optimization
- Feature updates

## Production Configuration

### Security Hardening

1. **Enable RLS for Production**:

```sql
-- Update policies to require authentication
DROP POLICY IF EXISTS "Allow public read access to leads" ON leads;

CREATE POLICY "Authenticated users read own leads" ON leads
  FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id);

-- Repeat for all tables
```

2. **Rate Limiting**:

Add to edge function:
```typescript
// Simple rate limiting
const rateLimitKey = `rate_limit:${lead_id}`;
const requestCount = await redis.incr(rateLimitKey);

if (requestCount === 1) {
  await redis.expire(rateLimitKey, 60); // 1 minute window
}

if (requestCount > 10) {
  return new Response(
    JSON.stringify({ error: 'Rate limit exceeded' }),
    { status: 429 }
  );
}
```

3. **Input Validation**:

Add to edge function:
```typescript
// Sanitize input
const sanitizedMessage = message
  .trim()
  .substring(0, 1000) // Max 1000 characters
  .replace(/[<>]/g, ''); // Remove HTML tags

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(lead_info.email)) {
  return new Response(
    JSON.stringify({ error: 'Invalid email format' }),
    { status: 400 }
  );
}
```

### Performance Optimization

1. **Enable CDN**:
   - Vercel/Netlify provide this automatically
   - For custom servers, use Cloudflare

2. **Database Optimization**:

```sql
-- Add database indexes (already done in migration)
-- Monitor slow queries
SELECT * FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Create materialized views for analytics
CREATE MATERIALIZED VIEW lead_summary AS
SELECT
  lead_status,
  COUNT(*) as count,
  AVG(lead_score) as avg_score
FROM leads
GROUP BY lead_status;

-- Refresh periodically
REFRESH MATERIALIZED VIEW lead_summary;
```

3. **Frontend Optimization**:

```json
// package.json - Add optimization scripts
{
  "scripts": {
    "build": "vite build",
    "build:analyze": "vite build --mode analyze",
    "preview": "vite preview"
  }
}
```

### Backup Strategy

**Database Backups**:
- Supabase provides automatic daily backups
- For critical data, set up additional backups:

```bash
# Manual backup
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -f backup_$(date +%Y%m%d).sql
```

**Code Backups**:
- Use Git for version control
- Keep multiple branches: `main`, `staging`, `development`
- Tag releases: `git tag v1.0.0`

## Scaling Guidelines

### When to Scale

Monitor these metrics:
- **Response time** > 3 seconds
- **Database connections** > 80% of limit
- **Edge function errors** > 1%
- **User complaints** about speed

### Scaling Options

**1. Vertical Scaling**:
- Upgrade Supabase plan (more database resources)
- Use faster database instances

**2. Horizontal Scaling**:
```sql
-- Add read replicas
-- Configure in Supabase dashboard

-- Update application to use read replica for queries
const { data } = await supabase
  .from('conversations')
  .select('*')
  .eq('lead_id', leadId);
  // Automatically uses read replica if configured
```

**3. Caching Layer**:
```typescript
// Add Redis caching
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Cache lead data
const cachedLead = await redis.get(`lead:${leadId}`);
if (cachedLead) {
  return cachedLead;
}

const lead = await fetchLeadFromDatabase(leadId);
await redis.set(`lead:${leadId}`, lead, { ex: 300 }); // 5 min cache
```

## Troubleshooting

### Common Issues

**Issue 1: CORS Errors**
```
Error: CORS policy blocked
```
**Solution**: Verify edge function has correct CORS headers:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};
```

**Issue 2: Environment Variables Not Loading**
```
Error: Missing Supabase environment variables
```
**Solution**:
- Rebuild after adding env vars
- Verify env var names start with `VITE_`
- Check `.env` file is in project root

**Issue 3: Database Connection Issues**
```
Error: Connection timeout
```
**Solution**:
- Check Supabase project is not paused (free tier auto-pauses)
- Verify connection pooling settings
- Check network/firewall rules

**Issue 4: High OpenAI Costs**
**Solution**:
- Set usage limits in OpenAI dashboard
- Implement request caching
- Use rule-based fallback more aggressively
- Switch to smaller model (gpt-3.5-turbo)

## Cost Estimation

### Free Tier (Development)

**Supabase Free**:
- Database: 500MB
- Edge Functions: 500K requests/month
- Bandwidth: 2GB/month
- **Cost**: $0

**Vercel Free**:
- 100GB bandwidth/month
- Unlimited sites
- **Cost**: $0

**Total**: **$0/month** for development and small-scale production

### Paid Tier (Production)

**Supabase Pro ($25/month)**:
- Database: 8GB
- Edge Functions: 2M requests/month
- Bandwidth: 50GB/month

**OpenAI (~$10-50/month)**:
- GPT-4-mini: $0.15/1M input tokens
- Estimated 10K-50K requests/month
- Average 200 tokens per request
- Cost: $3-15/month

**Vercel Pro ($20/month)** (optional):
- 1TB bandwidth
- Analytics
- Advanced features

**Total**: **$35-95/month** for production with moderate traffic

### Enterprise (High Traffic)

**Supabase Enterprise (Contact for pricing)**:
- Unlimited database
- Dedicated resources
- SLA guarantees

**Expected costs**: **$500-2000/month** for 100K+ users

## CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Pre-deployment Checklist

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] Tests passing
- [ ] Build successful
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Stakeholders notified

## Post-Deployment

### Health Checks

Create a simple health check endpoint:

```typescript
// supabase/functions/health/index.ts
Deno.serve(async () => {
  const checks = {
    database: await checkDatabase(),
    openai: await checkOpenAI(),
    timestamp: new Date().toISOString(),
  };

  const healthy = Object.values(checks).every(c => c !== false);

  return new Response(
    JSON.stringify({ healthy, checks }),
    {
      status: healthy ? 200 : 503,
      headers: { 'Content-Type': 'application/json' },
    }
  );
});
```

### Monitoring Alerts

Set up alerts for:
- Error rate > 1%
- Response time > 3s
- Database CPU > 80%
- Failed deployments

## Support & Maintenance

For ongoing support:
1. Monitor error logs daily
2. Review user feedback weekly
3. Update dependencies monthly
4. Security patches immediately

## Conclusion

Your AI Sales Agent is now production-ready! Follow this guide for a smooth deployment and reliable operation.

For questions or issues, refer to:
- README.md for general setup
- ARCHITECTURE.md for technical details
- API_GUIDE.md for API documentation

Happy deploying!
