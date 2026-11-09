# 🔐 SkillProof — Blockchain-Based Skill & Experience Verification

> **Prove what you know. Don't just claim it.**

SkillProof is a blockchain-based credential verification DApp that enables institutions and authorized issuers to issue tamper-resistant digital credentials for skills, achievements, and experiences.

Each credential is recorded on the **Ethereum Sepolia blockchain**, allowing anyone to independently verify its authenticity using a unique Credential ID — without requiring access to a centralized database.

---

## 🌐 Project Overview

Traditional certificates and experience records can be difficult to verify and are vulnerable to:

- Fake or modified certificates
- Lost physical documents
- Centralized verification systems
- Manual verification processes
- Difficulty proving the authenticity of achievements

**SkillProof** addresses these problems by storing credential records on-chain.

An authorized issuer can issue a credential to a recipient's wallet. Once recorded on the blockchain, the credential can be verified publicly using its Credential ID.

### Core Idea

```text
Issuer
   │
   │ Issue Credential
   ▼
Smart Contract
   │
   │ Blockchain Record
   ▼
Credential Holder
   │
   │ Shares Credential ID
   ▼
Public Verifier
   │
   │ Verify On-Chain
   ▼
Authentic / Revoked
```

---

# ✨ Features

### 🏛️ Issuer Portal

Authorized issuers can:

- Connect their MetaMask wallet
- Issue credentials
- Specify recipient wallet address
- Add credential title
- Add issuer/institution name
- Receive a unique Credential ID
- Revoke previously issued credentials

---

### 🎓 My Credentials

Credential holders can:

- Connect their wallet
- View credentials issued to them
- See Credential IDs
- View credential titles
- See issuing institution
- View issue date
- Check verification status
- Share credential information

---

### 🔎 Public Verification

Anyone can verify a credential using its Credential ID.

Verification displays:

- Credential status
- Credential title
- Issuing institution
- Credential holder
- Issue date
- Blockchain network

No account or wallet is required for public verification.

---

### ⛓️ Blockchain-Based Records

Credentials are stored through a Solidity smart contract deployed on Ethereum Sepolia.

This provides:

- Tamper-resistant records
- Public verification
- Transparent credential lifecycle
- Decentralized verification
- Permanent blockchain history

---

# 🧩 System Architecture

```text
                    ┌──────────────────────┐
                    │      Issuer/Admin     │
                    │      MetaMask        │
                    └──────────┬───────────┘
                               │
                               │ Issue / Revoke
                               ▼
                    ┌──────────────────────┐
                    │   SkillProof DApp    │
                    │    HTML/CSS/JS       │
                    └──────────┬───────────┘
                               │
                               │ Ethers.js
                               ▼
                    ┌──────────────────────┐
                    │ SkillProof.sol       │
                    │ Solidity Smart       │
                    │ Contract             │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Ethereum Sepolia     │
                    │ Blockchain           │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
        ┌─────────────────┐        ┌─────────────────┐
        │ Credential      │        │ Public Verifier │
        │ Holder          │        │                 │
        └─────────────────┘        └─────────────────┘
```

---

# 🔄 How SkillProof Works

## 1. Issuer Connects Wallet

The authorized issuer connects MetaMask to the SkillProof Issuer Portal.

## 2. Credential Is Issued

The issuer enters:

- Recipient wallet address
- Credential title
- Issuer name

The smart contract creates a unique Credential ID.

Example:

```text
SP-000007
```

## 3. Blockchain Records the Credential

The transaction is submitted to Ethereum Sepolia.

The credential stores:

```text
Credential ID
Holder Address
Credential Title
Issuer Name
Issue Timestamp
Revocation Status
Existence Status
```

## 4. Recipient Views Credential

The recipient connects the wallet associated with the credential.

SkillProof retrieves all credentials assigned to that wallet.

## 5. Credential Can Be Shared

The recipient can share their Credential ID with another person, institution, recruiter, or organization.

## 6. Anyone Can Verify

The verifier enters the Credential ID.

The DApp reads the blockchain and determines whether the credential is valid or revoked.

---

# 📜 Smart Contract

The core blockchain logic is implemented in:

```text
Contract/SkillProof.sol
```

### Deployed Contract

**Network:** Ethereum Sepolia

**Contract Address:**

```text
0x7814437a0Dda2F03cC6a6544AAf95eC0bC7a698f
```

### Chain ID

```text
11155111
```

The project uses Sepolia as a test network for smart-contract and DApp development.

---

# ⚙️ Smart Contract Functions

| Function | Purpose |
|---|---|
| `authorizeIssuer()` | Authorizes or removes an issuer |
| `issueCredential()` | Creates a new credential |
| `revokeCredential()` | Revokes an existing credential |
| `verifyCredential()` | Verifies a credential |
| `getCredential()` | Retrieves credential details |
| `getHolderCredentials()` | Retrieves credentials belonging to a wallet |
| `getMyCredentials()` | Retrieves credentials of the connected wallet |
| `credentialExists()` | Checks whether a credential exists |
| `authorizedIssuers()` | Checks issuer authorization |
| `getNextCredentialId()` | Returns the next credential ID |
| `owner()` | Returns the contract owner |

---

# 🛡️ Credential Lifecycle

```text
              ┌─────────────┐
              │   Created   │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │   Verified  │
              └──────┬──────┘
                     │
                     │ Revoke
                     ▼
              ┌─────────────┐
              │   Revoked   │
              └─────────────┘
```

A revoked credential remains recorded on the blockchain, but verification identifies it as invalid.

This preserves the credential's history instead of deleting the record.

---

# 🖥️ Frontend Pages

SkillProof uses a simple multi-page frontend built with HTML, CSS and JavaScript.

### Homepage

```text
/index.html
```

Introduces SkillProof and provides navigation to the major features.

### Issuer Portal

```text
/admin.html
```

Used by authorized issuers to issue and revoke credentials.

### My Credentials

```text
/credentials.html
```

Allows credential holders to view their blockchain-backed credentials.

### Verification

```text
/verify.html
```

Allows anyone to verify a credential using its Credential ID.

---

# 🛠️ Technology Stack

### Blockchain

- Ethereum
- Ethereum Sepolia Testnet
- Solidity
- Remix IDE

### Frontend

- HTML5
- CSS3
- JavaScript
- Ethers.js

### Wallet

- MetaMask

### Development

- Visual Studio Code
- Live Server
- Git & GitHub

### Deployment

- Vercel

The project is a static frontend, so it can be deployed without a traditional backend build process. Vercel supports static sites containing HTML, CSS and JavaScript directly.

---

# 📁 Project Structure

```text
SkillProof/
│
├── Contract/
│   └── SkillProof.sol
│
├── docs/
│   ├── SkillProof Blockchain Project.pdf
│   └── SkillProof_Project_Report.pdf
│
├── admin.html
├── app.js
├── credentials.html
├── index.html
├── style.css
├── verify.html
│
└── README.md
```

---

# 🧪 Testing

The smart contract and frontend were tested using multiple wallet accounts.

### Test Scenarios

#### ✅ Issuer Authorization

An authorized wallet can issue credentials.

#### ✅ Credential Issuance

A credential can be issued to a recipient wallet.

Example:

```text
Credential ID: SP-000007
Title: Professional Achievement
Issuer: SJCEM
```

#### ✅ Credential Retrieval

The recipient wallet can retrieve its associated credentials.

#### ✅ Credential Verification

A valid Credential ID returns the credential information and verification status.

#### ✅ Credential Revocation

An authorized issuer can revoke a credential.

#### ✅ Post-Revocation Verification

After revocation, the same Credential ID remains on-chain but is reported as revoked.

---

# 🔐 Security Model

SkillProof uses role-based authorization inside the smart contract.

### Owner

The contract owner can authorize issuers.

### Authorized Issuer

Authorized issuers can:

- Issue credentials
- Revoke credentials

### Credential Holder

Credential holders can:

- View their credentials
- Share their Credential IDs

### Public User

Anyone can:

- Verify credentials

No centralized verification authority is required for reading blockchain records.

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/Sahas-2417/SkillProof.git
```

```bash
cd SkillProof
```

## 2. Open the Project

Open the project in Visual Studio Code.

## 3. Start Live Server

Open:

```text
index.html
```

using VS Code Live Server.

## 4. Install MetaMask

Make sure MetaMask is installed in your browser.

Switch the network to:

```text
Ethereum Sepolia
```

## 5. Connect Wallet

Use the **Connect Wallet** button in the application.

---

# 🌍 Deployment

SkillProof can be deployed as a static website.

Recommended deployment structure:

```text
index.html
admin.html
credentials.html
verify.html
style.css
app.js
```

The project can be connected to a GitHub repository and deployed through Vercel. Vercel can automatically redeploy the site when changes are pushed to the connected repository.

---

# ⚠️ Important Notes

SkillProof currently uses the **Ethereum Sepolia testnet**.

Therefore:

- Credentials are testnet records.
- Test ETH has no real monetary value.
- The project is intended for demonstration, learning and development.
- Users should never expose private keys or seed phrases.

Do **not** place private keys, seed phrases, or wallet secrets inside the frontend code.

---

# 🔮 Future Scope

SkillProof can be extended into a production-grade credential platform.

Possible improvements include:

### 🪪 Verifiable Digital Certificates

Generate downloadable certificates containing blockchain verification information.

### 🔗 Shareable Verification Links

Generate links such as:

```text
https://skillproof.vercel.app/verify.html?id=7
```

### 📱 QR Code Verification

Add QR codes to certificates so recruiters or institutions can instantly verify credentials.

### 🏢 Multi-Institution Support

Allow universities, companies and training platforms to become independent credential issuers.

### 🪙 NFT-Based Credentials

Represent certificates as non-transferable blockchain assets.

### 📊 Credential Dashboard

Provide analytics for institutions and credential holders.

### 🔐 Decentralized Identity

Integrate decentralized identity standards for stronger identity and credential ownership.

### 🌐 Mainnet Deployment

After extensive testing and auditing, the system could be adapted for deployment on an Ethereum-compatible production network.

---

# 🎯 Project Objectives

SkillProof was designed to demonstrate how blockchain technology can be applied to a practical real-world verification problem.

The primary objectives are:

- Build a decentralized credential verification system
- Eliminate dependence on centralized verification databases
- Provide tamper-resistant achievement records
- Allow public verification
- Demonstrate smart-contract based authorization
- Connect a blockchain backend with a web frontend
- Provide a practical Web3 application architecture

---

# 📌 Project Status

```text
Smart Contract       ✅ Deployed
Sepolia Integration  ✅ Complete
Credential Issuance  ✅ Working
Credential Revoking  ✅ Working
Credential Retrieval ✅ Working
Public Verification  ✅ Working
Frontend             ✅ Complete
Documentation        ✅ Complete
Deployment           🚀 Ready
```

---

# 👨‍💻 Author

### Sahas Bochare

B.Tech Information Technology  
St. John College of Engineering and Management

GitHub:  
https://github.com/Sahas-2417

---

# ⭐ Project

If you find this project useful or interesting, consider giving the repository a ⭐.

**SkillProof — Prove what you know. Don't just claim it.**