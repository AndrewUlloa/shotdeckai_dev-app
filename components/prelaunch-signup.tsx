// components/PrelaunchSignup.tsx
'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUpIcon } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"
import { LogoWithText } from "@/components/ui/logo-with-text"
import { X } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'


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

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
    }
  }

  return (
    <>
      <Button className="hidden sm:block text-white text-lg px-8 h-auto" onClick={() => setIsOpen(true)}>
        Get your invitation
      </Button>
      <Button className="sm:hidden md:hidden lg:hidden xl:hidden 2xl:hidden text-white text-base px-6 py-4 h-auto" onClick={() => setIsOpen(true)}>
        Get invited
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 lg:backdrop-blur-sm"
            onClick={handleOverlayClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="m-10 flex items-center p-1.5 bg-white/60 border-gradient-lg rounded-outer-signup lg:p-2"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col bg-gradient-to-b from-white from-0% via-offwhite via-66% to-bluegray to-90%
              border-gradient-signup rounded-inner-signup justify-between gap-6 p-8 lg:gap-8 lg: max-w-full">
                <IconButton className="w-4 h-4" onClick={() => setIsOpen(false)}><X/></IconButton>
                <div className="lg:hidden">
                  <LogoWithText variant="small" />
                </div>
                <div className="hidden lg:block">
                  <LogoWithText variant="large" />
                </div>
                <div className="flex flex-col gap-3 ">
                  <h2 className="text-2xl font-eudoxusMedium font-medium tracking-[-0.019rem] text-center lg:text-2xl text-black dark:text-black">Get Early Access</h2>
                  <p className="text-sm font-eudoxusLight tracking-[-0.019rem] text-center lg:text-lg text-black dark:text-black">
                    Sign up to be notified when we launch!
                  </p>
                </div>
                <form onSubmit={handleSubmit}>
                  <div>
                    <div className="flex flex-row items-center border-2 border-bluegray py-3 pl-4 pr-4 justify-between bg-white rounded-full frame-bg-effects-blur-light gap-3">
                      <Input className="flex shadow-none leading-tight font-eudoxusLight placeholder:text-[#A1A1A1] lg:min-w-80 text-xl"
                        id="email"
                        placeholder="Enter your email"
                        type="email"
                        value={email}
                        onChange ={(e) => setEmail(e.target.value)}
                        required
                        /> 
                        <IconButton
                        className="w-4 h-4"
                        type="submit"
                        disabled={isSubmitted || isLoading}
                      >
                        <ArrowUpIcon/>
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
            </motion.div>
              
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
