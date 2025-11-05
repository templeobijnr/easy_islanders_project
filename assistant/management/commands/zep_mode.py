"""
Management command for Zep memory mode operations.

Usage:
    python manage.py zep_mode --status
    python manage.py zep_mode --force auth --ttl 600
    python manage.py zep_mode --clear
    python manage.py zep_mode --invalidate thread_123
"""
from django.core.management.base import BaseCommand, CommandError
from django.core.cache import cache
from assistant.memory.flags import (
    effective_mode,
    base_mode,
    get_forced_mode,
    force_write_only,
    clear_forced_mode,
    reset_consecutive_failures,
)
import time


class Command(BaseCommand):
    help = 'Manage Zep memory service mode (force, clear, status)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--status',
            action='store_true',
            help='Show current memory mode status',
        )
        parser.add_argument(
            '--force',
            type=str,
            choices=['auth', 'consecutive_failures', 'manual', 'rollback'],
            help='Force write_only mode with specified reason',
        )
        parser.add_argument(
            '--ttl',
            type=int,
            default=300,
            help='TTL in seconds for forced mode (default: 300s/5min)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear forced mode and restore base mode',
        )
        parser.add_argument(
            '--invalidate',
            type=str,
            metavar='THREAD_ID',
            help='Invalidate context cache for specific thread',
        )
        parser.add_argument(
            '--reset-failures',
            action='store_true',
            help='Reset consecutive failure counter',
        )

    def handle(self, *args, **options):
        # Status check
        if options['status']:
            self._show_status()
            return

        # Force mode
        if options['force']:
            reason = options['force']
            ttl = options['ttl']
            self._force_mode(reason, ttl)
            return

        # Clear forced mode
        if options['clear']:
            self._clear_mode()
            return

        # Invalidate context cache
        if options['invalidate']:
            thread_id = options['invalidate']
            self._invalidate_context(thread_id)
            return

        # Reset failure counter
        if options['reset_failures']:
            self._reset_failures()
            return

        # No action specified
        raise CommandError(
            'No action specified. Use --status, --force, --clear, --invalidate, or --reset-failures'
        )

    def _show_status(self):
        """Display current memory mode status."""
        self.stdout.write(self.style.SUCCESS('=== Zep Memory Mode Status ===\n'))

        # Base mode (from env flags)
        base = base_mode()
        self.stdout.write(f'Base mode (from flags): {self.style.WARNING(base.value)}')

        # Forced mode (if any)
        forced = get_forced_mode()
        if forced:
            reason = forced.get('reason', 'unknown')
            until = forced.get('until', 0)
            remaining = max(0, int(until - time.time()))
            self.stdout.write(
                f'Forced mode: {self.style.ERROR("write_only")} '
                f'(reason={reason}, remaining={remaining}s)'
            )
        else:
            self.stdout.write('Forced mode: None')

        # Effective mode (actual runtime mode)
        effective = effective_mode()
        self.stdout.write(f'Effective mode: {self.style.SUCCESS(effective.value)}')

        # Cache stats
        try:
            from django.core.cache import cache
            # Check for forced mode key
            forced_key = cache.get("mem:mode:forced:v1")
            failures = cache.get("mem:read:consec_failures", 0)
            probe_lock = cache.get("mem:mode:probe_lock:v1")

            self.stdout.write(f'\nCache status:')
            self.stdout.write(f'  Forced mode cache: {"SET" if forced_key else "NOT SET"}')
            self.stdout.write(f'  Consecutive failures: {failures}')
            self.stdout.write(f'  Probe lock: {"LOCKED" if probe_lock else "unlocked"}')
        except Exception as e:
            self.stdout.write(f'\nCache status: Error checking cache ({e})')

        # Note: Redis cache doesn't support introspection of entry count
        self.stdout.write('\n[Context cache uses Redis - entry count not available]')

    def _force_mode(self, reason: str, ttl: int):
        """Force write_only mode."""
        self.stdout.write(
            f'Forcing write_only mode (reason={reason}, ttl={ttl}s)...'
        )

        try:
            force_write_only(reason=reason, ttl_seconds=ttl)
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Mode forced to write_only for {ttl} seconds\n'
                    f'  Reason: {reason}\n'
                    f'  Expires at: {time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(time.time() + ttl))}'
                )
            )

            # Show updated status
            self.stdout.write('\nUpdated status:')
            self._show_status()

        except Exception as e:
            raise CommandError(f'Failed to force mode: {e}')

    def _clear_mode(self):
        """Clear forced mode and restore base mode."""
        forced = get_forced_mode()
        if not forced:
            self.stdout.write(self.style.WARNING('No forced mode to clear.'))
            return

        self.stdout.write(f'Clearing forced mode (reason={forced.get("reason")})...')

        try:
            clear_forced_mode()
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Forced mode cleared\n'
                    f'  Base mode restored: {base_mode().value}'
                )
            )

            # Show updated status
            self.stdout.write('\nUpdated status:')
            self._show_status()

        except Exception as e:
            raise CommandError(f'Failed to clear mode: {e}')

    def _invalidate_context(self, thread_id: str):
        """Invalidate context cache for a specific thread."""
        self.stdout.write(f'Invalidating context cache for thread: {thread_id}...')

        try:
            from django.core.cache import cache

            # Delete all possible cache keys for this thread
            modes = ['summary', 'recent', 'facts']
            deleted_count = 0

            for mode in modes:
                cache_key = f"zep:ctx:v1:{thread_id}:{mode}"
                try:
                    cache.delete(cache_key)
                    deleted_count += 1
                except Exception:
                    pass

            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Context cache invalidated ({deleted_count} keys deleted)'
                )
            )

        except Exception as e:
            raise CommandError(f'Failed to invalidate cache: {e}')

    def _reset_failures(self):
        """Reset consecutive failure counter."""
        self.stdout.write('Resetting consecutive failure counter...')

        try:
            # Get current count before reset
            from django.core.cache import cache
            current_count = cache.get("mem:read:consec_failures", 0)

            reset_consecutive_failures()

            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Consecutive failure counter reset\n'
                    f'  Previous count: {current_count}\n'
                    f'  New count: 0'
                )
            )

        except Exception as e:
            raise CommandError(f'Failed to reset failures: {e}')
