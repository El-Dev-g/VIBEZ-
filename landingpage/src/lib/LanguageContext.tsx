'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import translationsData from './translations.json'
import { Globe, ChevronDown, Check } from 'lucide-react'

export type Language = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ar' | 'it' | 'ru'

export interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (path: string, variablesOrFallback?: Record<string, any> | string, fallback?: string) => string
  dict: typeof translationsData.en
}

const languages: { code: Language; label: string; flag: string; nativeName: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸', nativeName: 'English (US)' },
  { code: 'es', label: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'pt', label: 'Português', flag: '🇧🇷', nativeName: 'Português' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', nativeName: 'العربية' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', nativeName: 'Русский' },
]

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('vibez_preferred_lang') as Language
    const validLangs: Language[] = ['en', 'es', 'fr', 'de', 'pt', 'ar', 'it', 'ru']
    if (stored && validLangs.includes(stored)) {
      setLanguageState(stored)
    } else {
      // Auto-detect browser language if preferred
      const navLang = navigator.language.slice(0, 2) as Language
      if (validLangs.includes(navLang)) {
        setLanguageState(navLang)
      }
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('vibez_preferred_lang', lang)
      // Also update html lang attribute
      document.documentElement.lang = lang
    }
  }

  const dict = translationsData[language] || translationsData.en

  const t = (path: string, variablesOrFallback?: Record<string, any> | string, fallback = ''): string => {
    const keys = path.split('.')
    let current: any = dict
    
    const variables = typeof variablesOrFallback === 'object' ? variablesOrFallback : undefined
    const actualFallback = typeof variablesOrFallback === 'string' ? variablesOrFallback : fallback

    let result = ''

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        // Fallback to English
        let fallbackCurrent: any = translationsData.en
        for (const fbKey of keys) {
          if (fallbackCurrent && typeof fallbackCurrent === 'object' && fbKey in fallbackCurrent) {
            fallbackCurrent = fallbackCurrent[fbKey]
          } else {
            result = actualFallback || path
            break
          }
        }
        if (!result) {
          result = typeof fallbackCurrent === 'string' ? fallbackCurrent : (actualFallback || path)
        }
        break
      }
    }

    if (!result) {
      result = typeof current === 'string' ? current : (actualFallback || path)
    }

    // Interpolate variables
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{${key}}`, 'g'), String(value))
      })
    }

    return result
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dict }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export function LanguageSelector({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentOption = languages.find((l) => l.code === language) || languages[0]

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#202c33]/80 hover:bg-[#202c33] text-[#e9edef] border border-[#2a3942] transition-all hover:border-[#00a884]/40 shadow-sm"
        aria-expanded={open}
        aria-label="Select language"
      >
        <span className="text-sm">{currentOption.flag}</span>
        <span className="hidden sm:inline font-medium">{currentOption.label}</span>
        <span className="sm:hidden uppercase font-bold text-[11px]">{currentOption.code}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-[#8696a0] transition-transform duration-200 ${open ? 'rotate-180 text-[#00a884]' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl bg-[#111b21] border border-[#2a3942] shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#8696a0] border-b border-[#202c33]/80">
            Select Language
          </div>
          {languages.map((item) => {
            const isSelected = item.code === language
            return (
              <button
                key={item.code}
                onClick={() => {
                  setLanguage(item.code)
                  setOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                  isSelected
                    ? 'bg-[#00a884]/15 text-[#00a884] font-bold'
                    : 'text-[#d1d7db] hover:bg-[#202c33] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{item.flag}</span>
                  <div>
                    <div className="font-semibold leading-none">{item.nativeName}</div>
                    <div className="text-[10px] text-[#8696a0] mt-0.5">{item.label}</div>
                  </div>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#00a884]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
