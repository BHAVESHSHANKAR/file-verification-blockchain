import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '@/config/api'

export default function LoginPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
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
        
        if (!formData.email || !formData.password) {
            showToast('Please fill in all fields', 'error')
            return
        }

        setLoading(true)

        try {
            const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, {
                email: formData.email,
                password: formData.password
            })

            if (response.data.success) {
                showToast('Login successful! Welcome back.', 'success')
                localStorage.setItem('token', response.data.token)
                localStorage.setItem('university', JSON.stringify(response.data.data))
                setTimeout(() => navigate('/college-dashboard'), 1500)
            }
        } catch (error: any) {
            let message = 'Login failed. Please try again.'
            
            if (error.response?.status === 401) {
                message = 'Invalid email or password'
            } else if (error.response?.status === 403) {
                message = error.response.data.message || 'Account suspended'
            } else if (error.response?.data?.message) {
                message = error.response.data.message
            }
            
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
                className="bg-card m-auto h-fit w-full max-w-md rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md">
                <div className="p-8 pb-6">
                    <div>
                        <Link
                            to="/"
                            aria-label="go home"
                            className="flex items-center gap-2">
                            <GraduationCap className="h-8 w-8 text-primary" />
                            <span className="text-xl font-bold">EduVerify</span>
                        </Link>
                        <h1 className="mb-1 mt-6 text-2xl font-semibold">Welcome Back</h1>
                        <p className="text-sm text-muted-foreground">Sign in to your college admin account</p>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="block text-sm font-medium">
                                Email Address
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

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    name="password"
                                    id="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
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

                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </div>
                </div>

                <div className="bg-muted rounded-[calc(var(--radius))] border-t p-4">
                    <p className="text-accent-foreground text-center text-sm">
                        Don't have an account?
                        <Button
                            asChild
                            variant="link"
                            className="px-2">
                            <Link to="/signup">Register Institution</Link>
                        </Button>
                    </p>
                </div>
            </form>
        </section>
    )
}
