# Vercel Deployment Guide

This guide will help you deploy the application to Vercel.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. [Node.js](https://nodejs.org/) installed (version 14 or higher)
3. [Git](https://git-scm.com/) installed
4. The Vercel CLI (optional but recommended)

## Environment Variables

Before deploying, make sure to set up the following environment variables in your Vercel project:

```env
NODE_ENV=production
CACHE_DURATION=3600000
ENABLE_COMPRESSION=true
ELEVENLABS_API_KEY=your_api_key_here
# Add any other environment variables from your .env file
```

## Deployment Steps

### Option 1: Deploy using Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Navigate to your project directory and run:
   ```bash
   vercel
   ```

4. Follow the prompts to configure your project:
   - Select your Vercel scope/account
   - Confirm the project name
   - Confirm the project directory
   - Configure project settings

5. Once deployed, Vercel will provide you with a production URL.

### Option 2: Deploy via Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)

3. Click "New Project"

4. Import your repository

5. Configure your project:
   - Select the framework preset (Node.js)
   - Configure build settings:
     - Build Command: `npm run build`
     - Output Directory: `dist` (if applicable)
     - Install Command: `npm install`

6. Add your environment variables in the project settings

7. Deploy!

## Post-Deployment

1. Verify your deployment by visiting the provided Vercel URL

2. Check the deployment logs in your Vercel dashboard for any issues

3. Set up custom domains if needed (via Vercel dashboard)

## Troubleshooting

If you encounter any issues:

1. Check the deployment logs in Vercel dashboard
2. Verify all environment variables are correctly set
3. Ensure all dependencies are properly listed in package.json
4. Check if the build command completes successfully

## Automatic Deployments

Vercel automatically deploys:
- Every push to main/master branch (production)
- Every push to other branches (preview deployments)
- Pull request changes (preview deployments)

## Production Checks

Before deploying to production, ensure:

1. All environment variables are properly set
2. API endpoints are correctly configured
3. Static assets are being served correctly
4. Build process completes successfully locally

## Need Help?

- Visit [Vercel Documentation](https://vercel.com/docs)
- Check [Vercel Support](https://vercel.com/support)
- Review deployment logs in Vercel dashboard 