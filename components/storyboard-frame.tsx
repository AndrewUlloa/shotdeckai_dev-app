"use client"

import React, { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { motion, AnimatePresence } from "framer-motion"
// import { ChevronUp } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Textarea } from "@/components/ui/textarea"
// import { Label } from "@/components/ui/label"
// import Image from 'next/image'
interface ShotDescription {
  type: string
  cameraMovement: string
  angle: string
}

interface StoryboardFrameProps {
  sceneNumber: number
  shotNumber: number
  shotDescription: ShotDescription
  actionDescription: string
  dialogue: string
  soundEffects: string
  music: string
  lighting: string
  mood: string
  composition: string
  specialEffects: string
  timing: string
  characterNotes: string
  environmentNotes: string
  costumeAndProps: string
  cinematographicStyle: string
  postProductionNotes: string
  imageUrl: string
}

const defaultProps: StoryboardFrameProps = {
  sceneNumber: 1,
  shotNumber: 1,
  shotDescription: {
    type: 'Not specified',
    cameraMovement: 'Not specified',
    angle: 'Not specified'
  },
  actionDescription: 'Not specified',
  dialogue: 'Not specified',
  soundEffects: 'Not specified',
  music: 'Not specified',
  lighting: 'Not specified',
  mood: 'Not specified',
  composition: 'Not specified',
  specialEffects: 'Not specified',
  timing: 'Not specified',
  characterNotes: 'Not specified',
  environmentNotes: 'Not specified',
  costumeAndProps: 'Not specified',
  cinematographicStyle: 'Not specified',
  postProductionNotes: 'Not specified',
  imageUrl: '/favicon.ico?height=300&width=400'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function StoryboardFrameComponent(props: Partial<StoryboardFrameProps>) {
  const [frameData, setFrameData] = useState<StoryboardFrameProps>({ ...defaultProps, ...props })
  // const [activeSection, setActiveSection] = useState<string>('shot')
  // const [isOpen, setIsOpen] = useState(false)
  // const [direction, setDirection] = useState(0)

  // const menuItems = [
  //   { key: 'shot', label: 'Shot Details' },
  //   { key: 'audio', label: 'Audio' },
  //   { key: 'visual', label: 'Visual' }
  // ]

  // const toggleOpen = (section: string) => {
  //   if (activeSection === section && isOpen) {
  //     setIsOpen(false)
  //   } else {
  //     const newDirection = menuItems.findIndex(item => item.key === section) - 
  //                          menuItems.findIndex(item => item.key === activeSection)
  //     setDirection(newDirection)
  //     setActiveSection(section)
  //     setIsOpen(true)
  //   }
  // }

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  //   const { name, value } = e.target
  //   setFrameData(prev => ({
  //     ...prev,
  //     [name]: value
  //   }))
  // }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleShotDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFrameData(prev => ({
      ...prev,
      shotDescription: {
        ...prev.shotDescription,
        [name]: value
      }
    }))
  }

  // const variants = {
  //   enter: (direction: number) => ({
  //     x: direction > 0 ? 1000 : -1000,
  //     opacity: 0
  //   }),
  //   center: {
  //     zIndex: 1,
  //     x: 0,
  //     opacity: 1
  //   },
  //   exit: (direction: number) => ({
  //     zIndex: 0,
  //     x: direction < 0 ? 1000 : -1000,
  //     opacity: 0
  //   })
  // }

  // const renderEditableField = (label: string, name: string, value: string, multiline: boolean = false) => (
  //   <div className="space-y-2 mb-4">
  //     <Label htmlFor={name} className="text-sm font-medium">{label}</Label>
  //     {multiline ? (
  //       <Textarea
  //         id={name}
  //         name={name}
  //         value={value}
  //         onChange={handleInputChange}
  //         className="w-full min-h-[100px]"
  //       />
  //     ) : (
  //       <Input
  //         type="text"
  //         id={name}
  //         name={name}
  //         value={value}
  //         onChange={handleInputChange}
  //         className="w-full"
  //       />
  //     )}
  //   </div>
  // )

  return (
    <Card className="w-full max-w-3xl mx-auto frame-bg-effects-blur-light">
      <CardContent className="p-[10px] ">
        <div className="aspect-[4/3] w-full overflow-hidden border-white/50 bg-white/30 rounded-lg">
          <div className="relative w-full h-full">
            {/* {frameData.imageUrl ? (
              <Image 
                src={frameData.imageUrl}
                alt={`Storyboard frame for Scene ${frameData.sceneNumber}, Shot ${frameData.shotNumber}`} 
                className="w-full h-full object-cover"
                width={300}
                height={225}
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <div className="text-gray-400 text-sm font-medium flex flex-col items-center">
                  <Image 
                    src="/favicon.ico"
                    alt="No image available"
                    className="w-2 h-2"
                    width={32}
                    height={32}
                  />
                  No image available
                </div>
              </div>
            )} */}
          </div>
        </div>
    
        
        {/* <div className="space-y-3">
          <div className="flex rounded-lg overflow-hidden border bg-white/20 border-white/50">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => toggleOpen(item.key)}
                className={`flex-1 py-1 px-1 text-sm font-semibold transition-colors duration-200 flex items-center justify-center ${
                  activeSection === item.key && isOpen
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {item.label}
                <ChevronUp className={`ml-2 h-4 w-4 transition-transform duration-200 ${
                  activeSection === item.key && isOpen ? 'transform rotate-180' : ''
                }`} />
              </button>
            ))}
          </div> */}

        {/* <AnimatePresence initial={false} custom={direction}>
          {isOpen && (
            <motion.div
              key="content"
              initial="collapsed"
              animate="open"
              exit="collapsed"
              variants={{
                open: { opacity: 1, height: 'auto' },
                collapsed: { opacity: 0, height: 0 }
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative h-[400px] w-full overflow-hidden rounded-lg border-white/50 border">
                <AnimatePresence initial={false} custom={direction}>
                  <motion.div
                    key={activeSection}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { ease: [0.455, 0.03, 0.515, 0.955], duration: 0.50},
                      opacity: { duration: 0.2 }
                    }}
                    className="absolute w-full h-full"
                  >
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence> */}
      </CardContent>
    </Card>
  )
}