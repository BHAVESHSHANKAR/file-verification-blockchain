import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { ArrowRight, Menu, X, Building2, LogIn, UserPlus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import heroImage from '@/assets/images/heso section image.jpg'

const menuItems = [
    { name: 'Home', to: '#home' },
    { name: 'Features', to: '#features' },
    { name: 'How It Works', to: '#how-it-works' },
    { name: 'About', to: '#about' },
]

export default function HeroSection() {
    const [menuState, setMenuState] = useState(false)
    const [showCompanyModal, setShowCompanyModal] = useState(false)
    const navigate = useNavigate()

    return (
        <>
            <header>
                <nav
                    data-state={menuState && 'active'}
                    className="fixed top-0 z-20 w-full border-b border-dashed bg-white/95 backdrop-blur dark:bg-zinc-950/95">
                    <div className="m-auto max-w-5xl px-6">
                        <div className="flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                            <div className="flex w-full justify-between lg:w-auto">
                                <Link
                                    to="/"
                                    aria-label="home"
                                    className="flex items-center space-x-2">
                                    <Logo />
                                </Link>

                                <button
                                    onClick={() => setMenuState(!menuState)}
                                    aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                    className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                    <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                    <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                                </button>
                            </div>

                            <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                                <div className="lg:pr-4">
                                    <ul className="space-y-6 text-base lg:flex lg:gap-8 lg:space-y-0 lg:text-sm">
                                        {menuItems.map((item, index) => (
                                            <li key={index}>
                                                <a
                                                    href={item.to}
                                                    className="text-muted-foreground hover:text-accent-foreground block duration-150"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        const element = document.querySelector(item.to)
                                                        element?.scrollIntoView({ behavior: 'smooth' })
                                                    }}>
                                                    <span>{item.name}</span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit lg:border-l lg:pl-6">
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm">
                                        <Link to="/login">
                                            <span>Login</span>
                                        </Link>
                                    </Button>

                                    <Button
                                        asChild
                                        size="sm">
                                        <Link to="/signup">
                                            <span>Request your university</span>
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            </header>

            <main className="pt-16">
                <section id="home" className="overflow-hidden">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 lg:py-8">
                        <div className="lg:flex lg:items-center lg:gap-12">
                            <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start px-4 lg:px-0">
                                <button
                                    onClick={() => setShowCompanyModal(true)}
                                    className="rounded-(--radius) flex w-fit items-center gap-2 border p-1 pr-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                                    <span className="bg-muted rounded-[calc(var(--radius)-0.25rem)] px-2 py-1">
                                        <Building2 className="size-4 text-blue-600" />
                                    </span>
                                    <span className="text-sm">Organization Verification</span>
                                    <span className="bg-(--color-border) block h-4 w-px"></span>

                                    <ArrowRight className="size-4" />
                                </button>

                                <h1 className="mt-10 text-balance text-3xl sm:text-4xl font-bold md:text-5xl xl:text-5xl text-center lg:text-left max-w-xl">Secure & Transparent Educational Credential Verification</h1>
                                <p className="mt-8 text-center lg:text-left max-w-xl text-base sm:text-lg">EduVerify leverages blockchain technology to provide tamper-proof verification of educational credentials, ensuring authenticity and trust in academic achievements.</p>

                                <div className="w-full max-w-xl flex flex-col items-center lg:items-start mt-10 lg:mt-12">
                                    <ul className="list-inside list-disc space-y-2 text-center lg:text-left text-base sm:text-lg">
                                        <li>Instant Verification</li>
                                        <li>Blockchain Secured</li>
                                        <li>100% Tamper-Proof</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-12 lg:mt-0 lg:w-1/2 flex justify-center lg:justify-start px-4 lg:px-0">
                                <div className="relative rounded-3xl p-3 w-full max-w-sm sm:max-w-md lg:max-w-none">
                                    <img
                                        className="w-full h-auto rounded-2xl"
                                        src={heroImage}
                                        alt="app illustration"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Company Login/Signup Modal */}
            {showCompanyModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowCompanyModal(false)}
                >
                    <div
                        className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl max-w-md w-full p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                Company Portal
                            </h2>
                            <button
                                onClick={() => setShowCompanyModal(false)}
                                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                            Access the company verification portal to verify educational credentials of your employees.
                        </p>

                        <div className="space-y-4">
                            <Button
                                onClick={() => {
                                    setShowCompanyModal(false)
                                    navigate('/company/login')
                                }}
                                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-6 text-lg"
                            >
                                <LogIn className="h-5 w-5 mr-2" />
                                Login to Company Account
                            </Button>

                            <Button
                                onClick={() => {
                                    setShowCompanyModal(false)
                                    navigate('/company/signup')
                                }}
                                variant="outline"
                                className="w-full py-6 text-lg border-neutral-900 text-neutral-900 hover:bg-neutral-100 dark:border-neutral-100 dark:text-neutral-100"
                            >
                                <UserPlus className="h-5 w-5 mr-2" />
                                Create Company Account
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
