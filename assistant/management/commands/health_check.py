# assistant/management/commands/health_check.py
"""
Django management command for running LLM system health checks

Usage:
    python manage.py health_check
    python manage.py health_check --alerts
    python manage.py health_check --metrics
"""

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
import json

from assistant.monitoring.health import HealthChecker
from assistant.monitoring.alerts import AlertManager
from assistant.monitoring.metrics import LLMMetrics


class Command(BaseCommand):
    help = 'Run comprehensive health checks for the LLM production system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--alerts',
            action='store_true',
            help='Check for active alerts',
        )
        parser.add_argument(
            '--metrics',
            action='store_true',
            help='Show performance metrics',
        )
        parser.add_argument(
            '--json',
            action='store_true',
            help='Output results in JSON format',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🔍 Running LLM Production Health Checks...')
        )
        
        results = {}
        
        # Run health checks
        try:
            health_checker = HealthChecker()
            health_results = health_checker.run_health_checks()
            results['health'] = health_results
            
            if options['json']:
                self.stdout.write(json.dumps(health_results, indent=2))
            else:
                self._display_health_results(health_results)
        
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Health check failed: {e}')
            )
            results['health_error'] = str(e)
        
        # Check alerts if requested
        if options['alerts']:
            try:
                alert_manager = AlertManager()
                active_alerts = alert_manager.get_active_alerts()
                results['alerts'] = active_alerts
                
                if options['json']:
                    self.stdout.write(json.dumps(active_alerts, indent=2))
                else:
                    self._display_alerts(active_alerts)
            
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Alert check failed: {e}')
                )
                results['alerts_error'] = str(e)
        
        # Show metrics if requested
        if options['metrics']:
            try:
                metrics = LLMMetrics()
                performance_stats = metrics.get_performance_stats()
                daily_metrics = metrics.get_daily_metrics()
                results['metrics'] = {
                    'performance': performance_stats,
                    'daily': daily_metrics
                }
                
                if options['json']:
                    self.stdout.write(json.dumps(results['metrics'], indent=2))
                else:
                    self._display_metrics(performance_stats, daily_metrics)
            
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Metrics check failed: {e}')
                )
                results['metrics_error'] = str(e)
        
        # Summary
        if not options['json']:
            self._display_summary(results)
    
    def _display_health_results(self, health_results):
        """Display health check results in a readable format"""
        overall_status = health_results.get('overall_status', 'unknown')
        
        # Status emoji and color
        if overall_status == 'healthy':
            status_emoji = '✅'
            status_style = self.style.SUCCESS
        elif overall_status == 'degraded':
            status_emoji = '⚠️'
            status_style = self.style.WARNING
        else:
            status_emoji = '❌'
            status_style = self.style.ERROR
        
        self.stdout.write(
            status_style(f'{status_emoji} Overall Status: {overall_status.upper()}')
        )
        
        # Individual checks
        checks = health_results.get('checks', [])
        for check in checks:
            name = check.get('name', 'unknown')
            status = check.get('status', 'unknown')
            message = check.get('message', 'No message')
            response_time = check.get('response_time_ms', 0)
            
            if status == 'healthy':
                check_emoji = '✅'
                check_style = self.style.SUCCESS
            elif status == 'degraded':
                check_emoji = '⚠️'
                check_style = self.style.WARNING
            else:
                check_emoji = '❌'
                check_style = self.style.ERROR
            
            self.stdout.write(
                check_style(f'  {check_emoji} {name}: {message} ({response_time:.0f}ms)')
            )
        
        # Summary
        summary = health_results.get('summary', {})
        if summary:
            self.stdout.write(
                self.style.SUCCESS(
                    f'📊 Health Summary: {summary.get("healthy", 0)}/{summary.get("total_checks", 0)} healthy '
                    f'({summary.get("health_percentage", 0):.1f}%)'
                )
            )
    
    def _display_alerts(self, alerts):
        """Display active alerts"""
        if not alerts:
            self.stdout.write(self.style.SUCCESS('✅ No active alerts'))
            return
        
        self.stdout.write(
            self.style.WARNING(f'⚠️ {len(alerts)} Active Alerts:')
        )
        
        for alert in alerts:
            severity = alert.get('severity', 'unknown')
            alert_type = alert.get('type', 'unknown')
            message = alert.get('message', 'No message')
            timestamp = alert.get('timestamp', 'Unknown time')
            
            if severity == 'critical':
                alert_emoji = '🚨'
                alert_style = self.style.ERROR
            elif severity == 'high':
                alert_emoji = '⚠️'
                alert_style = self.style.WARNING
            else:
                alert_emoji = 'ℹ️'
                alert_style = self.style.NOTICE
            
            self.stdout.write(
                alert_style(f'  {alert_emoji} [{severity.upper()}] {alert_type}: {message}')
            )
            self.stdout.write(f'    Time: {timestamp}')
    
    def _display_metrics(self, performance_stats, daily_metrics):
        """Display performance metrics"""
        self.stdout.write(self.style.SUCCESS('📊 Performance Metrics:'))
        
        # Performance stats
        if performance_stats:
            total_requests = performance_stats.get('total_requests', 0)
            avg_latency = performance_stats.get('avg_latency_ms', 0)
            success_rate = performance_stats.get('success_rate', 0)
            cost_per_request = performance_stats.get('cost_per_request', 0)
            
            self.stdout.write(f'  Total Requests: {total_requests}')
            self.stdout.write(f'  Average Latency: {avg_latency:.0f}ms')
            self.stdout.write(f'  Success Rate: {success_rate:.2%}')
            self.stdout.write(f'  Cost per Request: ${cost_per_request:.4f}')
        
        # Daily metrics
        if daily_metrics:
            total_cost = daily_metrics.get('total_cost', 0)
            total_requests = daily_metrics.get('total_requests', 0)
            total_tokens = daily_metrics.get('total_tokens', 0)
            
            self.stdout.write(self.style.SUCCESS('📅 Daily Metrics:'))
            self.stdout.write(f'  Total Cost: ${total_cost:.2f}')
            self.stdout.write(f'  Total Requests: {total_requests}')
            self.stdout.write(f'  Total Tokens: {total_tokens:,}')
    
    def _display_summary(self, results):
        """Display overall summary"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('📋 Health Check Summary'))
        self.stdout.write('='*50)
        
        # Health status
        health = results.get('health', {})
        overall_status = health.get('overall_status', 'unknown')
        
        if overall_status == 'healthy':
            self.stdout.write(self.style.SUCCESS('✅ System is healthy and operational'))
        elif overall_status == 'degraded':
            self.stdout.write(self.style.WARNING('⚠️ System is degraded but operational'))
        else:
            self.stdout.write(self.style.ERROR('❌ System has critical issues'))
        
        # Alerts summary
        alerts = results.get('alerts', [])
        if alerts:
            critical_count = len([a for a in alerts if a.get('severity') == 'critical'])
            if critical_count > 0:
                self.stdout.write(
                    self.style.ERROR(f'🚨 {critical_count} critical alerts require immediate attention')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⚠️ {len(alerts)} alerts need monitoring')
                )
        
        # Recommendations
        self.stdout.write('\n💡 Recommendations:')
        if overall_status != 'healthy':
            self.stdout.write('  - Review error logs for detailed information')
            self.stdout.write('  - Check system resources and dependencies')
            self.stdout.write('  - Consider scaling or optimization')
        
        if alerts:
            self.stdout.write('  - Address active alerts promptly')
            self.stdout.write('  - Review alert thresholds if needed')
        
        self.stdout.write('  - Run health checks regularly in production')
        self.stdout.write('  - Monitor performance metrics and costs')



