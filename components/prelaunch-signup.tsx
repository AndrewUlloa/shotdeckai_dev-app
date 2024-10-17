// components/PrelaunchSignup.tsx
'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Loader2 } from "lucide-react"
import { ArrowUpIcon } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"
import { LogoWithText } from "@/components/ui/logo-with-text"

export default function PrelaunchSignup() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/collectEmails/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      setIsSubmitted(true)
      // Reset form after 3 seconds
      setTimeout(() => {
        setEmail('')
        setIsSubmitted(false)
        setIsOpen(false)
      }, 3000)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button className="hidden sm:block" onClick={() => setIsOpen(true)}>
        Get your invitation
      </Button>
      <Button className="sm:hidden md:hidden lg:hidden xl:hidden 2xl:hidden" onClick={() => setIsOpen(true)}>
        Get invited
      </Button>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="flex items-center p-1.5 bg-white/60 border-gradient-lg rounded-2xl">
            <div className="linear-gradient-popover rounded-xl flex flex-col justify-between gap-10 py-4 px-6 w-full">
              <LogoWithText />
                <div className="flex flex-col gap-3 ">
                  <h2 className="text-xl font-inter font-medium tracking-wide text-center">Get Early Access</h2>
                  <p className="text-sm font-inter font-light tracking-wide text-center">
                    Sign up to be notified when we launch!
                  </p>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="input-shadow">
                    <div className="flex flex-row border-2 border-#E6DCF2 py-2 pl-4 pr-2 justify-between bg-white rounded-full input-shadow">
                      <Input className="flex flex-grow shadow-none placeholder:text-#A1A1A1"
                        id="email"
                        placeholder="Enter your email"
                        type="email"
                        value={email}
                        onChange ={(e) => setEmail(e.target.value)}
                        required
                        /> 
                        <IconButton
                        type="submit"
                        disabled={isSubmitted || isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="animate-spin" />
                          </>
                        ) : isSubmitted ? (
                          <>
                            <Check /> 
                          </>
                        ) : (
                          <ArrowUpIcon/>
                        )}
                      </IconButton>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end space-x-2">
                      {/* <Button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className=" hover:bg-gray-50"
                      >
                        Cancel
                      </Button> */}
                     
                    </div>
                  </div>
                </form>
            </div>
          </div>
            
        </div>
      )}
    </>
  )
}
