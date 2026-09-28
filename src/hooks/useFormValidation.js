import { useState, useCallback } from 'react';

export const useFormValidation = (initialValues, validationSchema, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const validateField = useCallback(
    (fieldName, value) => {
      if (!validationSchema || !validationSchema[fieldName]) return null;
      const rules = validationSchema[fieldName];

      if (rules.required && (value === '' || value === null || value === undefined)) {
        return rules.requiredMessage || 'Este campo es obligatorio.';
      }

      if (rules.pattern && value && !rules.pattern.test(value)) {
        return rules.patternMessage || 'Formato inválido.';
      }

      if (rules.minLength && value && value.length < rules.minLength) {
        return rules.minLengthMessage || `Mínimo ${rules.minLength} caracteres.`;
      }

      if (rules.maxLength && value && value.length > rules.maxLength) {
        return rules.maxLengthMessage || `Máximo ${rules.maxLength} caracteres.`;
      }

      if (rules.custom && typeof rules.custom === 'function') {
        const customResult = rules.custom(value, values);
        if (customResult !== true) return customResult;
      }

      return null;
    },
    [validationSchema, values]
  );

  const validateAll = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationSchema || {}).forEach((field) => {
      const error = validateField(field, values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationSchema, validateField, values]);

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      const fieldValue = type === 'checkbox' ? checked : value;

      setValues((prev) => ({ ...prev, [name]: fieldValue }));

      if (touched[name]) {
        const error = validateField(name, fieldValue);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateField]
  );

  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitError(null);
  }, [initialValues]);

  const handleSubmit = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      setSubmitError(null);

      const allTouched = {};
      Object.keys(validationSchema || {}).forEach((f) => {
        allTouched[f] = true;
      });
      setTouched(allTouched);

      const isValid = validateAll();
      if (!isValid) {
        return { success: false, errors: { ...errors } };
      }

      setIsSubmitting(true);
      try {
        const result = onSubmit ? await onSubmit(values) : { success: true };
        return result;
      } catch (err) {
        setSubmitError(err?.message || 'Error al procesar el formulario.');
        return { success: false, error: err };
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateAll, onSubmit, values, validationSchema, errors]
  );

  const isValid =
    Object.keys(errors).length === 0 ||
    Object.values(errors).every((e) => !e);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    validateAll,
    setValues,
  };
};

export default useFormValidation;
