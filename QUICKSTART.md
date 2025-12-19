# Quick Start Guide

Get your AI Sales Agent up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

The database and edge function are already set up in your Supabase project. You just need to add the connection details.

Create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Find these values in your Supabase dashboard:
- Go to **Settings** → **API**
- Copy the **Project URL** and **anon key**

### 3. Run the App

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 4. Test It Out

1. Fill in the lead form with your name and email
2. Click "Start Chat"
3. Try these test messages:
   - "What's the pricing?" → Detects `pricing_inquiry`
   - "I want a demo" → Detects `demo_request`
   - "Tell me about features" → Detects `feature_inquiry`
   - "Can someone call me?" → Detects `follow_up`

Watch your lead score increase as you engage!

## Optional: Enable OpenAI

For better AI responses (optional):

1. Get an OpenAI API key from https://platform.openai.com/api-keys
2. In Supabase Dashboard: **Edge Functions** → **Secrets**
3. Add: `OPENAI_API_KEY` = `your_key`

**Note**: The system works great without OpenAI using rule-based responses!

## Verify Database Setup

Check your Supabase dashboard:

1. Go to **Table Editor**
2. You should see three tables:
   - `leads`
   - `conversations`
   - `lead_activities`

3. Go to **Edge Functions**
4. You should see the `chat` function deployed

If these are missing, they should already be set up. If not, check the README.md for full setup instructions.

## Common Issues

**"Missing Supabase environment variables"**
- Make sure `.env` file exists in the project root
- Verify the values are correct (no quotes needed)

**"CORS error"**
- This means the edge function isn't deployed or has issues
- The edge function should already be deployed in your project

**"No response from chat"**
- Check the browser console for errors
- Verify your Supabase project isn't paused (free tier auto-pauses after inactivity)

## Next Steps

- Read **README.md** for complete documentation
- Check **API_GUIDE.md** for API integration
- See **ARCHITECTURE.md** for technical details
- Review **DEPLOYMENT.md** for production deployment

## Project Structure

```
src/
├── components/        # React components
│   ├── LeadForm.tsx
│   ├── ChatInterface.tsx
│   ├── MessageBubble.tsx
│   └── LeadStats.tsx
├── lib/              # Utilities
│   └── supabase.ts
├── types/            # TypeScript types
│   └── index.ts
└── App.tsx           # Main app

supabase/functions/
└── chat/             # Edge function
    └── index.ts
```

## Testing Different Intents

| Message | Expected Intent | Lead Score Change |
|---------|----------------|-------------------|
| "How much does it cost?" | pricing_inquiry | +15 |
| "Show me a demo" | demo_request | +25 |
| "What features do you have?" | feature_inquiry | +10 |
| "Call me tomorrow" | follow_up | +20 |
| "Not interested" | not_interested | -30 |

## Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` folder.

## Deploy

**Easiest option - Vercel**:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts and add environment variables
```

See **DEPLOYMENT.md** for detailed deployment instructions for various platforms.

## Support

- Issues? Check the **README.md** troubleshooting section
- Questions? Review the comprehensive documentation
- Want to contribute? See **CONTRIBUTING.md** (if available)

## That's It!

You now have a fully functional AI Sales Agent running locally.

Start chatting and watch the lead scoring in action!

---

For complete documentation, see:
- **README.md** - Full project documentation
- **API_GUIDE.md** - API reference
- **ARCHITECTURE.md** - Technical details
- **DEPLOYMENT.md** - Production deployment
- **PROJECT_SUMMARY.md** - Project overview
