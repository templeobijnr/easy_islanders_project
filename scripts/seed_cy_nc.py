#!/usr/bin/env python3
"""
Seed script for CY-NC terms in the registry service.
"""

import json
import os
import sys
import requests
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def load_seed_data():
    """Load seed data from JSON file."""
    seed_file = project_root / "assistant" / "brain" / "registry_seed.json"
    with open(seed_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def seed_terms():
    """Seed terms into the registry service."""
    # Get environment variables
    registry_base_url = os.getenv('REGISTRY_BASE_URL', 'http://localhost:8081')
    api_key = os.getenv('REGISTRY_API_KEY', 'dev-key')
    
    # Load seed data
    terms = load_seed_data()
    
    print(f"Loading {len(terms)} terms into registry service...")
    
    # Prepare headers
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    success_count = 0
    error_count = 0
    
    for term in terms:
        try:
            # Remove the id field as it will be auto-generated
            term_data = {k: v for k, v in term.items() if k != 'id'}
            
            # Make request to upsert endpoint
            response = requests.post(
                f"{registry_base_url}/v1/terms/upsert",
                json=term_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                success_count += 1
                print(f"✓ Loaded: {term_data['base_term']} ({term_data['language']}) -> {term_data['localized_term']}")
            else:
                error_count += 1
                print(f"✗ Failed: {term_data['base_term']} ({term_data['language']}) - {response.status_code}: {response.text}")
                
        except Exception as e:
            error_count += 1
            print(f"✗ Error loading {term.get('base_term', 'unknown')}: {e}")
    
    print(f"\nSeed complete: {success_count} successful, {error_count} errors")
    return success_count > 0

if __name__ == "__main__":
    # Set default environment variables if not set
    if not os.getenv('REGISTRY_BASE_URL'):
        os.environ['REGISTRY_BASE_URL'] = 'http://localhost:8081'
    if not os.getenv('REGISTRY_API_KEY'):
        os.environ['REGISTRY_API_KEY'] = 'dev-key'
    
    success = seed_terms()
    sys.exit(0 if success else 1)
