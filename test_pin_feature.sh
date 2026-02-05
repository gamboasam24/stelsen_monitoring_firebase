#!/bin/bash

# Test Script for User-Specific Announcement Pinning
# This script helps verify the pin feature is working correctly

echo "=========================================="
echo "User-Specific Pin Feature Test"
echo "=========================================="
echo ""

# Check if user_pins table exists
echo "1. Checking if user_pins table exists..."
mysql -u root -p12345 stelsen_monitoring -e "DESCRIBE user_pins;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ user_pins table found!"
else
    echo "✗ user_pins table NOT found. Creating..."
    mysql -u root -p12345 stelsen_monitoring < add_user_pins_table.sql
    echo "✓ user_pins table created!"
fi

echo ""
echo "2. Checking user_pins table structure..."
mysql -u root -p12345 stelsen_monitoring -e "SELECT COUNT(*) as 'Total Pins' FROM user_pins;"

echo ""
echo "3. Sample query - First 5 pinned announcements per user:"
mysql -u root -p12345 stelsen_monitoring -e "
SELECT 
    up.user_id,
    l.email as user_email,
    up.announcement_id,
    a.title,
    up.pinned_at
FROM user_pins up
JOIN login l ON up.user_id = l.login_id
JOIN announcements a ON up.announcement_id = a.announcement_id
ORDER BY up.user_id, up.pinned_at DESC
LIMIT 5;
"

echo ""
echo "=========================================="
echo "Test Complete!"
echo "=========================================="
echo ""
echo "To manually test the feature:"
echo "1. Log in as different users"
echo "2. Pin/unpin announcements"
echo "3. Verify each user sees only their own pins at the top"
echo "4. Check that other users' pins don't affect your view"
