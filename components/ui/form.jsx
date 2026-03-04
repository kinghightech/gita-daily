import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Controller, FormProvider, useFormContext } from 'react-hook-form';

const Form = FormProvider;

function useFormField() {
  const fieldState = useFormContext();

  if (!fieldState) {
    throw new Error('useFormField must be used within <Form>');
  }

  return {
    ...fieldState,
    formItemId: `form-item`,
  };
}

const FormField = ({ name, render }) => {
  return (
    <Controller
      name={name}
      render={render}
    />
  );
};

const FormItem = ({ children, style }) => (
  <View style={[styles.item, style]}>{children}</View>
);

const FormLabel = ({ children, style }) => (
  <Text style={[styles.label, style]}>{children}</Text>
);

const FormControl = ({ children }) => (
  <>{children}</>
);

const FormDescription = ({ children, style }) => (
  <Text style={[styles.description, style]}>{children}</Text>
);

const FormMessage = ({ children, style }) => (
  <Text style={[styles.error, style]}>{children}</Text>
);

const styles = StyleSheet.create({
  item: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e6e7e9',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  error: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});

export { Form, useFormField, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage };
