import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Upload, CheckCircle, Search, Network } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { BorderBeam } from '@/components/ui/border-beam'

export default function HowItWorks() {
    type ImageKey = 'item-1' | 'item-2' | 'item-3' | 'item-4'
    const [activeItem, setActiveItem] = useState<ImageKey>('item-1')
    const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()

                // Check if mouse is within the container
                const isInside = e.clientX >= rect.left &&
                    e.clientX <= rect.right &&
                    e.clientY >= rect.top &&
                    e.clientY <= rect.bottom

                if (isInside) {
                    const centerX = rect.left + rect.width / 2
                    const centerY = rect.top + rect.height / 2

                    const deltaX = e.clientX - centerX
                    const deltaY = e.clientY - centerY

                    // Calculate movement with more range
                    const maxMove = 15
                    const moveX = (deltaX / rect.width) * maxMove * 2
                    const moveY = (deltaY / rect.height) * maxMove * 2

                    setEyePosition({
                        x: Math.max(-maxMove, Math.min(maxMove, moveX)),
                        y: Math.max(-maxMove, Math.min(maxMove, moveY))
                    })
                } else {
                    // Reset to center when mouse leaves
                    setEyePosition({ x: 0, y: 0 })
                }
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    const images = {
        'item-1': {
            image: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
            alt: 'Connect Wallet',
            showTracking: true,
        },
        'item-2': {
            image: 'https://cdn-icons-png.flaticon.com/512/1092/1092003.png',
            alt: 'Upload Certificate',
            showTracking: false,
        },
        'item-3': {
            image: 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png',
            alt: 'Blockchain Verification',
            showTracking: false,
        },
        'item-4': {
            image: 'https://cdn-icons-png.flaticon.com/512/1087/1087815.png',
            alt: 'Instant Results',
            showTracking: false,
        },
    }

    return (
        <section id="how-it-works" className="py-12 md:py-20 lg:py-32">
            <div className="bg-linear-to-b absolute inset-0 -z-10 sm:inset-6 sm:rounded-b-3xl dark:block dark:to-[color-mix(in_oklab,var(--color-zinc-900)_75%,var(--color-background))]"></div>
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16 lg:space-y-20 dark:[--color-border:color-mix(in_oklab,var(--color-white)_10%,transparent)]">
                <div className="relative z-10 mx-auto max-w-2xl space-y-6 text-center">
                    <h2 className="text-balance text-4xl font-semibold lg:text-6xl">How It Works</h2>
                    <p className="text-lg text-muted-foreground">Simple and secure process to verify educational certificates using blockchain technology and MetaMask wallet integration.</p>
                </div>

                <div className="grid gap-12 sm:px-12 md:grid-cols-2 lg:gap-20 lg:px-0">
                    <Accordion
                        type="single"
                        value={activeItem}
                        onValueChange={(value) => setActiveItem(value as ImageKey)}
                        className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>
                                <div className="flex items-center gap-3 text-lg">
                                    <Network className="size-5" />
                                    1. Connect MetaMask Wallet
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-base">Connect your MetaMask wallet to authenticate with the EduVerify platform. This ensures secure access to the blockchain network and enables certificate verification.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>
                                <div className="flex items-center gap-3 text-lg">
                                    <Upload className="size-5" />
                                    2. Upload Certificate
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-base">Universities upload certificates to IPFS, generating a unique Content Identifier (CID). A SHA-512 hash is computed and stored on Polygon Layer 2 blockchain.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>
                                <div className="flex items-center gap-3 text-lg">
                                    <Search className="size-5" />
                                    3. Bloom Filter Check
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-base">The system performs a quick pre-check using Bloom filter to determine if the certificate may exist, then verifies the hash on blockchain to eliminate false positives.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger>
                                <div className="flex items-center gap-3 text-lg">
                                    <CheckCircle className="size-5" />
                                    4. Company Verification
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-base">Companies and employers can instantly verify the authenticity of educational credentials with tamper-proof blockchain verification in real-time.</AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <div className="bg-background relative flex overflow-hidden rounded-3xl border p-2">
                        <div className="w-15 absolute inset-0 right-0 ml-auto border-l bg-[repeating-linear-gradient(-45deg,var(--color-border),var(--color-border)_1px,transparent_1px,transparent_8px)]"></div>
                        <div className="aspect-76/59 bg-background relative w-[calc(3/4*100%+3rem)] rounded-2xl">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`${activeItem}-id`}
                                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                    transition={{ duration: 0.2 }}
                                    className="size-full overflow-hidden rounded-2xl border bg-zinc-900 shadow-md"
                                    ref={containerRef}>
                                    <div className="size-full flex items-center justify-center bg-white relative">
                                        <img
                                            src={images[activeItem].image}
                                            className="w-2/3 h-2/3 object-contain"
                                            alt={images[activeItem].alt}
                                            style={images[activeItem].showTracking ? {
                                                transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                                                transition: 'transform 0.1s ease-out'
                                            } : {}}
                                        />
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <BorderBeam
                            duration={6}
                            size={200}
                            className="from-transparent via-yellow-700 to-transparent dark:via-white/50"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
