/**
 * Generate SHA-512 hash from a file
 * @param file - File to hash
 * @returns Promise with hex string of the hash
 */
export async function generateFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-512', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
}

/**
 * Verify if a file hash matches any certificate in the list
 * @param fileHash - Hash of the uploaded file
 * @param certificates - Array of student certificates
 * @returns Matched certificate or null
 */
export function findMatchingCertificate(fileHash: string, certificates: any[]): any | null {
    return certificates.find(cert => cert.fileHash === fileHash) || null
}
