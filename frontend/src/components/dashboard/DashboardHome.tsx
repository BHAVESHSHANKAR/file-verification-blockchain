import { Upload, Hash, Database, Shield, Lock, Zap, Globe } from 'lucide-react'
import Lottie from 'lottie-react'
import loadingFilesAnimation from '@/assets/animations/Loading Files.json'

export default function DashboardHome() {
    return (
        <div className="p-4 sm:p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 dark:text-neutral-100">
                        How EduVerify Works
                    </h1>
                    <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-2">
                        Secure, transparent, and tamper-proof certificate verification using blockchain technology
                    </p>
                </div>

                {/* Process Flow */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <ProcessCard
                        step="1"
                        title="Upload Certificate"
                        description="University admin uploads student certificate (PDF/Image) with student details including name, degree, graduation date, and other credentials."
                        icon={<Upload className="h-8 w-8" />}
                    />
                    <ProcessCard
                        step="2"
                        title="Generate SHA-512 Hash"
                        description="System generates a unique SHA-512 cryptographic hash of the certificate file. This hash acts as a digital fingerprint that cannot be reversed or duplicated."
                        icon={<Hash className="h-8 w-8" />}
                    />
                    <ProcessCard
                        step="3"
                        title="Store on IPFS"
                        description="Certificate is uploaded to IPFS (InterPlanetary File System) for decentralized storage. Returns a unique IPFS hash (CID) for permanent, distributed access."
                        icon={<Database className="h-8 w-8" />}
                    />
                    <ProcessCard
                        step="4"
                        title="Record on Blockchain"
                        description="Certificate hash and metadata are recorded on Polygon blockchain as an immutable transaction. Creates a permanent, tamper-proof record with transaction hash."
                        icon={<Shield className="h-8 w-8" />}
                    />
                </div>

                {/* Lottie Animation */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                    <div className="w-full max-w-2xl">
                        <Lottie
                            animationData={loadingFilesAnimation}
                            loop={true}
                            className="w-full h-auto"
                        />
                    </div>
                </div>

                {/* Key Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    <FeatureCard
                        icon={<Lock className="h-6 w-6" />}
                        title="Tamper-Proof"
                        description="Once recorded on blockchain, certificates cannot be altered or deleted"
                    />
                    <FeatureCard
                        icon={<Zap className="h-6 w-6" />}
                        title="Fast Verification"
                        description="Bloom filters enable instant pre-verification before blockchain lookup"
                    />
                    <FeatureCard
                        icon={<Globe className="h-6 w-6" />}
                        title="Decentralized"
                        description="IPFS storage ensures certificates are accessible globally without central server"
                    />
                </div>
            </div>
        </div>
    )
}

const ProcessCard = ({ step, title, description, icon }: {
    step: string
    title: string
    description: string
    icon: React.ReactNode
}) => {
    return (
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-3 sm:gap-4">
                <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 p-2 sm:p-3 rounded-lg shrink-0">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">STEP {step}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-2">
                        {title}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {description}
                    </p>
                </div>
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
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700">
            <div className="text-neutral-800 dark:text-neutral-200 mb-3 sm:mb-4">
                {icon}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-2">
                {title}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                {description}
            </p>
        </div>
    )
}
