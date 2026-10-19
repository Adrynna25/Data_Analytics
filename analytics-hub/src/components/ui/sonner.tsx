import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

/** Rendered inside each dashboard root so toasts pick up that platform's theme. */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'group !bg-popover !text-foreground !border-border-strong !font-sans !shadow-lg !rounded-lg',
          description: '!text-muted-foreground',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
