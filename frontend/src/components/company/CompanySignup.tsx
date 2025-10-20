import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Building2, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'

export default function CompanySignup() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        companyName: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
        
        setTimeout(() => removeToast(), 3000)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!formData.companyName || !formData.email || !formData.password || !formData.confirmPassword) {
            showToast('Please fill in all fields', 'error')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            const message = 'Passwords do not match'
            setError(message)
            showToast(message, 'error')
            return
        }

        if (formData.password.length < 6) {
            const message = 'Password must be at least 6 characters'
            setError(message)
            showToast(message, 'error')
            return
        }

        setLoading(true)

        try {
            const response = await axios.post('http://localhost:5000/api/company/signup', {
                companyName: formData.companyName,
                email: formData.email,
                password: formData.password
            })
            
            if (response.data.success) {
                showToast('Account created successfully! Redirecting to login...', 'success')
                setTimeout(() => {
                    navigate('/company/login')
                }, 1500)
            }
        } catch (err: any) {
            const message = err.response?.data?.message || 'Signup failed. Please try again.'
            setError(message)
            showToast(message, 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:from-neutral-900 dark:to-neutral-800 p-4">
            <div className="w-full max-w-2xl">
                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8">
                    <div className="flex justify-center mb-4">
                        <div className="h-14 w-14 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                            <Building2 className="h-7 w-7 text-neutral-900 dark:text-neutral-100" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-center text-neutral-900 dark:text-neutral-100 mb-2">
                        Company Registration
                    </h1>
                    <p className="text-center text-neutral-600 dark:text-neutral-400 mb-6">
                        Register your company for credential verification
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Company Name
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                                        placeholder="Acme Corporation"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                                        placeholder="company@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-10 pr-12 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                                        placeholder="Create a password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full pl-10 pr-12 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                                        placeholder="Confirm your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-2.5 mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>

                    <div className="mt-4 text-center">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Already have an account?{' '}
                            <Link to="/company/login" className="text-neutral-900 hover:text-neutral-700 dark:text-neutral-100 dark:hover:text-neutral-300 font-medium underline">
                                Login
                            </Link>
                        </p>
                    </div>

                    <div className="mt-3 text-center">
                        <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
