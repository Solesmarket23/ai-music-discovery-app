# Deploying AI Music Discovery App to Vercel

This guide will help you deploy your AI Music Discovery App to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier is sufficient)
- A GitHub, GitLab, or Bitbucket account (for automatic deployments)
- Firebase project for authentication (optional but recommended)
- API keys for AI services (optional)

## Step 1: Prepare Your Environment Variables

Copy the `.env.example` file to create your own `.env.local` file:

```bash
cp .env.example .env.local
```

Fill in the required values:

### Required for Firebase Authentication:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Optional API Keys:
- `DEEPGRAM_API_KEY` - For voice transcription features
- `REPLICATE_API_TOKEN` - For AI image generation
- `ANTHROPIC_API_KEY` - For Claude AI chat features
- `OPENAI_API_KEY` - For OpenAI features (currently disabled)

## Step 2: Push to Git Repository

If you haven't already, initialize a git repository and push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Run the deployment command:
```bash
vercel
```

3. Follow the prompts:
   - Link to existing project or create new one
   - Choose your scope (personal or team)
   - Confirm project settings

4. Add environment variables:
```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# Add all other required variables...
```

### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Configure your project:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next
5. Add environment variables in the "Environment Variables" section
6. Click "Deploy"

## Step 4: Configure Domain (Optional)

1. In your Vercel dashboard, go to your project settings
2. Navigate to "Domains"
3. Add your custom domain or use the provided `.vercel.app` domain

## Step 5: Set Up Firebase

1. Update Firebase authorized domains:
   - Go to Firebase Console → Authentication → Settings
   - Add your Vercel domain(s) to authorized domains

2. Update Firebase storage CORS (if using storage):
   ```json
   [
     {
       "origin": ["https://your-app.vercel.app"],
       "method": ["GET", "POST"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

## Important Notes

### Audio Analysis Feature
The app performs advanced audio analysis using Web Audio API. This runs entirely in the browser, so no special server configuration is needed.

### API Route Timeouts
The `vercel.json` file configures extended timeouts (30 seconds) for AI-intensive routes:
- `/api/music-ai/recommendations`
- `/api/deepgram`
- `/api/replicate/generate-image`

### Build Optimization
The app is optimized for production with:
- Static generation where possible
- API routes for dynamic content
- Client-side audio processing

## Troubleshooting

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

### Runtime Errors
- Check function logs in Vercel dashboard
- Ensure API keys are valid
- Verify Firebase configuration

### Performance Issues
- The app uses client-side audio analysis to avoid server load
- Large music libraries may take time to analyze initially
- Consider implementing pagination for very large libraries

## Local Development

To run locally with production-like environment:

```bash
npm run build
npm start
```

## Support

For issues specific to:
- Vercel deployment: Check [Vercel documentation](https://vercel.com/docs)
- Next.js: See [Next.js documentation](https://nextjs.org/docs)
- Firebase: Visit [Firebase documentation](https://firebase.google.com/docs)