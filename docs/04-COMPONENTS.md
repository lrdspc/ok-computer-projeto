# Componentes React - Sistema PWA de Gerenciamento de Treinos

## 1. VISÃO GERAL

Este documento descreve todos os componentes React utilizados no sistema, sua estrutura, props, estado e responsabilidades. Os componentes são organizados em duas categorias principais:

- **Componentes UI**: Componentes genéricos e reutilizáveis (design system)
- **Componentes de Features**: Componentes específicos de funcionalidades

## 2. COMPONENTES UI (DESIGN SYSTEM)

### 2.1. Button

**Arquivo**: `/components/ui/Button.tsx`

Componente de botão altamente customizável baseado no padrão shadcn/ui.

```typescript
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

**Props**:
- `variant`: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
- `size`: 'default' | 'sm' | 'lg' | 'icon'
- `asChild`: boolean - Permite compor com componentes Radix UI
- `disabled`: boolean
- `onClick`: () => void

**Exemplo de uso**:
```tsx
<Button variant="primary" size="lg" onClick={handleClick}>
  Iniciar Treino
</Button>
```

### 2.2. Card

**Arquivo**: `/components/ui/Card.tsx`

Componente de card flexível com subcomponentes para cabeçalho, conteúdo e rodapé.

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

### 2.3. Dialog

**Arquivo**: `/components/ui/Dialog.tsx`

Componente de dialog modal baseado no Radix UI Dialog.

```typescript
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
```

### 2.4. Form

**Arquivo**: `/components/ui/Form.tsx`

Componentes para construção de formulários integrados com React Hook Form.

```typescript
import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/Label';

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn('space-y-2', className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = 'FormItem';

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      ref={ref}
      className={cn(error && 'text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = 'FormLabel';

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = 'FormControl';

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
FormDescription.displayName = 'FormDescription';

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn('text-sm font-medium text-destructive', className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = 'FormMessage';

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
```

### 2.5. Input

**Arquivo**: `/components/ui/Input.tsx`

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
```

### 2.6. Progress

**Arquivo**: `/components/ui/Progress.tsx`

```typescript
import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
```

### 2.7. Tabs

**Arquivo**: `/components/ui/Tabs.tsx`

```typescript
import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
```

## 3. COMPONENTES DE FEATURES

### 3.1. Auth Components

#### 3.1.1. LoginForm

**Arquivo**: `/components/features/auth/LoginForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/Button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

const formSchema = z.object({
  email: z.string().email({
    message: 'Por favor, insira um email válido.',
  }),
  password: z.string().min(6, {
    message: 'A senha deve ter pelo menos 6 caracteres.',
  }),
});

export function LoginForm() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        form.setError('email', { message: 'Email ou senha inválidos.' });
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      form.setError('email', { message: 'Erro ao fazer login. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>
          Acesse sua conta para gerenciar seus treinos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="seu@email.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="******"
                      type="password"
                      autoCapitalize="none"
                      autoComplete="current-password"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

#### 3.1.2. RegisterForm

**Arquivo**: `/components/features/auth/RegisterForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/Button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

const formSchema = z.object({
  email: z.string().email({
    message: 'Por favor, insira um email válido.',
  }),
  password: z.string().min(6, {
    message: 'A senha deve ter pelo menos 6 caracteres.',
  }),
  fullName: z.string().min(2, {
    message: 'O nome deve ter pelo menos 2 caracteres.',
  }),
  userType: z.enum(['trainer', 'student'], {
    message: 'Selecione um tipo de usuário válido.',
  }),
});

export function RegisterForm() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      userType: 'student',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: values.email,
            full_name: values.fullName,
            user_type: values.userType,
          });

        if (profileError) throw profileError;
      }

      router.push('/login?registered=true');
    } catch (error: any) {
      form.setError('email', { message: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Criar Conta</CardTitle>
        <CardDescription>
          Crie sua conta para começar a usar o sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Seu nome completo"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="seu@email.com"
                      type="email"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="******"
                      type="password"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="userType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Conta</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de conta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="student">Aluno</SelectItem>
                      <SelectItem value="trainer">Personal Trainer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

### 3.2. Dashboard Components

#### 3.2.1. DashboardLayout

**Arquivo**: `/components/features/dashboard/DashboardLayout.tsx`

```typescript
'use client';

import { ReactNode } from 'react';
import { useUserStore } from '@/store/user.store';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNavigation } from './BottomNavigation';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useUserStore();

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <div className="flex">
        <Sidebar className="hidden lg:flex" />
        <main className="flex-1 lg:pl-64">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
      <BottomNavigation />
    </div>
  );
}
```

#### 3.2.2. Header

**Arquivo**: `/components/features/dashboard/Header.tsx`

```typescript
'use client';

import { User } from '@/types/user';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useSupabase } from '@/hooks/useSupabase';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  user: User | null;
}

export function Header({ user }: HeaderProps) {
  const { supabase } = useSupabase();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1" />
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profile_photo_url || ''} alt={user?.full_name} />
                  <AvatarFallback>{user?.full_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
```

#### 3.2.3. StatsCard

**Arquivo**: `/components/features/dashboard/StatsCard.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({ title, value, icon: Icon, description, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↗' : '↘'} {trend.value}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 3.3. Workout Components

#### 3.3.1. WorkoutCard

**Arquivo**: `/components/features/workout/WorkoutCard.tsx`

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dumbbell, Clock, Users } from 'lucide-react';
import { Workout } from '@/types/workout';

interface WorkoutCardProps {
  workout: Workout;
  onStart?: () => void;
  onView?: () => void;
  variant?: 'student' | 'trainer';
}

export function WorkoutCard({ workout, onStart, onView, variant = 'student' }: WorkoutCardProps) {
  const difficultyColors = {
    iniciante: 'bg-green-100 text-green-800',
    intermediário: 'bg-yellow-100 text-yellow-800',
    avançado: 'bg-red-100 text-red-800',
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              {workout.name}
            </CardTitle>
            <CardDescription>{workout.description}</CardDescription>
          </div>
          <Badge className={difficultyColors[workout.difficulty]}>
            {workout.difficulty}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            {workout.estimated_duration_minutes} minutos
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="mr-2 h-4 w-4" />
            {workout.exercises_count} exercícios
          </div>

          <div className="flex gap-2 pt-4">
            {variant === 'student' && onStart && (
              <Button onClick={onStart} className="flex-1">
                Iniciar Treino
              </Button>
            )}
            {onView && (
              <Button variant="outline" onClick={onView}>
                Ver Detalhes
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 3.3.2. WorkoutPlayer

**Arquivo**: `/components/features/workout-player/WorkoutPlayer.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Workout, WorkoutExercise } from '@/types/workout';
import { useTimerWorker } from '@/hooks/useTimerWorker';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useHaptic } from '@/hooks/useHaptic';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { Timer } from './Timer';
import { ExerciseDisplay } from './ExerciseDisplay';
import { RestTimer } from './RestTimer';
import { WorkoutComplete } from './WorkoutComplete';
import { Play, Pause, SkipForward } from 'lucide-react';

interface WorkoutPlayerProps {
  workout: Workout;
}

export function WorkoutPlayer({ workout }: WorkoutPlayerProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [workoutState, setWorkoutState] = useState<'idle' | 'active' | 'paused' | 'completed'>('idle');
  const [sessionData, setSessionData] = useState<any>({});

  const { time, isRunning, start, stop, pause, resume } = useTimerWorker();
  const { request: requestWakeLock, release: releaseWakeLock } = useWakeLock();
  const { play: playHaptic } = useHaptic();

  const currentExercise = workout.exercises[currentExerciseIndex];
  const totalSets = currentExercise?.sets || 3;
  const totalExercises = workout.exercises.length;
  const progress = ((currentExerciseIndex * totalSets + currentSet) / (totalExercises * totalSets)) * 100;

  useEffect(() => {
    if (workoutState === 'active') {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [workoutState, requestWakeLock, releaseWakeLock]);

  const handleStartWorkout = () => {
    setWorkoutState('active');
    playHaptic('light');
  };

  const handleCompleteSet = () => {
    playHaptic('medium');
    
    // Salvar dados da série
    setSessionData((prev: any) => ({
      ...prev,
      [currentExercise.id]: {
        ...prev[currentExercise.id],
        [currentSet]: {
          reps: currentExercise.reps,
          weight: currentExercise.suggested_weight_kg,
          completedAt: new Date(),
        },
      },
    }));

    if (currentSet < totalSets) {
      // Próxima série do mesmo exercício
      setCurrentSet(currentSet + 1);
      setIsResting(true);
      start(currentExercise.rest_time_seconds);
    } else if (currentExerciseIndex < totalExercises - 1) {
      // Próximo exercício
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      setIsResting(true);
      start(currentExercise.rest_time_seconds);
    } else {
      // Treino completo
      handleCompleteWorkout();
    }
  };

  const handleSkipRest = () => {
    stop();
    setIsResting(false);
  };

  const handleCompleteWorkout = () => {
    setWorkoutState('completed');
    playHaptic('heavy');
    releaseWakeLock();
  };

  if (workoutState === 'completed') {
    return (
      <WorkoutComplete
        workout={workout}
        sessionData={sessionData}
        onFinish={() => router.push('/dashboard')}
      />
    );
  }

  if (isResting) {
    return (
      <RestTimer
        time={time}
        isRunning={isRunning}
        onSkip={handleSkipRest}
        exercise={workout.exercises[currentExerciseIndex + 1]}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">{workout.name}</h1>
        <Progress value={progress} className="mt-4" />
        <p className="text-sm text-muted-foreground mt-2">
          Exercício {currentExerciseIndex + 1} de {totalExercises} • Série {currentSet} de {totalSets}
        </p>
      </div>

      {/* Current Exercise */}
      {currentExercise && (
        <ExerciseDisplay
          exercise={currentExercise}
          currentSet={currentSet}
          onCompleteSet={handleCompleteSet}
          workoutState={workoutState}
          onStart={handleStartWorkout}
          onPause={() => setWorkoutState('paused')}
          onResume={() => setWorkoutState('active')}
        />
      )}

      {/* Controls */}
      <Card>
        <CardContent className="flex justify-center gap-4 pt-6">
          {workoutState === 'idle' && (
            <Button size="lg" onClick={handleStartWorkout}>
              <Play className="mr-2 h-4 w-4" />
              Iniciar Treino
            </Button>
          )}
          
          {workoutState === 'active' && (
            <>
              <Button variant="outline" size="lg" onClick={() => setWorkoutState('paused')}>
                <Pause className="mr-2 h-4 w-4" />
                Pausar
              </Button>
              <Button size="lg" onClick={handleCompleteSet}>
                Completar Série
              </Button>
            </>
          )}
          
          {workoutState === 'paused' && (
            <>
              <Button size="lg" onClick={() => setWorkoutState('active')}>
                <Play className="mr-2 h-4 w-4" />
                Continuar
              </Button>
              <Button variant="outline" size="lg" onClick={handleCompleteWorkout}>
                <SkipForward className="mr-2 h-4 w-4" />
                Finalizar
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 3.3.3. Timer

**Arquivo**: `/components/features/workout-player/Timer.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { formatTime } from '@/lib/utils';
import { Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TimerProps {
  initialTime?: number;
  onComplete?: () => void;
}

export function Timer({ initialTime = 0, onComplete }: TimerProps) {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + 1;
          if (onComplete && newTime >= 600) { // 10 minutos máximo
            setIsRunning(false);
            onComplete();
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, onComplete]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleStop = () => {
    setIsRunning(false);
    setTime(0);
  };

  return (
    <div className="text-center space-y-4">
      <div className="text-6xl font-mono font-bold tabular-nums">
        {formatTime(time)}
      </div>
      
      <div className="flex justify-center gap-2">
        {!isRunning ? (
          <Button onClick={handleStart} size="lg">
            <Play className="mr-2 h-4 w-4" />
            Iniciar
          </Button>
        ) : (
          <Button onClick={handlePause} variant="outline" size="lg">
            <Pause className="mr-2 h-4 w-4" />
            Pausar
          </Button>
        )}
        
        <Button onClick={handleStop} variant="ghost" size="lg">
          <Square className="mr-2 h-4 w-4" />
            Parar
        </Button>
      </div>
    </div>
  );
}
```

### 3.4. Exercise Components

#### 3.4.1. ExerciseCard

**Arquivo**: `/components/features/exercises/ExerciseCard.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dumbbell, Video, Edit, Trash2 } from 'lucide-react';
import { Exercise } from '@/types/exercise';
import Image from 'next/image';

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  variant?: 'student' | 'trainer';
}

export function ExerciseCard({ exercise, onEdit, onDelete, onView, variant = 'student' }: ExerciseCardProps) {
  const difficultyColors = {
    iniciante: 'bg-green-100 text-green-800',
    intermediário: 'bg-yellow-100 text-yellow-800',
    avançado: 'bg-red-100 text-red-800',
  };

  return (
    <Card className="overflow-hidden">
      {exercise.thumbnail_url && (
        <div className="relative h-48 w-full">
          <Image
            src={exercise.thumbnail_url}
            alt={exercise.name}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            {exercise.name}
          </CardTitle>
          <Badge className={difficultyColors[exercise.difficulty]}>
            {exercise.difficulty}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {exercise.description}
        </p>
        
        <div className="space-y-2 mb-4">
          <div className="flex flex-wrap gap-1">
            {exercise.muscle_groups.map((muscle) => (
              <Badge key={muscle} variant="secondary">
                {muscle}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {exercise.video_urls && exercise.video_urls.length > 0 && (
            <Button variant="outline" size="sm" onClick={onView}>
              <Video className="mr-2 h-4 w-4" />
              Ver Vídeo
            </Button>
          )}
          
          {variant === 'trainer' && (
            <>
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 3.4.2. ExerciseForm

**Arquivo**: `/components/features/exercises/ExerciseForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  muscle_groups: z.array(z.string()).min(1, 'Selecione pelo menos um grupo muscular'),
  difficulty: z.enum(['iniciante', 'intermediário', 'avançado']),
  equipment: z.enum(['none', 'dumbbell', 'barbell', 'machine', 'cable', 'band', 'bodyweight']).optional(),
  exercise_type: z.enum(['strength', 'cardio', 'flexibility', 'balance']).optional(),
  video_urls: z.array(z.string().url()).optional(),
});

interface ExerciseFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  initialData?: any;
  isLoading?: boolean;
}

export function ExerciseForm({ onSubmit, initialData, isLoading = false }: ExerciseFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      instructions: '',
      muscle_groups: [],
      difficulty: 'intermediário',
      equipment: 'none',
      exercise_type: 'strength',
      video_urls: [],
    },
  });

  const muscleGroups = [
    'peito', 'costas', 'ombros', 'bíceps', 'tríceps', 'quadríceps', 
    'hamstrings', 'glúteos', 'panturrilha', 'abdômen', 'antebraço'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Editar Exercício' : 'Novo Exercício'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Exercício</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Supino Reto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição breve do exercício..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dificuldade</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a dificuldade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermediário">Intermediário</SelectItem>
                      <SelectItem value="avançado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Exercício'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

### 3.5. Assessment Components

#### 3.5.1. AssessmentChart

**Arquivo**: `/components/features/assessments/AssessmentChart.tsx`

```typescript
'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Assessment } from '@/types/assessment';

interface AssessmentChartProps {
  assessments: Assessment[];
  metric: 'weight' | 'body_fat_percentage' | 'bmi' | 'lean_mass';
  title: string;
  color?: string;
}

export function AssessmentChart({ assessments, metric, title, color = '#8884d8' }: AssessmentChartProps) {
  const data = useMemo(() => {
    return assessments
      .sort((a, b) => new Date(a.assessment_date).getTime() - new Date(b.assessment_date).getTime())
      .map((assessment) => ({
        date: new Date(assessment.assessment_date).toLocaleDateString('pt-BR'),
        value: assessment[metric],
      }));
  }, [assessments, metric]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

## 4. HIERARQUIA DE COMPONENTES

```
App
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── BottomNavigation
├── DashboardLayout
│   ├── StatsGrid
│   │   └── StatsCard
│   ├── WorkoutList
│   │   └── WorkoutCard
│   └── RecentActivity
├── WorkoutPlayer
│   ├── ExerciseDisplay
│   ├── Timer
│   ├── RestTimer
│   └── WorkoutComplete
├── ExerciseLibrary
│   ├── ExerciseCard
│   ├── ExerciseForm
│   └── ExerciseFilters
├── Assessments
│   ├── AssessmentForm
│   ├── AssessmentChart
│   └── AssessmentHistory
└── Profile
    ├── UserInfo
    ├── SettingsForm
    └── NotificationPreferences
```

## 5. PADRÕES DE DESIGN

### 5.1. Composition over Inheritance

Todos os componentes seguem o princípio de composição, permitindo maior flexibilidade e reutilização.

### 5.2. Type Safety

- Props fortemente tipadas com TypeScript
- Uso de `React.FC` para componentes funcionais
- Definição clara de interfaces e tipos

### 5.3. Acessibilidade

- Uso de atributos ARIA apropriados
- Navegação por teclado
- Focus management
- Screen reader friendly

### 5.4. Performance

- Code splitting com React.lazy
- Memoização com React.memo quando apropriado
- Otimização de re-renders
- Uso de useCallback e useMemo

---

**Documento Version**: 1.0.0  
**Última Atualização**: 2025-01-01  
**Responsável**: Equipe de Frontend
