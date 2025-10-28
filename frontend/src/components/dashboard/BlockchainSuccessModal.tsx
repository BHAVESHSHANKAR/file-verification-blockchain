import { Check, Copy, ExternalLink, X } from 'lucide-react';
import { useState } from 'react';

interface BlockchainSuccessModalProps {
    visible: boolean;
    onClose: () => void;
    txHash: string;
    certificateName: string;
    network?: 'polygon' | 'sepolia';
}

export default function BlockchainSuccessModal({
    visible,
    onClose,
    txHash,
    certificateName,
    network = 'polygon'
}: BlockchainSuccessModalProps) {
    const [txCopied, setTxCopied] = useState(false);

    const handleCopyTx = () => {
        navigator.clipboard.writeText(txHash);
        setTxCopied(true);
        setTimeout(() => setTxCopied(false), 2000);
    };

    // Network-specific configuration
    const networkConfig = {
        polygon: {
            name: 'Polygon Amoy',
            explorerUrl: `https://amoy.polygonscan.com/tx/${txHash}`,
            explorerName: 'Polygon Scan'
        },
        sepolia: {
            name: 'Sepolia',
            explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
            explorerName: 'Etherscan'
        }
    };

    const config = networkConfig[network];
    const explorerUrl = config.explorerUrl;

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-black dark:border-white">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b-2 border-black dark:border-white">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full border-2 border-black dark:border-white flex items-center justify-center">
                            <Check className="h-6 w-6 text-black dark:text-white" />
                        </div>
                        <span className="text-xl font-bold text-black dark:text-white">Blockchain Success</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Success Message */}
                    <div className="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-lg border-2 border-black dark:border-white">
                        <h4 className="font-bold text-black dark:text-white mb-3 text-lg">
                            Certificate Registered on {config.name}
                        </h4>
                        <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                            <strong className="text-black dark:text-white">{certificateName}</strong> has been successfully recorded on the {config.name} blockchain.
                        </p>

                        {/* Transaction Hash */}
                        <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border-2 border-black dark:border-white mb-4">
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2 font-semibold uppercase tracking-wider">Transaction Hash</p>
                            <div className="flex items-center space-x-2">
                                <code className="flex-1 font-mono text-sm break-all text-black dark:text-white">
                                    {txHash}
                                </code>
                                <button
                                    onClick={handleCopyTx}
                                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors border border-black dark:border-white"
                                    title="Copy to clipboard"
                                >
                                    {txCopied ? (
                                        <Check className="h-5 w-5 text-black dark:text-white" />
                                    ) : (
                                        <Copy className="h-5 w-5 text-black dark:text-white" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* View on Explorer */}
                        <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-black dark:text-white hover:underline font-semibold"
                        >
                            <ExternalLink className="h-4 w-4" />
                            View on {config.explorerName}
                        </a>
                    </div>

                    {/* Info Box */}
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border-2 border-black dark:border-white">
                        <h4 className="font-bold text-black dark:text-white mb-3">What This Means</h4>
                        <ul className="space-y-2 text-neutral-700 dark:text-neutral-300">
                            <li className="flex items-start gap-2">
                                <span className="text-black dark:text-white font-bold">•</span>
                                <span>Certificate is permanently recorded on the blockchain</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-black dark:text-white font-bold">•</span>
                                <span>Cannot be altered or deleted</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-black dark:text-white font-bold">•</span>
                                <span>Anyone can verify its authenticity</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-black dark:text-white font-bold">•</span>
                                <span>Timestamp proves when it was issued</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t-2 border-black dark:border-white">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity font-bold"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
