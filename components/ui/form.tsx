"use client";

import * as React from "react";
import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type ControllerFieldState,
  type FieldPath,
  type FieldValues,
  type UseFormStateReturn,
} from "react-hook-form";
import { cn } from "@/lib/utils";

export const Form = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<"form">) => {
  return <form {...props}>{children}</form>;
};

type FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
> = {
  control: Control<TFieldValues>;
  name: TName;
  render: (props: {
    field: ControllerRenderProps<TFieldValues, TName>;
    fieldState: ControllerFieldState;
    formState: UseFormStateReturn<TFieldValues>;
  }) => React.ReactElement;
};

export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
>({
  control,
  name,
  render,
}: FormFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState, formState }) =>
        render({
          field,
          fieldState,
          formState,
        })
      }
    />
  );
}

export const FormItem = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("space-y-2", className)}>
    {children}
  </div>
);

export const FormLabel = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <label
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
  >
    {children}
  </label>
);

export const FormControl = ({
  children,
}: {
  children: React.ReactNode;
}) => <div>{children}</div>;

export const FormMessage = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  if (!children) return null;

  return (
    <p className="text-sm font-medium text-destructive">
      {children}
    </p>
  );
};

export const FormDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={cn("text-sm text-muted-foreground", className)}>
    {children}
  </p>
);