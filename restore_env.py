#!/usr/bin/env python3
"""
Script to recreate .env file from env.example template
Run this script to restore your .env file
"""

import shutil
import os

def restore_env_file():
    """Restore .env file from env.example template"""
    
    # Check if env.example exists
    if not os.path.exists('env.example'):
        print("❌ env.example file not found!")
        return False
    
    # Copy env.example to .env
    try:
        shutil.copy('env.example', '.env')
        print("✅ .env file created from env.example template")
        print("\n📝 Next steps:")
        print("1. Edit .env file with your actual values:")
        print("   - OPENAI_API_KEY=your_actual_openai_key")
        print("   - SECRET_KEY=your_actual_secret_key")
        print("   - Database credentials")
        print("   - Twilio credentials")
        print("   - LangSmith API key")
        print("\n2. Run: python manage.py diffsettings (to check for missing variables)")
        print("3. Test your application")
        return True
        
    except Exception as e:
        print(f"❌ Error creating .env file: {e}")
        return False

if __name__ == "__main__":
    restore_env_file()
