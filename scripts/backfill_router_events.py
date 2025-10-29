#!/usr/bin/env python3
"""
Backfill router events from logs for training data.

This script reads router request logs and creates RouterEvent records
for calibration training. It PII-scrubs sensitive data and assigns
train/val/test splits.
"""

from __future__ import annotations

import json
import random
import re
from pathlib import Path
from typing import List, Dict, Any
import argparse

# Ensure repo root on sys.path
REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "easy_islanders.settings.development")
try:
    import django
    django.setup()
except Exception:
    pass

from router_service.models import RouterEvent

# PII patterns to scrub
PII_PATTERNS = [
    (re.compile(r'\b\d{10,}\b'), '[PHONE]'),  # Phone numbers
    (re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'), '[EMAIL]'),  # Emails
    (re.compile(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b'), '[CARD]'),  # Credit cards
    (re.compile(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'), '[IP]'),  # IPs
]

def scrub_pii(text: str) -> str:
    """Remove or replace PII from text."""
    scrubbed = text
    for pattern, replacement in PII_PATTERNS:
        scrubbed = pattern.sub(replacement, scrubbed)
    return scrubbed

def assign_splits(events: List[Dict[str, Any]], train_ratio: float = 0.7, val_ratio: float = 0.2) -> List[Dict[str, Any]]:
    """Assign train/val/test splits to events."""
    random.seed(42)  # For reproducibility
    random.shuffle(events)

    n_total = len(events)
    n_train = int(n_total * train_ratio)
    n_val = int(n_total * val_ratio)

    for i, event in enumerate(events):
        if i < n_train:
            event['split'] = 'train'
        elif i < n_train + n_val:
            event['split'] = 'val'
        else:
            event['split'] = 'test'

    return events

def load_log_file(log_path: str) -> List[Dict[str, Any]]:
    """Load router events from log file."""
    events = []

    try:
        with open(log_path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    # Try to parse as JSON
                    log_entry = json.loads(line.strip())
                    if 'utterance' in log_entry and 'domain_choice' in log_entry:
                        events.append(log_entry)
                except json.JSONDecodeError:
                    continue  # Skip non-JSON lines
    except FileNotFoundError:
        print(f"Warning: Log file {log_path} not found")

    return events

def create_router_events(events: List[Dict[str, Any]], dry_run: bool = False) -> int:
    """Create RouterEvent records from parsed events."""
    created_count = 0

    for event in events:
        try:
            # Extract fields
            utterance = scrub_pii(event.get('utterance', ''))
            domain_choice = event.get('domain_choice', {})
            domain_pred = domain_choice.get('domain', '')
            domain_conf = domain_choice.get('calibrated', domain_choice.get('confidence', 0.0))
            action = event.get('action', 'dispatch')
            latency_ms = event.get('latency_ms', 0)
            thread_id = event.get('thread_id', f'backfill-{random.randint(1000, 9999)}')
            split = event.get('split', 'train')

            if dry_run:
                print(f"Would create: {utterance[:50]}... -> {domain_pred} ({domain_conf:.3f}) [{split}]")
                created_count += 1
                continue

            # Create RouterEvent
            RouterEvent.objects.create(
                thread_id=thread_id,
                utterance=utterance,
                context_hint=event.get('context_hint', {}),
                stage1_safe=event.get('stage1', {}).get('safe', True),
                domain_pred=domain_pred,
                domain_conf=float(domain_conf),
                in_domain_intent=event.get('in_domain_intent', ''),
                action=action,
                latency_ms=int(latency_ms),
                split=split,
            )
            created_count += 1

        except Exception as e:
            print(f"Error creating event: {e}")
            continue

    return created_count

def main():
    parser = argparse.ArgumentParser(description='Backfill router events for training')
    parser.add_argument('--log-file', type=str, help='Path to router log file')
    parser.add_argument('--log-dir', type=str, help='Directory containing router log files')
    parser.add_argument('--train-ratio', type=float, default=0.7, help='Training split ratio')
    parser.add_argument('--val-ratio', type=float, default=0.2, help='Validation split ratio')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done')
    parser.add_argument('--limit', type=int, help='Limit number of events to process')

    args = parser.parse_args()

    # Collect events from logs
    all_events = []

    if args.log_file:
        all_events.extend(load_log_file(args.log_file))

    if args.log_dir:
        log_dir = Path(args.log_dir)
        if log_dir.exists():
            for log_file in log_dir.glob('*.log'):
                all_events.extend(load_log_file(str(log_file)))

    if not all_events:
        print("No events found in specified log files")
        return 1

    # Limit if specified
    if args.limit:
        all_events = all_events[:args.limit]

    print(f"Loaded {len(all_events)} events from logs")

    # Assign splits
    events_with_splits = assign_splits(all_events, args.train_ratio, args.val_ratio)

    # Count splits
    split_counts = {}
    for event in events_with_splits:
        split = event['split']
        split_counts[split] = split_counts.get(split, 0) + 1

    print(f"Split distribution: {split_counts}")

    # Create RouterEvent records
    created = create_router_events(events_with_splits, args.dry_run)

    if args.dry_run:
        print(f"Dry run: Would create {created} RouterEvent records")
    else:
        print(f"Successfully created {created} RouterEvent records")

    return 0

if __name__ == '__main__':
    import sys
    sys.exit(main())