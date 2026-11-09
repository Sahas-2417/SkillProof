// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SkillProof {

    // =========================================================
    // STRUCTS
    // =========================================================

    struct Credential {
        uint256 credentialId;
        address holder;
        string title;
        string issuerName;
        uint256 issuedAt;
        bool revoked;
        bool exists;
    }

    // =========================================================
    // STATE VARIABLES
    // =========================================================

    address public owner;

    uint256 private nextCredentialId = 1;

    // credential ID => Credential
    mapping(uint256 => Credential) private credentials;

    // wallet => credential IDs
    mapping(address => uint256[]) private holderCredentials;

    // authorized issuer wallet => true/false
    mapping(address => bool) public authorizedIssuers;

    // =========================================================
    // EVENTS
    // =========================================================

    event IssuerAuthorized(
        address indexed issuer,
        bool status
    );

    event CredentialIssued(
        uint256 indexed credentialId,
        address indexed holder,
        string title,
        string issuerName,
        uint256 issuedAt
    );

    event CredentialRevoked(
        uint256 indexed credentialId,
        address indexed holder
    );

    // =========================================================
    // MODIFIERS
    // =========================================================

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only owner can perform this action"
        );
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(
            authorizedIssuers[msg.sender],
            "Not an authorized issuer"
        );
        _;
    }

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    constructor() {
        owner = msg.sender;

        // The deployer is automatically an authorized issuer.
        authorizedIssuers[msg.sender] = true;

        emit IssuerAuthorized(msg.sender, true);
    }

    // =========================================================
    // ISSUER MANAGEMENT
    // =========================================================

    function authorizeIssuer(
        address issuer,
        bool status
    ) external onlyOwner {

        require(
            issuer != address(0),
            "Invalid issuer address"
        );

        authorizedIssuers[issuer] = status;

        emit IssuerAuthorized(issuer, status);
    }

    // =========================================================
    // ISSUE CREDENTIAL
    // =========================================================

    function issueCredential(
        address holder,
        string memory title,
        string memory issuerName
    )
        external
        onlyAuthorizedIssuer
        returns (uint256)
    {
        require(
            holder != address(0),
            "Invalid holder address"
        );

        require(
            bytes(title).length > 0,
            "Credential title required"
        );

        require(
            bytes(issuerName).length > 0,
            "Issuer name required"
        );

        uint256 credentialId = nextCredentialId;

        credentials[credentialId] = Credential({
            credentialId: credentialId,
            holder: holder,
            title: title,
            issuerName: issuerName,
            issuedAt: block.timestamp,
            revoked: false,
            exists: true
        });

        holderCredentials[holder].push(credentialId);

        nextCredentialId++;

        emit CredentialIssued(
            credentialId,
            holder,
            title,
            issuerName,
            block.timestamp
        );

        return credentialId;
    }

    // =========================================================
    // REVOKE CREDENTIAL
    // =========================================================

    function revokeCredential(
        uint256 credentialId
    )
        external
        onlyAuthorizedIssuer
    {
        require(
            credentials[credentialId].exists,
            "Credential does not exist"
        );

        require(
            !credentials[credentialId].revoked,
            "Credential already revoked"
        );

        credentials[credentialId].revoked = true;

        emit CredentialRevoked(
            credentialId,
            credentials[credentialId].holder
        );
    }

    // =========================================================
    // VERIFY CREDENTIAL
    // =========================================================

    function verifyCredential(
        uint256 credentialId
    )
        external
        view
        returns (
            bool valid,
            address holder,
            string memory title,
            string memory issuerName,
            uint256 issuedAt
        )
    {
        require(
            credentials[credentialId].exists,
            "Credential does not exist"
        );

        Credential memory credential = credentials[credentialId];

        valid = !credential.revoked;
        holder = credential.holder;
        title = credential.title;
        issuerName = credential.issuerName;
        issuedAt = credential.issuedAt;
    }

    // =========================================================
    // GET CREDENTIAL DETAILS
    // =========================================================

    function getCredential(
        uint256 credentialId
    )
        external
        view
        returns (Credential memory)
    {
        require(
            credentials[credentialId].exists,
            "Credential does not exist"
        );

        return credentials[credentialId];
    }

    // =========================================================
    // GET HOLDER'S CREDENTIALS
    // =========================================================

    function getMyCredentials()
        external
        view
        returns (uint256[] memory)
    {
        return holderCredentials[msg.sender];
    }

    // =========================================================
    // GET ANY HOLDER'S CREDENTIALS
    // =========================================================

    function getHolderCredentials(
        address holder
    )
        external
        view
        returns (uint256[] memory)
    {
        require(
            holder != address(0),
            "Invalid holder address"
        );

        return holderCredentials[holder];
    }

    // =========================================================
    // CHECK IF CREDENTIAL EXISTS
    // =========================================================

    function credentialExists(
        uint256 credentialId
    )
        external
        view
        returns (bool)
    {
        return credentials[credentialId].exists;
    }

    // =========================================================
    // GET NEXT CREDENTIAL ID
    // =========================================================

    function getNextCredentialId()
        external
        view
        returns (uint256)
    {
        return nextCredentialId;
    }
}