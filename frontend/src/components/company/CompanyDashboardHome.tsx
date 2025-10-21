import { IconSearch, IconFileCheck, IconShieldCheck, IconClock } from '@tabler/icons-react'
import { Shield, CheckCircle, FileText, TrendingUp } from 'lucide-react'

export default function CompanyDashboardHome() {
    return (
        <div className="p-4 sm:p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 dark:text-neutral-100">
                        Company Dashboard
                    </h1>
                    <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-2">
                        Verify and manage educational credentials with blockchain security
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <ActionCard
                        icon={<IconSearch className="h-6 w-6 sm:h-8 sm:w-8" />}
                        title="Search Credentials"
                        description="Find student credentials quickly by registration number or name"
                        color="blue"
                    />
                    <ActionCard
                        icon={<IconFileCheck className="h-6 w-6 sm:h-8 sm:w-8" />}
                        title="Verify Credentials"
                        description="Check authenticity of certificates using blockchain verification"
                        color="green"
                    />
                    <ActionCard
                        icon={<IconShieldCheck className="h-6 w-6 sm:h-8 sm:w-8" />}
                        title="Verified Records"
                        description="View all previously verified student credentials"
                        color="purple"
                    />
                </div>

                {/* How It Works */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 sm:p-6 md:p-8 border border-neutral-200 dark:border-neutral-700 mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-4 sm:mb-6">
                        How Verification Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <StepCard
                            step="1"
                            title="Search Student"
                            description="Enter student's registration number or name to find their credentials in the system"
                            icon={<IconSearch className="h-5 w-5" />}
                        />
                        <StepCard
                            step="2"
                            title="View Certificates"
                            description="Browse all certificates issued to the student by verified universities"
                            icon={<FileText className="h-5 w-5" />}
                        />
                        <StepCard
                            step="3"
                            title="Blockchain Verification"
                            description="Each certificate is verified against blockchain records for authenticity"
                            icon={<Shield className="h-5 w-5" />}
                        />
                        <StepCard
                            step="4"
                            title="Mark as Verified"
                            description="Save verified credentials to your company records for future reference"
                            icon={<CheckCircle className="h-5 w-5" />}
                        />
                    </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <FeatureCard
                        icon={<Shield className="h-5 w-5 sm:h-6 sm:w-6" />}
                        title="Blockchain Secured"
                        description="All certificates verified on Polygon blockchain"
                    />
                    <FeatureCard
                        icon={<IconClock className="h-5 w-5 sm:h-6 sm:w-6" />}
                        title="Instant Verification"
                        description="Get results in seconds, not days"
                    />
                    <FeatureCard
                        icon={<CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
                        title="100% Authentic"
                        description="Tamper-proof verification system"
                    />
                    <FeatureCard
                        icon={<TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />}
                        title="Track History"
                        description="Maintain records of all verifications"
                    />
                </div>
            </div>
        </div>
    )
}

const ActionCard = ({ icon, title, description, color }: {
    icon: React.ReactNode
    title: string
    description: string
    color: 'blue' | 'green' | 'purple'
}) => {
    const colorClasses = {
        blue: 'text-blue-600 dark:text-blue-400',
        green: 'text-green-600 dark:text-green-400',
        purple: 'text-purple-600 dark:text-purple-400'
    }

    return (
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
            <div className={`${colorClasses[color]} mb-3`}>
                {icon}
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                {title}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                {description}
            </p>
        </div>
    )
}

const StepCard = ({ step, title, description, icon }: {
    step: string
    title: string
    description: string
    icon: React.ReactNode
}) => {
    return (
        <div className="flex gap-3 sm:gap-4">
            <div className="shrink-0">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm sm:text-base">
                    {step}
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <div className="text-neutral-700 dark:text-neutral-300">
                        {icon}
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-neutral-800 dark:text-neutral-100">
                        {title}
                    </h3>
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    {description}
                </p>
            </div>
        </div>
    )
}

const FeatureCard = ({ icon, title, description }: {
    icon: React.ReactNode
    title: string
    description: string
}) => {
    return (
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
            <div className="text-neutral-800 dark:text-neutral-200 mb-2 sm:mb-3">
                {icon}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-neutral-800 dark:text-neutral-100 mb-1 sm:mb-2">
                {title}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {description}
            </p>
        </div>
    )
}
