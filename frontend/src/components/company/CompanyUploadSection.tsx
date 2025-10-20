import { IconUpload } from '@tabler/icons-react'

const CompanyUploadSection = () => {
    return (
        <div className="p-4 md:p-10">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                    Upload Certificate
                </h2>
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 border border-neutral-200 dark:border-neutral-700">
                    <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-12 text-center hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors cursor-pointer">
                        <IconUpload className="h-16 w-16 mx-auto mb-4 text-neutral-400" />
                        <p className="text-neutral-600 dark:text-neutral-400 mb-2 text-lg">
                            Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-500">
                            PDF, PNG, JPG up to 10MB
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CompanyUploadSection
