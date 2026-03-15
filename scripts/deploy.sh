#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Check if running in GitHub Actions or locally
if [ -n "$GITHUB_ACTIONS" ]; then
  echo "📦 Running in GitHub Actions environment"
  DEPLOY_TARGET="github-pages"
else
  echo "💻 Running in local environment"
  
  # Ask for deployment target
  read -p "Select deployment target (1: GitHub Pages, 2: Custom Server): " deploy_choice
  
  case $deploy_choice in
    1)
      DEPLOY_TARGET="github-pages"
      ;;
    2)
      read -p "Enter server hostname: " SERVER_HOST
      read -p "Enter SSH username: " SSH_USER
      read -p "Enter deployment path (default: /var/www/html): " DEPLOY_PATH
      DEPLOY_PATH=${DEPLOY_PATH:-/var/www/html}
      DEPLOY_TARGET="server"
      ;;
    *)
      echo "❌ Invalid choice"
      exit 1
      ;;
  esac
fi

# Build the project
echo "🔨 Building project..."
yarn build

# Verify build output
if [ ! -d "dist" ]; then
  echo "❌ Build failed: dist directory not found"
  exit 1
fi

echo "✅ Build completed successfully!"

# Deploy based on target
case $DEPLOY_TARGET in
  github-pages)
    echo "📤 Deploying to GitHub Pages..."
    
    # Create .nojekyll file to prevent GitHub from ignoring files starting with underscore
    touch dist/.nojekyll
    
    # Commit and push to gh-pages branch (if using manual deployment)
    if [ -n "$GITHUB_TOKEN" ]; then
      echo "🔑 Using GitHub token for authentication"
      
      # Initialize git repo if not already initialized
      if [ ! -d ".git" ]; then
        git init
      fi
      
      git config user.name "GitHub Actions"
      git config user.email "actions@github.com"
      
      # Add build artifacts
      git add dist/
      
      # Commit if there are changes
      if ! git diff --cached --quiet; then
        git commit -m "Deploy to GitHub Pages [ci skip]" || echo "No changes to commit"
        
        # Push to gh-pages branch
        git push origin gh-pages --force 2>/dev/null || {
          git remote add origin https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git 2>/dev/null || true
          git branch -M gh-pages
          git push -u origin gh-pages --force
        }
      fi
      
      echo "✅ Deployment to GitHub Pages completed!"
      echo "🌐 Your app is now live at: https://${GITHUB_REPOSITORY_OWNER}.github.io/${GITHUB_REPOSITORY_NAME}/"
    else
      echo "⚠️  No GITHUB_TOKEN found. Manual deployment required."
      echo "   Run: git add dist/ && git commit -m 'Deploy' && git push origin gh-pages --force"
    fi
    ;;
  
  server)
    echo "📤 Deploying to server: ${SSH_USER}@${SERVER_HOST}"
    
    # Create backup on server
    echo "💾 Creating backup..."
    ssh ${SSH_USER}@${SERVER_HOST} "mkdir -p /var/www/backup && tar -czf /var/www/backup/backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /var/www/html . 2>/dev/null || true"
    
    # Transfer files
    echo "📦 Transferring files..."
    rsync -avz --delete dist/ ${SSH_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
    
    # Set permissions
    echo "⚙️  Setting permissions..."
    ssh ${SSH_USER}@${SERVER_HOST} "chmod -R 755 ${DEPLOY_PATH} && chown -R www-data:www-data ${DEPLOY_PATH} 2>/dev/null || true"
    
    # Restart web server if possible
    read -p "Restart web server? (y/n): " restart_server
    if [ "$restart_server" = "y" ]; then
      echo "🔄 Restarting web server..."
      ssh ${SSH_USER}@${SERVER_HOST} "systemctl restart nginx 2>/dev/null || systemctl restart apache2 2>/dev/null || echo 'Manual restart required'"
    fi
    
    echo "✅ Deployment to server completed!"
    echo "🌐 Your app is now live at: https://${SERVER_HOST}/"
    ;;
esac

echo "✨ Deployment finished successfully!"
