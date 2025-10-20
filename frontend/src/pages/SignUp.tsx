import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Loader2, Eye, EyeOff, Wallet, Download, ArrowLeft } from 'lucide-react'
import { useState, useEffect, type FormEvent } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '@/config/api'

export default function SignUpPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        walletAddress: '',
        password: '',
        confirmPassword: ''
    })

    // Check if MetaMask is installed on component mount
    useEffect(() => {
        setIsMetaMaskInstalled(typeof window.ethereum !== 'undefined')
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const connectMetaMask = async () => {
        try {
            // Check if MetaMask is installed
            if (typeof window.ethereum === 'undefined') {
                showToast('MetaMask is not installed. Please install MetaMask extension.', 'error')
                window.open('https://metamask.io/download/', '_blank')
                return
            }

            // Request account access
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            })

            if (accounts && accounts.length > 0) {
                setFormData({
                    ...formData,
                    walletAddress: accounts[0]
                })
                showToast('Wallet connected successfully!', 'success')
            }
        } catch (error: any) {
            if (error.code === 4001) {
                showToast('MetaMask connection rejected', 'error')
            } else {
                showToast('Failed to connect MetaMask', 'error')
            }
        }
    }

    const showToast = (message: string, type: 'success' | 'error') => {
        const toast = document.createElement('div')
        toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white font-medium animate-in slide-in-from-top-5 flex items-center gap-3 ${
            type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`
        
        const messageSpan = document.createElement('span')
        messageSpan.textContent = message
        
        const closeButton = document.createElement('button')
        closeButton.innerHTML = '×'
        closeButton.className = 'text-white hover:text-gray-200 text-2xl font-bold leading-none cursor-pointer'
        closeButton.onclick = () => removeToast()
        
        toast.appendChild(messageSpan)
        toast.appendChild(closeButton)
        document.body.appendChild(toast)
        
        const removeToast = () => {
            toast.classList.add('animate-out', 'slide-out-to-top-5')
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast)
                }
            }, 300)
        }
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => removeToast(), 3000)
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        
        // Validation
        if (formData.password !== formData.confirmPassword) {
            showToast('Passwords do not match', 'error')
            return
        }

        if (formData.password.length < 6) {
            showToast('Password must be at least 6 characters', 'error')
            return
        }

        if (!formData.walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            showToast('Invalid wallet address format', 'error')
            return
        }

        setLoading(true)

        try {
            const response = await axios.post(API_ENDPOINTS.UNIVERSITY_REQUESTS.SUBMIT, {
                name: formData.name,
                username: formData.username,
                email: formData.email,
                password: formData.password,
                walletAddress: formData.walletAddress
            })

            if (response.data.success) {
                showToast('Registration request submitted successfully! Existing universities will vote on your request.', 'success')
                setTimeout(() => navigate('/login'), 3000)
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Registration request failed. Please try again.'
            showToast(message, 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-zinc-950 relative">
            <Link
                to="/"
                className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
            </Link>
            <form
                onSubmit={handleSubmit}
                className="bg-card m-auto h-fit w-full max-w-4xl rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md">
                <div className="p-8 pb-6">
                    <div>
                        <Link
                            to="/"
                            aria-label="go home"
                            className="flex items-center gap-2">
                            <GraduationCap className="h-8 w-8 text-primary" />
                            <span className="text-xl font-bold">EduVerify</span>
                        </Link>
                        <h1 className="mb-1 mt-6 text-2xl font-semibold">Request Institution Registration</h1>
                        <p className="text-sm text-muted-foreground">Submit a registration request. Existing universities will vote to approve your institution.</p>
                    </div>

                    <div className="mt-6 grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="block text-sm font-medium">
                                    University/College Name *
                                </Label>
                                <Input
                                    type="text"
                                    required
                                    name="name"
                                    id="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter institution name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="username" className="block text-sm font-medium">
                                    Username *
                                </Label>
                                <Input
                                    type="text"
                                    required
                                    name="username"
                                    id="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Choose a username"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="block text-sm font-medium">
                                    Official Email *
                                </Label>
                                <Input
                                    type="email"
                                    required
                                    name="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="admin@university.edu"
                                />
                            </div>

                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="walletAddress" className="block text-sm font-medium">
                                    MetaMask Wallet Address *
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        required
                                        name="walletAddress"
                                        id="walletAddress"
                                        value={formData.walletAddress}
                                        onChange={handleChange}
                                        placeholder="0x..."
                                        className="flex-1"
                                    />
                                    {isMetaMaskInstalled ? (
                                        <Button
                                            type="button"
                                            onClick={connectMetaMask}
                                            variant="outline"
                                            className="shrink-0">
                                            <Wallet className="h-4 w-4 mr-2" />
                                            Connect
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={() => window.open('https://metamask.io/download/', '_blank')}
                                            variant="outline"
                                            className="shrink-0 text-orange-600 border-orange-600 hover:bg-orange-50">
                                            <Download className="h-4 w-4 mr-2" />
                                            Install
                                        </Button>
                                    )}
                                </div>
                                {!isMetaMaskInstalled && (
                                    <p className="text-xs text-orange-600 mt-1">
                                        MetaMask extension not detected. Click "Install" to download.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    Password *
                                </Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        name="password"
                                        id="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Create a strong password"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                                    Confirm Password *
                                </Label>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        name="confirmPassword"
                                        id="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Re-enter password"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <Button className="w-full" type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Registering...
                                    </>
                                ) : (
                                    'Request Registration'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="bg-muted rounded-[calc(var(--radius))] border-t p-4">
                    <p className="text-accent-foreground text-center text-sm">
                        Already have an account?
                        <Button
                            asChild
                            variant="link"
                            className="px-2">
                            <Link to="/login">Sign In</Link>
                        </Button>
                    </p>
                </div>
            </form>
        </section>
    )
}
