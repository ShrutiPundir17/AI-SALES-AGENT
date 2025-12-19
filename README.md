# AI Sales Agent

A sophisticated AI-powered sales agent that interacts with leads, understands their intent, and assists in converting them through intelligent conversations. Built with React, Supabase, and OpenAI.

## Features

- **Intelligent Chat Interface**: Modern, responsive chat UI with real-time messaging
- **Intent Detection**: Automatically classifies user intent into 5 categories:
  - Pricing Inquiry
  - Demo Request
  - Feature Inquiry
  - Follow-up/Call Request
  - Not Interested
- **Lead Scoring**: Dynamic scoring system (0-100) based on engagement and intent
- **Conversation Memory**: Maintains context using the last 5 messages per lead
- **AI Response Generation**: Uses OpenAI GPT-4 with fallback to rule-based responses
- **Real-time Lead Status**: Visual indicators (Hot, Warm, Cold) based on engagement
- **Next Action Suggestions**: Recommends optimal follow-up actions for sales reps

## Architecture

### Frontend (React + TypeScript + Tailwind CSS)
```
src/
├── components/
│   ├── LeadForm.tsx          # Lead information capture form
│   ├── ChatInterface.tsx     # Main chat UI component
│   ├── MessageBubble.tsx     # Individual message display
│   └── LeadStats.tsx         # Lead scoring visualization
├── lib/
│   └── supabase.ts           # Supabase client initialization
├── types/
│   └── index.ts              # TypeScript type definitions
├── App.tsx                   # Main application component
└── main.tsx                  # Application entry point
```

### Backend (Supabase Edge Functions)
```
supabase/functions/
└── chat/
    └── index.ts              # Main chat API endpoint
```

## AI & Intent Detection

### Intent Detection Strategy

The system uses a **hybrid approach**:

1. **Primary: OpenAI GPT-4** (when API key is available)
   - Uses GPT-4-mini for cost-effective intent classification
   - Analyzes conversation context and nuance
   - Provides confidence scores
   - Generates contextual responses

2. **Fallback: Rule-Based Detection**
   - Keyword matching algorithm
   - Pattern recognition for common phrases
   - Confidence scoring based on keyword matches
   - Predefined response templates


## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key (optional, falls back to rule-based)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-sales-agent
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 6. Build for Production

```bash
npm run build
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase Edge Functions (Deno runtime)
- **Database**: PostgreSQL (via Supabase)
- **AI/LLM**: OpenAI GPT-4-mini (with rule-based fallback)
- **Build Tool**: Vite
- **Icons**: Lucide React

## Project Structure Highlights

### Component Architecture
- **Modular Design**: Each component has a single responsibility
- **Type Safety**: Full TypeScript coverage with strict types
- **Reusability**: Components designed for reuse and extension

### State Management
- **Local State**: React useState for component-level state
- **No External Store**: Simple, maintainable state management
- **Real-time Updates**: Supabase realtime capabilities ready

### Styling Approach
- **Utility-First**: Tailwind CSS for rapid development
- **Custom Animations**: Smooth fade-in and transition effects
- **Responsive Design**: Mobile-first approach with breakpoints
- **Modern UI**: Gradient accents, rounded corners, shadows

## Bonus Features Implemented

- **Real-time Lead Scoring**: Dynamic score updates with visual feedback
- **Conversation Context**: Last 5 messages maintained for context-aware responses
- **Quick Actions**: Pre-defined questions for faster engagement
- **Visual Status Indicators**: Color-coded lead status (hot/warm/cold)
- **Engagement Metrics**: Message count and interaction tracking
- **Responsive Design**: Works seamlessly on mobile and desktop
- **Error Handling**: Graceful fallbacks for API failures

## Future Enhancements

- **Follow-up Suggestions**: Automated reminders after inactivity
- **Email Draft Generation**: Auto-generate personalized emails for sales reps
- **Tool Calling**: Calendar booking integration, CRM updates
- **Multi-language Support**: Internationalization for global reach
- **Analytics Dashboard**: Visual insights on lead behavior
- **A/B Testing**: Test different conversation flows
- **Sentiment Analysis**: Detect lead emotions and adjust tone


## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please open an issue in the GitHub repository.

---

Built with React, Supabase, and OpenAI


<img width="1919" height="1007" alt="Screenshot 2025-12-20 005432" src="https://github.com/user-attachments/assets/ce8f5105-12b0-4097-8dc7-6c97c286c816" />
<img width="1919" height="1014" alt="Screenshot 2025-12-20 005442" src="https://github.com/user-attachments/assets/63d85425-b6f3-4178-873d-cbb624f3cd2c" />
<img width="1917" height="985" alt="Screenshot 2025-12-20 005528" src="https://github.com/user-attachments/assets/deb9b805-a5c7-4869-a692-36907c32df0c" />



