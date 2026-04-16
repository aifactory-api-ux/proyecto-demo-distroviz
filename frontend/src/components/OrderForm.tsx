import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrder } from '../api/orders';
import { DistributionOrderCreate } from '../types';

/**
 * OrderForm Component - Create/Edit distribution order form
 * 
 * Provides a form interface for creating new distribution orders
 * with validation, dynamic selectors, and user feedback.
 * 
 * Features:
 * - Form validation for all required fields
 * - Status selection dropdown
 * - Date pickers for shipped and delivered dates
 * - Loading states and error handling
 * - Success/error notifications
 */
export default function OrderForm() {
  const queryClient = useQueryClient();
  
  // Form state
  const [formData, setFormData] = useState<DistributionOrderCreate>({
    order_number: '',
    product_name: '',
    quantity: 0,
    destination: '',
    status: 'pending',
    shipped_at: null,
    delivered_at: null,
  });
  
  // Validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  // Create order mutation
  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      // Invalidate orders cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      
      // Show success notification
      setNotification({
        type: 'success',
        message: 'Orden creada exitosamente',
      });
      
      // Reset form
      setFormData({
        order_number: '',
        product_name: '',
        quantity: 0,
        destination: '',
        status: 'pending',
        shipped_at: null,
        delivered_at: null,
      });
      setErrors({});
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    },
    onError: (error: Error) => {
      setNotification({
        type: 'error',
        message: error.message || 'Error al crear la orden',
      });
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    },
  });
  
  // Validate form data
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.order_number.trim()) {
      newErrors.order_number = 'El número de orden es requerido';
    }
    
    if (!formData.product_name.trim()) {
      newErrors.product_name = 'El nombre del producto es requerido';
    }
    
    if (formData.quantity <= 0) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0';
    }
    
    if (!formData.destination.trim()) {
      newErrors.destination = 'El destino es requerido';
    }
    
    if (!formData.status) {
      newErrors.status = 'El estado es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);
  
  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    mutation.mutate(formData);
  }, [formData, validateForm, mutation]);
  
  // Handle input change
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value, 10) || 0 : value,
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);
  
  // Handle date change
  const handleDateChange = useCallback((field: 'shipped_at' | 'delivered_at') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value ? new Date(e.target.value).toISOString() : null;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);
  
  // Status options for dropdown
  const statusOptions = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'shipped', label: 'Enviado' },
    { value: 'delivered', label: 'Entregado' },
    { value: 'cancelled', label: 'Cancelado' },
  ];
  
  // Common destinations (in a real app, this would come from an API)
  const commonDestinations = [
    'CDMX',
    'Guadalajara',
    'Monterrey',
    'Puebla',
    'Tijuana',
    'Cancún',
    'Mérida',
    'León',
  ];
  
  return (
    <div className="order-form-container">
      <h2 className="form-title">Crear Nueva Orden</h2>
      
      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="order-form">
        {/* Order Number */}
        <div className="form-group">
          <label htmlFor="order_number">Número de Orden *</label>
          <input
            type="text"
            id="order_number"
            name="order_number"
            value={formData.order_number}
            onChange={handleChange}
            placeholder="ORD-20240401-001"
            className={`form-input ${errors.order_number ? 'input-error' : ''}`}
          />
          {errors.order_number && (
            <span className="error-message">{errors.order_number}</span>
          )}
        </div>
        
        {/* Product Name */}
        <div className="form-group">
          <label htmlFor="product_name">Nombre del Producto *</label>
          <input
            type="text"
            id="product_name"
            name="product_name"
            value={formData.product_name}
            onChange={handleChange}
            placeholder="Producto A"
            className={`form-input ${errors.product_name ? 'input-error' : ''}`}
          />
          {errors.product_name && (
            <span className="error-message">{errors.product_name}</span>
          )}
        </div>
        
        {/* Quantity */}
        <div className="form-group">
          <label htmlFor="quantity">Cantidad *</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="1"
            placeholder="100"
            className={`form-input ${errors.quantity ? 'input-error' : ''}`}
          />
          {errors.quantity && (
            <span className="error-message">{errors.quantity}</span>
          )}
        </div>
        
        {/* Destination */}
        <div className="form-group">
          <label htmlFor="destination">Destino *</label>
          <div className="destination-input-wrapper">
            <input
              type="text"
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              placeholder="Ciudad de destino"
              list="destinations-list"
              className={`form-input ${errors.destination ? 'input-error' : ''}`}
            />
            <datalist id="destinations-list">
              {commonDestinations.map((dest) => (
                <option key={dest} value={dest} />
              ))}
            </datalist>
          </div>
          {errors.destination && (
            <span className="error-message">{errors.destination}</span>
          )}
        </div>
        
        {/* Status */}
        <div className="form-group">
          <label htmlFor="status">Estado *</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`form-input form-select ${errors.status ? 'input-error' : ''}`}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.status && (
            <span className="error-message">{errors.status}</span>
          )}
        </div>
        
        {/* Shipped Date */}
        <div className="form-group">
          <label htmlFor="shipped_at">Fecha de Envío</label>
          <input
            type="datetime-local"
            id="shipped_at"
            name="shipped_at"
            value={formData.shipped_at ? formData.shipped_at.slice(0, 16) : ''}
            onChange={handleDateChange('shipped_at')}
            className="form-input"
          />
        </div>
        
        {/* Delivered Date */}
        <div className="form-group">
          <label htmlFor="delivered_at">Fecha de Entrega</label>
          <input
            type="datetime-local"
            id="delivered_at"
            name="delivered_at"
            value={formData.delivered_at ? formData.delivered_at.slice(0, 16) : ''}
            onChange={handleDateChange('delivered_at')}
            className="form-input"
            disabled={!formData.shipped_at}
          />
        </div>
        
        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <span className="btn-loading">Creando...</span>
            ) : (
              'Crear Orden'
            )}
          </button>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setFormData({
                order_number: '',
                product_name: '',
                quantity: 0,
                destination: '',
                status: 'pending',
                shipped_at: null,
                delivered_at: null,
              });
              setErrors({});
            }}
          >
            Limpiar
          </button>
        </div>
      </form>
      
      {/* Form Styles */}
      <style>{`
        .order-form-container {
          background: #fff;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          margin: 0 auto;
        }
        
        .form-title {
          margin: 0 0 24px 0;
          color: #1f2937;
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        .notification {
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-weight: 500;
        }
        
        .notification-success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #34d399;
        }
        
        .notification-error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #f87171;
        }
        
        .order-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .form-group label {
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
        }
        
        .form-input {
          padding: 10px 14px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: #fff;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .form-input.input-error {
          border-color: #ef4444;
        }
        
        .form-input.input-error:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        
        .form-input:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }
        
        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 10px center;
          background-repeat: no-repeat;
          background-size: 20px;
          padding-right: 40px;
        }
        
        .destination-input-wrapper {
          position: relative;
        }
        
        .error-message {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 2px;
        }
        
        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        
        .btn {
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        
        .btn-primary {
          background: #3b82f6;
          color: #fff;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }
        
        .btn-primary:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }
        
        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }
        
        .btn-secondary:hover {
          background: #e5e7eb;
        }
        
        .btn-loading {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}