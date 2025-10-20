import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Building2, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'

export default function CompanyLogin() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

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

        if (!formData.email || !formData.password) {
            showToast('Please fill in all fields', 'error')
            return
        }

        setLoading(true)

        try {
            const response = await axios.post('http://localhost:5000/api/company/login', formData)
            
            if (response.data.success) {
                showToast('Login successful! Welcome back.', 'success')
                localStorage.setItem('companyToken', response.data.token)
                localStorage.setItem('company', JSON.stringify(response.data.data))
                setTimeout(() => {
                    navigate('/company/dashboard')
                }, 1000)
            }
        } catch (err: any) {
            const message = err.response?.data?.message || 'Login failed. Please try again.'
            setError(message)
            showToast(message, 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:from-neutral-900 dark:to-neutral-800 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8">
                    <div className="flex justify-center mb-6">
                        <div className="h-16 w-16 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-neutral-900 dark:text-neutral-100" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-center text-neutral-900 dark:text-neutral-100 mb-2">
                        Company Login
                    </h1>
                    <p className="text-center text-neutral-600 dark:text-neutral-400 mb-8">
                        Access your company verification portal
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
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
                                    className="w-full pl-10 pr-12 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                                    placeholder="Enter your password"
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

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Don't have an account?{' '}
                            <Link to="/company/signup" className="text-neutral-900 hover:text-neutral-700 dark:text-neutral-100 dark:hover:text-neutral-300 font-medium underline">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    <div className="mt-4 text-center">
                        <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
