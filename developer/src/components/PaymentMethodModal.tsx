'use client';

import React, { useState } from 'react';
import { X, CreditCard, Lock, ShieldCheck } from 'lucide-react';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (cardDetails: { last4: string; brand: string; exp: string }) => void;
}

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({ isOpen, onClose, onAddCard }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [cardholder, setCardholder] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      const last4 = cardNumber.replace(/\s/g, '').slice(-4) || '4242';
      onAddCard({
        last4,
        brand: cardNumber.startsWith('4') ? 'Visa' : 'Mastercard',
        exp: cardExp
      });
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#070b14] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Add Payment Method</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Cardholder Name</label>
            <input 
              type="text" 
              required
              value={cardholder}
              onChange={(e) => setCardholder(e.target.value)}
              placeholder="Alex Rivera"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Card Number</label>
            <div className="relative">
              <input 
                type="text" 
                required
                maxLength={19}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4242 •••• •••• 4242"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Expires (MM/YY)</label>
              <input 
                type="text" 
                required
                maxLength={5}
                value={cardExp}
                onChange={(e) => setCardExp(e.target.value)}
                placeholder="12/28"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">CVC / CVV</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  maxLength={4}
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  placeholder="123"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {isSubmitting ? 'Securing & Saving...' : 'Save Payment Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
