import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { usePortalContainer } from '@/shared/portal';

const Sheet = SheetPrimitive.Root;
const SheetClose = SheetPrimitive.Close;
const SheetTitle = SheetPrimitive.Title;
const SheetDescription = SheetPrimitive.Description;

const sheetVariants = cva(
  'fixed z-50 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-300',
  {
    variants: {
      side: {
        left: 'inset-y-0 left-0 h-full data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        right: 'inset-y-0 right-0 h-full data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        bottom: 'inset-x-0 bottom-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
      },
    },
    defaultVariants: { side: 'left' },
  },
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  ({ side = 'left', className, children, ...props }, ref) => {
    const container = usePortalContainer();
    return (
      <SheetPrimitive.Portal container={container}>
        <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
          {children}
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    );
  },
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

export { Sheet, SheetClose, SheetContent, SheetTitle, SheetDescription };
