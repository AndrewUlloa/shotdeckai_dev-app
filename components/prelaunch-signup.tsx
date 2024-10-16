// components/PrelaunchSignup.tsx
'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Loader2 } from "lucide-react"

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
          <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
            <h4 className="text-lg font-medium mb-2">Get Early Access</h4>
            <p className="text-sm text-gray-600 mb-4">
              Sign up to be notified when we launch.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required

                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className=" hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitted || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" /> Submitting...
                      </>
                    ) : isSubmitted ? (
                      <>
                        <Check className="mr-2" /> Submitted
                      </>
                    ) : (
                      'Sign Up'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
