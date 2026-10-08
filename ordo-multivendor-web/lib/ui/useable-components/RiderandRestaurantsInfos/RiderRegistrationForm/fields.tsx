"use client";

import { ErrorMessage, Field, FieldProps } from "formik";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";

const inputClass =
  "w-full border-2 text-sm border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 p-2 rounded-lg";

interface FieldBaseProps {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}

const Label = ({ label, required }: { label: string; required?: boolean }) => (
  <label className="text-sm dark:text-gray-300">
    {label}
    {required ? <span className="text-red-500"> *</span> : null}
  </label>
);

const Error = ({ name }: { name: string }) => (
  <ErrorMessage name={name} component="small" className="p-error text-sm" />
);

export const TextField = ({
  name,
  label,
  placeholder,
  required,
  type = "text",
}: FieldBaseProps & { type?: string }) => (
  <div>
    <Label label={label} required={required} />
    <Field name={name}>
      {({ field }: FieldProps) => (
        <InputText
          {...field}
          value={field.value ?? ""}
          type={type}
          placeholder={placeholder ?? label}
          className={inputClass}
        />
      )}
    </Field>
    <Error name={name} />
  </div>
);

export const PasswordField = ({ name, label, required }: FieldBaseProps) => (
  <div>
    <Label label={label} required={required} />
    <Field name={name}>
      {({ field }: FieldProps) => (
        <Password
          {...field}
          inputClassName="bg-white text-black dark:bg-gray-700 dark:text-white w-full"
          panelClassName="bg-white text-black dark:bg-gray-700 dark:text-white"
          placeholder={label}
          toggleMask
          feedback={false}
          className="w-full text-sm border-2 border-gray-200 dark:border-gray-600 p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      )}
    </Field>
    <Error name={name} />
  </div>
);

export const FieldError = Error;
export const FieldLabel = Label;
