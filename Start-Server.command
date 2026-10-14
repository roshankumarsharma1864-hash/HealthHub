#!/bin/zsh

# Navigate to project directory
cd "$(dirname "$0")"

clear
echo "=========================================================="
echo "         HEALTH HUB - Hospital Management System          "
echo "=========================================================="
echo ""
echo " Initializing environment..."

# Load shell profiles to ensure node/npm are in PATH for Finder launches
[ -f ~/.zprofile ] && source ~/.zprofile 2>/dev/null
[ -f ~/.zshrc ] && source ~/.zshrc 2>/dev/null
[ -f ~/.bash_profile ] && source ~/.bash_profile 2>/dev/null

export PATH="/Users/roshankumarsharma/.gemini/antigravity-ide/bin:/opt/homebrew/bin:/usr/local/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:$PATH"

# Verify Node installation
if ! command -v node >/dev/null 2>&1; then
  echo " Error: Node.js was not found in PATH."
  echo " Please verify Node.js is installed."
  echo ""
  read -p "Press [Enter] to exit..."
  exit 1
fi

echo " Node version: $(node -v)"
echo " Directory:    $(pwd)"
echo ""

# Check if dependencies exist
if [ ! -d "node_modules" ]; then
  echo " Installing project dependencies..."
  npm install
  echo ""
fi

# Check if server is already running on port 5173
if lsof -i :5173 >/dev/null 2>&1; then
  echo " Server is already active on http://localhost:5173"
  echo " Opening website in your default browser..."
  open "http://localhost:5173"
  echo ""
  echo " Press [Enter] to exit this launcher..."
  read
  exit 0
fi

echo " Starting server and opening http://localhost:5173 in browser..."
echo " Press [CTRL + C] anytime to stop the server."
echo "=========================================================="
echo ""

npm run dev -- --open

echo ""
echo "Server closed."
read -p "Press [Enter] to close..."
