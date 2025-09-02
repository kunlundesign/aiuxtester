# AI Scenario Simulator

A web application for evaluating user interface designs using AI models and Gen Z personas.

## Features

- **Multiple AI Providers**: OpenAI GPT-4V, Google Gemini Pro, Zhipu GLM-4V
- **Gen Z Personas**: 5 data-backed personas representing different Gen Z user types
- **Comprehensive Evaluation**: Usability, Accessibility, and Visual Design analysis
- **Interactive Results**: Thumbnail navigation, detailed scores, and issue tracking
- **Export Options**: Markdown and JSON export functionality

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.local` and add your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ZHIPU_API_KEY=your_zhipu_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Select AI Model**: Choose between OpenAI, Gemini, or Zhipu
2. **Choose Persona**: Select a Gen Z persona that matches your target audience
3. **Upload Images**: Drop or select UI screenshots to evaluate
4. **Run Simulation**: Click "Run Simulation" to get AI-powered evaluation
5. **Review Results**: Examine scores, narrative analysis, and specific issues
6. **Export Results**: Copy to Markdown or download JSON for further analysis

## Available Personas

- **Trend-Seeking Freshman** (18–22, mobile-first, trend discovery)
- **Mobile-First Power User** (20–25, efficiency, shortcuts)  
- **Creator Economy Kid** (18–24, content creation/sharing)
- **Privacy-Cautious Student** (18–26, strong trust needs)
- **Global Bilingual Gen Z** (16–24, multilingual & cultural fit)

## API Endpoints

- `POST /api/evaluate` - Main evaluation endpoint
  - Input: `{ model, personaId, images[] }`
  - Output: `EvalResult` JSON

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: Fluent UI React
- **Backend**: Next.js API Routes
- **AI Integration**: OpenAI, Google Gemini, Zhipu GLM APIs
- **Validation**: Zod schemas

## Deployment

### Vercel (Recommended)

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

1. Build the application:
   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm start
   ```

## Development

```bash
# Development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Production build
npm run build
```

## Architecture

The application is designed with future Figma plugin integration in mind:

- **Service-oriented architecture**: Core evaluation logic in API routes
- **JSON-based communication**: Same format usable by Figma plugin
- **Base64 image support**: Compatible with Figma's export format
- **Reusable components**: UI components can be adapted for plugin

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Submit a pull request

## License

MIT License - see LICENSE file for details
