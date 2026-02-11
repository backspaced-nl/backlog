'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [pin, setPin] = useState(['', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetch('/api/auth/verify')
      .then(res => res.json())
      .then(data => {
        if (data.isAuthenticated) {
          router.replace('/admin');
        }
      })
      .catch(() => {});
  }, [router]);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newPin.every(digit => digit !== '') && index === 4) {
      handleSubmit(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (pinValue: string = pin.join('')) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin: pinValue }),
      });

      const data = await response.json();

      if (response.ok) {
        router.replace('/admin');
      } else {
        setError(data.error || 'Invalid PIN');
        setPin(['', '', '', '', '']);
        inputRefs.current[0]?.focus();

        if (response.status === 429) {
          setIsBlocked(true);
        }
      }
    } catch {
      setError('An error occurred. Please try again.');
      setPin(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--foreground)]">
            Admin Access
          </h1>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            Enter PIN to continue
          </p>
        </div>

        <div className="flex justify-center gap-3">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-xl font-semibold rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-colors disabled:opacity-50"
              autoComplete="off"
              autoFocus={index === 0}
              disabled={isLoading || isBlocked}
            />
          ))}
        </div>

        {error && (
          <div className="mt-6 rounded-[var(--radius)] p-4 bg-[var(--error-bg)] border border-red-200">
            <p className="text-sm text-[var(--error-text)]">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center mt-6">
            <svg className="animate-spin h-8 w-8 text-[var(--accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>
    </main>
  );
}
