import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePlatform } from './context';

/** Header icon button that flips the whole hub between dark and light mode. */
export function ThemeToggle({ className }: { className?: string }) {
  const { mode, toggleMode } = usePlatform();
  const toLight = mode === 'dark';
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleMode}
      aria-label={toLight ? 'Switch to light mode' : 'Switch to dark mode'}
      title={toLight ? 'Light mode' : 'Dark mode'}
      className={cn('border-border text-muted-foreground hover:text-foreground', className)}
    >
      {toLight ? <Sun strokeWidth={1.8} /> : <Moon strokeWidth={1.8} />}
    </Button>
  );
}
