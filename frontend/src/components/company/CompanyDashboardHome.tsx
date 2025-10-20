import { IconSearch, IconFileCheck } from '@tabler/icons-react'

export default function CompanyDashboardHome() {
    return (
        <div className="p-4 md:p-10">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-8">
                    Company Dashboard
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                            Welcome
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                            Verify educational credentials securely
                        </p>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
                        <IconSearch className="h-8 w-8 text-neutral-700 dark:text-neutral-300 mb-3" />
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                            Search Credentials
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                            Find student credentials quickly
                        </p>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
                        <IconFileCheck className="h-8 w-8 text-neutral-700 dark:text-neutral-300 mb-3" />
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                            Verify Credentials
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                            Check authenticity of certificates
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
