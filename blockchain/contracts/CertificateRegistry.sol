// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificateRegistry {
    struct Certificate {
        string studentName;
        string registrationNumber;
        string fileName;
        string ipfsUrl;
        string fileHash; // SHA-512 hash
        address universityAddress;
        uint256 timestamp;
        bool exists;
        bool isRevoked;
        string revocationReason;
        uint256 revocationTimestamp;
        string replacementCertificateHash;
    }

    // Mapping from certificate hash to Certificate
    mapping(string => Certificate) public certificates;
    
    // Mapping from university address to their certificate hashes
    mapping(address => string[]) public universityCertificates;
    
    // Array of all certificate hashes
    string[] public allCertificateHashes;

    // Events
    event CertificateRegistered(
        string indexed fileHash,
        string studentName,
        string registrationNumber,
        address indexed universityAddress,
        uint256 timestamp
    );

    event CertificateVerified(
        string indexed fileHash,
        bool exists,
        uint256 timestamp
    );

    event CertificateRevoked(
        string indexed fileHash,
        string reason,
        string replacementCertificateHash,
        address indexed revokedBy,
        uint256 timestamp
    );

    /**
     * @dev Register a new certificate on the blockchain
     * @param _studentName Name of the student
     * @param _registrationNumber Student's registration number
     * @param _fileName Name of the certificate file
     * @param _ipfsUrl IPFS URL where certificate is stored
     * @param _fileHash SHA-512 hash of the certificate file
     */
    function registerCertificate(
        string memory _studentName,
        string memory _registrationNumber,
        string memory _fileName,
        string memory _ipfsUrl,
        string memory _fileHash
    ) public returns (bool) {
        require(bytes(_studentName).length > 0, "Student name cannot be empty");
        require(bytes(_registrationNumber).length > 0, "Registration number cannot be empty");
        require(bytes(_fileName).length > 0, "File name cannot be empty");
        require(bytes(_ipfsUrl).length > 0, "IPFS URL cannot be empty");
        require(bytes(_fileHash).length > 0, "File hash cannot be empty");
        require(!certificates[_fileHash].exists, "Certificate already registered");

        Certificate memory newCert = Certificate({
            studentName: _studentName,
            registrationNumber: _registrationNumber,
            fileName: _fileName,
            ipfsUrl: _ipfsUrl,
            fileHash: _fileHash,
            universityAddress: msg.sender,
            timestamp: block.timestamp,
            exists: true,
            isRevoked: false,
            revocationReason: "",
            revocationTimestamp: 0,
            replacementCertificateHash: ""
        });

        certificates[_fileHash] = newCert;
        universityCertificates[msg.sender].push(_fileHash);
        allCertificateHashes.push(_fileHash);

        emit CertificateRegistered(
            _fileHash,
            _studentName,
            _registrationNumber,
            msg.sender,
            block.timestamp
        );

        return true;
    }

    /**
     * @dev Verify if a certificate exists by its hash
     * @param _fileHash SHA-512 hash of the certificate
     */
    function verifyCertificate(string memory _fileHash) 
        public 
        returns (bool exists, Certificate memory cert) 
    {
        exists = certificates[_fileHash].exists;
        cert = certificates[_fileHash];

        emit CertificateVerified(_fileHash, exists, block.timestamp);
        
        return (exists, cert);
    }

    /**
     * @dev Get certificate details by hash
     * @param _fileHash SHA-512 hash of the certificate
     */
    function getCertificate(string memory _fileHash) 
        public 
        view 
        returns (Certificate memory) 
    {
        require(certificates[_fileHash].exists, "Certificate does not exist");
        return certificates[_fileHash];
    }

    /**
     * @dev Get all certificates registered by a university
     * @param _universityAddress Address of the university
     */
    function getUniversityCertificates(address _universityAddress) 
        public 
        view 
        returns (string[] memory) 
    {
        return universityCertificates[_universityAddress];
    }

    /**
     * @dev Get total number of certificates registered
     */
    function getTotalCertificates() public view returns (uint256) {
        return allCertificateHashes.length;
    }

    /**
     * @dev Check if a certificate exists
     * @param _fileHash SHA-512 hash of the certificate
     */
    function certificateExists(string memory _fileHash) public view returns (bool) {
        return certificates[_fileHash].exists;
    }

    /**
     * @dev Revoke a certificate
     * @param _fileHash SHA-512 hash of the certificate to revoke
     * @param _reason Reason for revocation
     * @param _replacementCertificateHash Hash of replacement certificate (empty if none)
     */
    function revokeCertificate(
        string memory _fileHash,
        string memory _reason,
        string memory _replacementCertificateHash
    ) public returns (bool) {
        require(certificates[_fileHash].exists, "Certificate does not exist");
        require(!certificates[_fileHash].isRevoked, "Certificate already revoked");
        require(
            certificates[_fileHash].universityAddress == msg.sender,
            "Only issuing university can revoke"
        );
        require(bytes(_reason).length > 0, "Revocation reason cannot be empty");

        // If replacement certificate is provided, verify it exists
        if (bytes(_replacementCertificateHash).length > 0) {
            require(
                certificates[_replacementCertificateHash].exists,
                "Replacement certificate does not exist"
            );
        }

        certificates[_fileHash].isRevoked = true;
        certificates[_fileHash].revocationReason = _reason;
        certificates[_fileHash].revocationTimestamp = block.timestamp;
        certificates[_fileHash].replacementCertificateHash = _replacementCertificateHash;

        emit CertificateRevoked(
            _fileHash,
            _reason,
            _replacementCertificateHash,
            msg.sender,
            block.timestamp
        );

        return true;
    }

    /**
     * @dev Get revocation status of a certificate
     * @param _fileHash SHA-512 hash of the certificate
     */
    function getRevocationStatus(string memory _fileHash)
        public
        view
        returns (
            bool isRevoked,
            string memory reason,
            uint256 revocationTimestamp,
            string memory replacementHash
        )
    {
        require(certificates[_fileHash].exists, "Certificate does not exist");
        
        Certificate memory cert = certificates[_fileHash];
        return (
            cert.isRevoked,
            cert.revocationReason,
            cert.revocationTimestamp,
            cert.replacementCertificateHash
        );
    }

    /**
     * @dev Check if certificate is valid (exists and not revoked)
     * @param _fileHash SHA-512 hash of the certificate
     */
    function isValidCertificate(string memory _fileHash) public view returns (bool) {
        return certificates[_fileHash].exists && !certificates[_fileHash].isRevoked;
    }
}
