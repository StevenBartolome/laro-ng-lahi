# Deploying Laro ng Lahi to Vercel

This guide will walk you through deploying your game to Vercel for **free hosting** with a **custom domain** (optional).

## Prerequisites

1. **GitHub Account** - [Sign up here](https://github.com/signup) if you don't have one
2. **Vercel Account** - [Sign up here](https://vercel.com/signup) (you can sign in with GitHub)
3. **Git Installed** - Check by running `git --version` in your terminal

## Step 1: Push Your Code to GitHub

### 1.1 Create a New Repository on GitHub

1. Go to [GitHub](https://github.com)
2. Click the **+** icon in the top right → **New repository**
3. Name it `laro-ng-lahi` (or your preferred name)
4. **Do NOT** initialize with README (your project already has files)
5. Click **Create repository**

### 1.2 Push Your Local Code

Open your terminal in the project directory and run:

```bash
# Add all files to git
git add .

# Commit the changes
git commit -m "Prepare for Vercel deployment"

# Add your GitHub repository as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/laro-ng-lahi.git

# Push to GitHub
git push -u origin hosting
```

> **Note**: Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 2: Deploy to Vercel

### 2.1 Connect Vercel to GitHub

1. Go to [Vercel](https://vercel.com)
2. Click **Sign Up** (or **Log In** if you have an account)
3. Choose **Continue with GitHub**
4. Authorize Vercel to access your GitHub account

### 2.2 Import Your Project

1. Click **Add New...** → **Project**
2. Find your `laro-ng-lahi` repository in the list
3. Click **Import**

### 2.3 Configure Project Settings

On the configuration page:

- **Framework Preset**: Select **Other**
- **Root Directory**: Leave as `./` (default)
- **Build Command**: Leave empty (we're serving static files)
- **Output Directory**: `public`

### 2.4 Add Environment Variables

Click **Environment Variables** and add:

- **Name**: `JWT_SECRET`
- **Value**: `your-random-secret-key-here-make-it-long-and-random`

> **Important**: Use a strong, random secret. You can generate one at [1Password](https://1password.com/password-generator/) or use this command:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 2.5 Deploy

Click **Deploy** and wait ~2 minutes for deployment to complete.

## Step 3: Test Your Deployment

Once deployed, Vercel will give you a URL like: `https://laro-ng-lahi.vercel.app`

### Test Checklist

- [ ] Visit the URL and verify the login page loads
- [ ] Click **PLAY AS GUEST** and verify you can access the game
- [ ] Register a new account with your email
- [ ] Verify email and login
- [ ] Play each game (Jolen, Luksong Baka, Patintero)
- [ ] Test logout functionality
- [ ] Test audio controls

## Step 4: Custom Domain (Optional)

### Free Custom Domain Options

1. **Vercel Subdomain** (Free, Instant)
   - Go to your project settings in Vercel
   - Under **Domains**, your default `*.vercel.app` domain is ready

2. **Your Own Domain** (Paid, ~$10/year)
   - Buy a domain from [Namecheap](https://namecheap.com) or [Google Domains](https://domains.google)
   - In Vercel, go to **Project Settings** → **Domains**
   - Add your domain and follow the DNS configuration instructions

## Automatic Deployments

Every time you push to the `hosting` branch on GitHub, Vercel will automatically redeploy your site!

```bash
# Make changes to your code
git add .
git commit -m "Update game features"
git push origin hosting
```

Your changes will be live in ~2 minutes!

## Troubleshooting

### Issue: "500 Internal Server Error"

**Solution**: Check the **Functions** tab in Vercel dashboard for error logs.

### Issue: "Authentication not working"

**Solution**: 
1. Verify `JWT_SECRET` is set in Environment Variables
2. Check if Firebase config is correct in `public/assets/js/firebase-config.js`
3. Ensure Firebase Authentication is enabled in Firebase Console

### Issue: "Assets not loading (images/audio)"

**Solution**:
1. Verify files exist in the `public` directory
2. Check browser console for 404 errors
3. Verify `vercel.json` routes are correct

### Issue: "Guest mode not working"

**Solution**: 
1. Clear browser cache and cookies
2. Try in incognito/private browsing mode
3. Check browser console for JavaScript errors

## Support

If you encounter any issues:
1. Check the [Vercel Documentation](https://vercel.com/docs)
2. Review deployment logs in Vercel dashboard
3. Check browser console for errors (F12 → Console tab)

## Next Steps

- Share your game URL with friends!
- Monitor usage in Vercel Analytics (free tier includes basic analytics)
- Update your Firebase Authentication settings to allow your Vercel domain
- Consider adding more features and pushing updates
