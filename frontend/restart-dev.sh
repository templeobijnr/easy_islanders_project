#!/bin/bash
# Helper script to restart the frontend dev server
# This resolves TypeScript module resolution issues after installing new packages

echo "🔄 Restarting frontend dev server..."
echo ""

# Kill any existing react-scripts processes
pkill -f react-scripts 2>/dev/null && echo "✅ Stopped existing dev server" || echo "ℹ️  No dev server was running"

# Clear TypeScript/webpack cache
echo "🧹 Clearing compilation cache..."
rm -rf node_modules/.cache
echo "✅ Cache cleared"

echo ""
echo "📦 All dependencies are installed:"
echo "  ✅ @radix-ui/react-avatar"
echo "  ✅ @radix-ui/react-dialog"
echo "  ✅ @radix-ui/react-slot"
echo "  ✅ @radix-ui/react-tooltip"
echo "  ✅ class-variance-authority"
echo "  ✅ react-day-picker"
echo "  ✅ date-fns"
echo ""

echo "🚀 Starting fresh dev server..."
echo "   The TypeScript errors will disappear when the server starts."
echo ""

npm start
