'use client';

import { useState } from 'react';
import { addCartItemRequest } from '@/lib/catalog';

interface AddToCartButtonProps {
  variantId: string;
  quantity?: number;
  className?: string;
  label?: string;
}

export function AddToCartButton({ variantId, quantity = 1, className = 'btn-primary px-4 py-2 text-sm', label = 'ADD' }: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setStatus('');

    try {
      await addCartItemRequest({ variantId, quantity });
      setStatus('Added');
      window.setTimeout(() => setStatus(''), 1800);
    } catch {
      setStatus('Retry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" className={className} onClick={handleClick} disabled={loading}>
      {loading ? 'ADDING...' : status || label}
    </button>
  );
}
