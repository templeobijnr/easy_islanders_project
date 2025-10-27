#!/usr/bin/env python3
"""
Recompute domain centroids from intent_exemplars.

This is a placeholder script. In Sprint 4, wire to Postgres pgvector and your
embedding pipeline. Emit a summary to stdout for cron visibility.
"""

import os
import sys
from datetime import datetime


def main():
    print(f"[{datetime.utcnow().isoformat()}] update_centroids: start")
    # TODO: connect to DB, read exemplars, compute centroids per domain
    # Write back to domain_centroids table
    print("No-op centroid recompute (skeleton)")
    print(f"[{datetime.utcnow().isoformat()}] update_centroids: done")


if __name__ == "__main__":
    sys.exit(main())

