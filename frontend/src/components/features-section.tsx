import { Card, CardContent } from '@/components/ui/card'
import { Shield, Lock, FileCheck, Users, Clock, Globe } from 'lucide-react'

const features = [
    {
        icon: Shield,
        title: 'Blockchain Security',
        description: 'Immutable records stored on blockchain ensure credentials cannot be tampered with or forged.'
    },
    {
        icon: FileCheck,
        title: 'Instant Verification',
        description: 'Verify educational credentials in seconds, not days. No more waiting for manual verification.'
    },
    {
        icon: Lock,
        title: 'Privacy Protected',
        description: 'Students control their data. Share credentials securely without exposing sensitive information.'
    },
    {
        icon: Users,
        title: 'Multi-Stakeholder',
        description: 'Connect institutions, students, and employers in a trusted verification ecosystem.'
    },
    {
        icon: Clock,
        title: 'Lifetime Access',
        description: 'Credentials remain accessible forever, even if institutions close or systems change.'
    },
    {
        icon: Globe,
        title: 'Global Standard',
        description: 'Internationally recognized verification system accepted by employers worldwide.'
    }
]

export default function FeaturesSection() {
    return (
        <section className="bg-gray-50 py-16 md:py-24 dark:bg-zinc-900/50">
            <div className="mx-auto max-w-7xl px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold md:text-4xl">Why Choose EduVerify?</h2>
                    <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                        Revolutionizing educational credential verification with blockchain technology
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                            <feature.icon className="h-6 w-6 text-primary" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}
