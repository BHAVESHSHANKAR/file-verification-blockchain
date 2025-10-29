// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UniversityRegistrySepolia {
    // University structure to store all information
    struct University {
        string name;
        string username;
        string email;
        address walletAddress;
        uint256 registrationTimestamp;
        bool isRegistered;
        bool isActive;
        uint256 certificatesIssued;
        string status; // "approved", "suspended", "rejected"
    }

    // Mapping from wallet address to University
    mapping(address => University) public universities;
    
    // Mapping to check if email is already used
    mapping(string => bool) public emailExists;
    
    // Mapping to check if username is already used
    mapping(string => bool) public usernameExists;
    
    // Array of all registered university addresses
    address[] public universityAddresses;
    
    // Admin address (contract deployer)
    address public admin;
    
    // Total count of universities
    uint256 public totalUniversities;

    // Events
    event UniversityRegistered(
        address indexed walletAddress,
        string name,
        string email,
        string username,
        uint256 timestamp
    );

    event UniversityUpdated(
        address indexed walletAddress,
        string name,
        uint256 timestamp
    );

    event UniversityStatusChanged(
        address indexed walletAddress,
        string newStatus,
        uint256 timestamp
    );

    event UniversityActivated(
        address indexed walletAddress,
        uint256 timestamp
    );

    event UniversityDeactivated(
        address indexed walletAddress,
        uint256 timestamp
    );

    event CertificateCountIncremented(
        address indexed walletAddress,
        uint256 newCount
    );

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier universityExists(address _walletAddress) {
        require(universities[_walletAddress].isRegistered, "University not registered");
        _;
    }

    modifier universityNotExists(address _walletAddress) {
        require(!universities[_walletAddress].isRegistered, "University already registered");
        _;
    }

    // Constructor
    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Register a new university on the blockchain
     * @param _name University name
     * @param _username Unique username
     * @param _email University email
     * @param _walletAddress University wallet address
     * @param _status Initial status (approved, pending, etc.)
     */
    function registerUniversity(
        string memory _name,
        string memory _username,
        string memory _email,
        address _walletAddress,
        string memory _status
    ) public onlyAdmin universityNotExists(_walletAddress) returns (bool) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_username).length > 0, "Username cannot be empty");
        require(bytes(_email).length > 0, "Email cannot be empty");
        require(_walletAddress != address(0), "Invalid wallet address");
        require(!emailExists[_email], "Email already registered");
        require(!usernameExists[_username], "Username already taken");

        University memory newUniversity = University({
            name: _name,
            username: _username,
            email: _email,
            walletAddress: _walletAddress,
            registrationTimestamp: block.timestamp,
            isRegistered: true,
            isActive: true,
            certificatesIssued: 0,
            status: _status
        });

        universities[_walletAddress] = newUniversity;
        emailExists[_email] = true;
        usernameExists[_username] = true;
        universityAddresses.push(_walletAddress);
        totalUniversities++;

        emit UniversityRegistered(
            _walletAddress,
            _name,
            _email,
            _username,
            block.timestamp
        );

        return true;
    }

    /**
     * @dev Batch register multiple universities
     * @param _names Array of university names
     * @param _usernames Array of usernames
     * @param _emails Array of emails
     * @param _walletAddresses Array of wallet addresses
     * @param _statuses Array of statuses
     */
    function batchRegisterUniversities(
        string[] memory _names,
        string[] memory _usernames,
        string[] memory _emails,
        address[] memory _walletAddresses,
        string[] memory _statuses
    ) public onlyAdmin returns (uint256) {
        require(
            _names.length == _usernames.length &&
            _usernames.length == _emails.length &&
            _emails.length == _walletAddresses.length &&
            _walletAddresses.length == _statuses.length,
            "Array lengths must match"
        );

        uint256 successCount = 0;

        for (uint256 i = 0; i < _walletAddresses.length; i++) {
            // Skip if already registered
            if (universities[_walletAddresses[i]].isRegistered) {
                continue;
            }

            // Skip if email or username already exists
            if (emailExists[_emails[i]] || usernameExists[_usernames[i]]) {
                continue;
            }

            University memory newUniversity = University({
                name: _names[i],
                username: _usernames[i],
                email: _emails[i],
                walletAddress: _walletAddresses[i],
                registrationTimestamp: block.timestamp,
                isRegistered: true,
                isActive: true,
                certificatesIssued: 0,
                status: _statuses[i]
            });

            universities[_walletAddresses[i]] = newUniversity;
            emailExists[_emails[i]] = true;
            usernameExists[_usernames[i]] = true;
            universityAddresses.push(_walletAddresses[i]);
            totalUniversities++;
            successCount++;

            emit UniversityRegistered(
                _walletAddresses[i],
                _names[i],
                _emails[i],
                _usernames[i],
                block.timestamp
            );
        }

        return successCount;
    }

    /**
     * @dev Update university information
     * @param _walletAddress University wallet address
     * @param _name New name
     */
    function updateUniversityName(
        address _walletAddress,
        string memory _name
    ) public onlyAdmin universityExists(_walletAddress) returns (bool) {
        require(bytes(_name).length > 0, "Name cannot be empty");

        universities[_walletAddress].name = _name;

        emit UniversityUpdated(_walletAddress, _name, block.timestamp);

        return true;
    }

    /**
     * @dev Change university status
     * @param _walletAddress University wallet address
     * @param _status New status
     */
    function changeUniversityStatus(
        address _walletAddress,
        string memory _status
    ) public onlyAdmin universityExists(_walletAddress) returns (bool) {
        universities[_walletAddress].status = _status;

        emit UniversityStatusChanged(_walletAddress, _status, block.timestamp);

        return true;
    }

    /**
     * @dev Activate university
     * @param _walletAddress University wallet address
     */
    function activateUniversity(
        address _walletAddress
    ) public onlyAdmin universityExists(_walletAddress) returns (bool) {
        universities[_walletAddress].isActive = true;

        emit UniversityActivated(_walletAddress, block.timestamp);

        return true;
    }

    /**
     * @dev Deactivate university
     * @param _walletAddress University wallet address
     */
    function deactivateUniversity(
        address _walletAddress
    ) public onlyAdmin universityExists(_walletAddress) returns (bool) {
        universities[_walletAddress].isActive = false;

        emit UniversityDeactivated(_walletAddress, block.timestamp);

        return true;
    }

    /**
     * @dev Increment certificate count for a university
     * @param _walletAddress University wallet address
     */
    function incrementCertificateCount(
        address _walletAddress
    ) public universityExists(_walletAddress) returns (bool) {
        // Only the university itself or admin can increment
        require(
            msg.sender == _walletAddress || msg.sender == admin,
            "Not authorized"
        );

        universities[_walletAddress].certificatesIssued++;

        emit CertificateCountIncremented(
            _walletAddress,
            universities[_walletAddress].certificatesIssued
        );

        return true;
    }

    /**
     * @dev Get university information
     * @param _walletAddress University wallet address
     */
    function getUniversity(
        address _walletAddress
    ) public view returns (University memory) {
        require(universities[_walletAddress].isRegistered, "University not registered");
        return universities[_walletAddress];
    }

    /**
     * @dev Check if university is registered
     * @param _walletAddress University wallet address
     */
    function isUniversityRegistered(
        address _walletAddress
    ) public view returns (bool) {
        return universities[_walletAddress].isRegistered;
    }

    /**
     * @dev Check if university is active
     * @param _walletAddress University wallet address
     */
    function isUniversityActive(
        address _walletAddress
    ) public view returns (bool) {
        return universities[_walletAddress].isRegistered && 
               universities[_walletAddress].isActive;
    }

    /**
     * @dev Check if email is already registered
     * @param _email Email to check
     */
    function isEmailRegistered(
        string memory _email
    ) public view returns (bool) {
        return emailExists[_email];
    }

    /**
     * @dev Check if username is already taken
     * @param _username Username to check
     */
    function isUsernameTaken(
        string memory _username
    ) public view returns (bool) {
        return usernameExists[_username];
    }

    /**
     * @dev Get all registered university addresses
     */
    function getAllUniversityAddresses() public view returns (address[] memory) {
        return universityAddresses;
    }

    /**
     * @dev Get total number of universities
     */
    function getTotalUniversities() public view returns (uint256) {
        return totalUniversities;
    }

    /**
     * @dev Get university by index
     * @param _index Index in the array
     */
    function getUniversityByIndex(
        uint256 _index
    ) public view returns (University memory) {
        require(_index < universityAddresses.length, "Index out of bounds");
        return universities[universityAddresses[_index]];
    }

    /**
     * @dev Transfer admin rights
     * @param _newAdmin New admin address
     */
    function transferAdmin(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "Invalid address");
        admin = _newAdmin;
    }
}
