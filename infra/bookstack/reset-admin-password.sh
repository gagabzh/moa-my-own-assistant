#!/bin/bash

# BookStack Admin Password Reset Script
# Usage: ./reset-admin-password.sh <new_password>

if [ -z "$1" ]; then
    echo "Usage: $0 <new_password>"
    echo "Example: $0 MyNewSecurePassword123"
    exit 1
fi

NEW_PASSWORD="$1"

echo "Resetting admin password..."

# Use tinker to update the password
docker exec bookstack bash -c "php /app/www/artisan tinker --execute='\\\$user = \\\\BookStack\\\\Users\\\\Models\\\\User::where(\\\"email\\\", \\\"admin@admin.com\\\")->first(); \\\$user->password = bcrypt(\\\"$NEW_PASSWORD\\\"); \\\$user->save(); echo \\"Password updated successfully\\\\n\\\";'" 2>&1

if [ $? -eq 0 ]; then
    echo "Admin password has been reset."
    echo "New password: $NEW_PASSWORD"
else
    echo "Failed to reset password."
    exit 1
fi
