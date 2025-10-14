#!/bin/bash

# Verification script for mobile app setup
# Run this to check if everything is configured correctly

echo "🔍 Verifying Mobile App Setup for Chore Buster"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: .env file exists
echo -n "1. Checking .env file... "
if [ -f ".env" ]; then
    if grep -q "VITE_API_URL=https://taskie.org" .env; then
        echo -e "${GREEN}✓ Found and configured correctly${NC}"
    else
        echo -e "${YELLOW}⚠ Found but may need updating${NC}"
        echo "   Make sure it contains: VITE_API_URL=https://taskie.org"
    fi
else
    echo -e "${RED}✗ Missing${NC}"
    echo "   Run: cp .env.example .env"
    echo "   Then set: VITE_API_URL=https://taskie.org"
fi

# Check 2: Capacitor config exists
echo -n "2. Checking capacitor.config.ts... "
if [ -f "capacitor.config.ts" ]; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
fi

# Check 3: Environment config exists
echo -n "3. Checking environment.ts... "
if [ -f "client/src/config/environment.ts" ]; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
fi

# Check 4: iOS project exists
echo -n "4. Checking iOS project... "
if [ -d "ios" ]; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${YELLOW}⚠ Not generated yet${NC}"
    echo "   Run: npx cap add ios (Mac only)"
fi

# Check 5: Android project exists
echo -n "5. Checking Android project... "
if [ -d "android" ]; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${YELLOW}⚠ Not generated yet${NC}"
    echo "   Run: npx cap add android"
fi

# Check 6: Node modules installed
echo -n "6. Checking Capacitor packages... "
if [ -d "node_modules/@capacitor/core" ]; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
    echo "   Run: npm install"
fi

# Check 7: dist/public directory
echo -n "7. Checking build output... "
if [ -d "dist/public" ]; then
    echo -e "${GREEN}✓ Found (already built)${NC}"
else
    echo -e "${YELLOW}⚠ Not built yet${NC}"
    echo "   Run: npm run build:mobile"
fi

# Check 8: Test backend connection
echo -n "8. Testing backend at taskie.org... "
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://taskie.org/api/user)
    if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Backend is accessible (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "${RED}✗ Backend returned HTTP $HTTP_CODE${NC}"
        echo "   Check if taskie.org is deployed and running"
    fi
else
    echo -e "${YELLOW}⚠ curl not found, skipping test${NC}"
fi

# Check 9: TypeScript compilation
echo -n "9. Checking TypeScript... "
npm run check > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ No type errors${NC}"
else
    echo -e "${RED}✗ Type errors found${NC}"
    echo "   Run: npm run check"
fi

echo ""
echo "=============================================="
echo "Summary:"
echo ""

# Count checks
TOTAL_CHECKS=9

# Determine readiness
echo "📱 Mobile Setup Status:"
if [ -f ".env" ] && [ -f "capacitor.config.ts" ] && [ -f "client/src/config/environment.ts" ]; then
    echo -e "${GREEN}✅ Ready to build mobile apps!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Push CORS changes to GitHub: git push"
    echo "  2. Wait for Replit deployment"
    echo "  3. Build iOS: npm run mobile:ios (Mac only)"
    echo "  4. Build Android: npm run mobile:android"
else
    echo -e "${YELLOW}⚠️  Some setup steps needed${NC}"
    echo ""
    echo "Please fix the issues above, then run this script again."
fi

echo ""
echo "📚 Documentation:"
echo "  - Quick start: SETUP_FOR_TASKIE.md"
echo "  - Full guide: MOBILE_BUILD_GUIDE.md"
echo ""
