import { Link, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../../shared/utils/cn';
import { getDomainConfig } from './DomainRegistry';

export function DomainSidebar() {
  const { domain = '' } = useParams();
  const location = useLocation();
  const config = getDomainConfig(domain);

  if (!config) return null;

  return (
    <aside className="w-64 p-4 border border-slate-200 bg-white/90 backdrop-blur rounded-2xl sticky top-[88px] h-fit">
      <div className="relative overflow-hidden rounded-xl mb-4 p-3 bg-gradient-to-r from-emerald-200 via-lime-200 to-sky-200">
        <div className="flex items-center gap-2">
          <config.icon className="w-6 h-6 text-slate-700" />
          <div className="font-semibold">{config.label} Dashboard</div>
        </div>
        <div className="text-xs text-slate-700 mt-1">Manage your {config.label.toLowerCase()}</div>
        <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/40" />
      </div>

      <div className="text-xs text-slate-500 mb-2">Sections</div>
      <nav className="space-y-1.5">
        {config.nav.map((item, index) => {
          const Icon = item.icon as any;
          const path = item.path(domain);
          const active = location.pathname === path;
          return (
            <motion.div key={item.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
              <Link
                to={path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  active ? 'bg-lime-100 text-lime-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </aside>
  );
}

