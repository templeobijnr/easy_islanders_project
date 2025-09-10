#!/usr/bin/env python3
"""
Easy Islanders MVP Deployment Script
This script helps you deploy to Railway (recommended) or DigitalOcean
"""

import os
import subprocess
import sys

def run_command(command, description):
    """Run a command and handle errors."""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return None

def check_requirements():
    """Check if required tools are installed."""
    print("🔍 Checking requirements...")
    
    # Check if git is installed
    if not run_command("git --version", "Checking Git"):
        print("❌ Git is not installed. Please install Git first.")
        return False
    
    # Check if Python is installed
    if not run_command("python --version", "Checking Python"):
        print("❌ Python is not installed. Please install Python first.")
        return False
    
    print("✅ All requirements met!")
    return True

def setup_environment():
    """Set up environment variables."""
    print("🔧 Setting up environment...")
    
    if not os.path.exists('.env'):
        print("📝 Creating .env file from template...")
        run_command("cp env.example .env", "Copying environment template")
        print("⚠️  Please edit .env file with your actual values!")
        return False
    else:
        print("✅ .env file already exists")
        return True

def install_dependencies():
    """Install Python dependencies."""
    print("📦 Installing dependencies...")
    return run_command("pip install -r requirements.txt", "Installing Python packages")

def run_migrations():
    """Run Django migrations."""
    print("🗄️  Running database migrations...")
    return run_command("python manage.py migrate", "Running migrations")

def collect_static():
    """Collect static files."""
    print("📁 Collecting static files...")
    return run_command("python manage.py collectstatic --noinput", "Collecting static files")

def create_superuser():
    """Create Django superuser."""
    print("👤 Creating superuser...")
    print("⚠️  You'll need to enter username, email, and password")
    return run_command("python manage.py createsuperuser", "Creating superuser")

def test_deployment():
    """Test the deployment."""
    print("🧪 Testing deployment...")
    
    # Test Django server
    print("Starting Django development server...")
    print("Press Ctrl+C to stop the server")
    try:
        subprocess.run("python manage.py runserver 0.0.0.0:8000", shell=True)
    except KeyboardInterrupt:
        print("\n✅ Server stopped")

def main():
    """Main deployment function."""
    print("🚀 Easy Islanders MVP Deployment")
    print("=" * 40)
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Setup environment
    if not setup_environment():
        print("⚠️  Please configure .env file and run again")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Run migrations
    if not run_migrations():
        print("❌ Failed to run migrations")
        sys.exit(1)
    
    # Collect static files
    if not collect_static():
        print("❌ Failed to collect static files")
        sys.exit(1)
    
    # Create superuser
    create_superuser()
    
    print("\n🎉 Local deployment completed!")
    print("\nNext steps:")
    print("1. Test your application locally")
    print("2. Deploy to Railway or DigitalOcean")
    print("3. Configure your domain")
    print("4. Set up monitoring")
    
    # Ask if user wants to test
    response = input("\nWould you like to test the deployment now? (y/n): ")
    if response.lower() == 'y':
        test_deployment()

if __name__ == "__main__":
    main()


