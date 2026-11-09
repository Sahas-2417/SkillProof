/* =========================================================
   SKILLPROOF — COMPLETE FRONTEND APP
   Ethereum Sepolia
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURATION
   ========================================================= */

const CONTRACT_ADDRESS =
    "0x7814437a0Dda2F03cC6a6544AAf95eC0bC7a698f";

const SEPOLIA_CHAIN_ID = "0xaa36a7";

/*
    Public RPCs used only for reading public credentials.

    The first one is normally used.
    If it fails, the next one is tried automatically.
*/
const PUBLIC_RPC_URLS = [
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://rpc.sepolia.org",
    "https://sepolia.drpc.org"
];


/* =========================================================
   CONTRACT ABI
   ========================================================= */

const CONTRACT_ABI = [

    /* -------------------------
       READ FUNCTIONS
       ------------------------- */

    "function owner() view returns (address)",

    "function authorizedIssuers(address) view returns (bool)",

    "function credentialExists(uint256 credentialId) view returns (bool)",

    "function getNextCredentialId() view returns (uint256)",

    "function getMyCredentials() view returns (uint256[])",

    "function getHolderCredentials(address holder) view returns (uint256[])",

    /*
        IMPORTANT:
        Exact structure of SkillProof Credential.
    */

    "function getCredential(uint256 credentialId) view returns (uint256 credentialId, address holder, string title, string issuerName, uint256 issuedAt, bool revoked, bool exists)",

    /*
        Easier verification call.
        We use credentialExists() FIRST so a non-existing
        credential never causes a contract revert.
    */

    "function verifyCredential(uint256 credentialId) view returns (bool valid, address holder, string title, string issuerName, uint256 issuedAt)",


    /* -------------------------
       WRITE FUNCTIONS
       ------------------------- */

    "function authorizeIssuer(address issuer, bool status)",

    "function issueCredential(address holder, string title, string issuerName) returns (uint256)",

    "function revokeCredential(uint256 credentialId)",


    /* -------------------------
       EVENTS
       ------------------------- */

    "event CredentialIssued(uint256 indexed credentialId, address indexed holder, string title, string issuerName)",

    "event CredentialRevoked(uint256 indexed credentialId)",

    "event IssuerAuthorized(address indexed issuer, bool status)"
];


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let browserProvider = null;
let signer = null;
let connectedAccount = null;
let skillProofContract = null;


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}


function shortenAddress(address) {

    if (!address) {
        return "Unknown";
    }

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}


function escapeHtml(value) {

    if (value === undefined || value === null) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatCredentialId(id) {

    return "SP-" + String(id).padStart(6, "0");
}


function parseCredentialId(value) {

    if (!value) {
        return null;
    }

    let cleaned = String(value)
        .trim()
        .toUpperCase();

    /*
        Accept:

        2
        000002
        SP-000002
        SP000002
        sp-000002
    */

    cleaned = cleaned.replace(/^SP[-\s]*/i, "");

    if (!/^\d+$/.test(cleaned)) {
        return null;
    }

    const number = Number(cleaned);

    if (!Number.isSafeInteger(number) || number <= 0) {
        return null;
    }

    return number;
}


function formatDate(timestamp) {

    try {

        const date = new Date(Number(timestamp) * 1000);

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    } catch (error) {

        return "Unknown date";
    }
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message, type = "success") {

    let toast = $("toast");

    if (!toast) {
        console.log(`[${type}] ${message}`);
        return;
    }

    toast.textContent = message;

    toast.className = "toast";

    if (type === "error") {
        toast.classList.add("toast-error");
    }

    if (type === "success") {
        toast.classList.add("toast-success");
    }

    if (type === "warning") {
        toast.classList.add("toast-warning");
    }

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}


/* =========================================================
   METAMASK / WALLET
   ========================================================= */

async function connectWallet() {

    if (!window.ethereum) {

        showToast(
            "MetaMask is not installed. Please install MetaMask.",
            "error"
        );

        return null;
    }

    try {

        /*
            Create browser provider.
        */

        browserProvider =
            new ethers.BrowserProvider(window.ethereum);


        /*
            Check current network.
        */

        const network =
            await browserProvider.getNetwork();

        const currentChainId =
            "0x" + Number(network.chainId).toString(16);


        /*
            Switch to Sepolia if necessary.
        */

        if (currentChainId.toLowerCase() !== SEPOLIA_CHAIN_ID.toLowerCase()) {

            try {

                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [
                        {
                            chainId: SEPOLIA_CHAIN_ID
                        }
                    ]
                });

            } catch (switchError) {

                /*
                    Sepolia may not be added to MetaMask.
                */

                if (switchError.code === 4902) {

                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [
                            {
                                chainId: SEPOLIA_CHAIN_ID,
                                chainName: "Sepolia",
                                nativeCurrency: {
                                    name: "Sepolia Ether",
                                    symbol: "ETH",
                                    decimals: 18
                                },
                                rpcUrls: [
                                    "https://ethereum-sepolia-rpc.publicnode.com"
                                ],
                                blockExplorerUrls: [
                                    "https://sepolia.etherscan.io"
                                ]
                            }
                        ]
                    });

                } else {

                    throw switchError;
                }
            }

            /*
                Re-create provider after network switch.
            */

            browserProvider =
                new ethers.BrowserProvider(window.ethereum);
        }


        /*
            Ask MetaMask for account.
        */

        await window.ethereum.request({
            method: "eth_requestAccounts"
        });


        signer =
            await browserProvider.getSigner();

        connectedAccount =
            await signer.getAddress();


        /*
            Contract connected with signer.
        */

        skillProofContract =
            new ethers.Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                signer
            );


        updateWalletUI(connectedAccount);

        await refreshDashboard();


        showToast(
            `Wallet connected: ${shortenAddress(connectedAccount)}`,
            "success"
        );


        return connectedAccount;

    } catch (error) {

        console.error("Wallet connection error:", error);

        showToast(
            getReadableError(error),
            "error"
        );

        return null;
    }
}


/* =========================================================
   WALLET UI
   ========================================================= */

function updateWalletUI(address) {

    const connectButtons = [
        $("connectBtn"),
        $("connectWalletBtn")
    ];

    connectButtons.forEach(button => {

        if (!button) {
            return;
        }

        button.textContent =
            shortenAddress(address);

        button.classList.add("connected");
    });


    const walletAddressElements =
        document.querySelectorAll(
            "[data-wallet-address]"
        );

    walletAddressElements.forEach(element => {

        element.textContent =
            shortenAddress(address);
    });
}


/* =========================================================
   PUBLIC VERIFICATION PROVIDER
   ========================================================= */

async function getVerificationProvider() {

    /*
        If MetaMask is connected and already on Sepolia,
        we can use it for reading.

        Otherwise use public RPC.
    */

    if (browserProvider) {

        try {

            const network =
                await browserProvider.getNetwork();

            if (Number(network.chainId) === 11155111) {

                console.log(
                    "Using connected MetaMask provider for verification."
                );

                return browserProvider;
            }

        } catch (error) {

            console.warn(
                "Connected provider unavailable:",
                error
            );
        }
    }


    /*
        Try public RPCs one by one.
    */

    for (let i = 0; i < PUBLIC_RPC_URLS.length; i++) {

        const rpcUrl =
            PUBLIC_RPC_URLS[i];

        try {

            console.log(
                `Trying public Sepolia RPC #${i + 1}: ${rpcUrl}`
            );

            const provider =
                new ethers.JsonRpcProvider(
                    rpcUrl,
                    {
                        chainId: 11155111,
                        name: "sepolia"
                    },
                    {
                        staticNetwork: true
                    }
                );


            /*
                Quick connectivity test.
            */

            await provider.getBlockNumber();

            console.log(
                `RPC working: ${rpcUrl}`
            );

            return provider;

        } catch (error) {

            console.warn(
                `RPC failed: ${rpcUrl}`,
                error
            );
        }
    }


    throw new Error(
        "Unable to connect to any public Sepolia RPC."
    );
}


/* =========================================================
   READ CONTRACT
   ========================================================= */

async function getReadOnlyContract() {

    const provider =
        await getVerificationProvider();

    return new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
    );
}


/* =========================================================
   DASHBOARD REFRESH
   ========================================================= */

async function refreshDashboard() {

    /*
        Update next credential ID/stat if element exists.
    */

    try {

        const contract =
            skillProofContract ||
            await getReadOnlyContract();

        const nextId =
            await contract.getNextCredentialId();

        const stat =
            $("nextIdStat");

        if (stat) {

            stat.textContent =
                formatCredentialId(nextId);
        }

    } catch (error) {

        console.warn(
            "Dashboard refresh warning:",
            error
        );
    }


    /*
        Check issuer authorization.
    */

    if (connectedAccount) {

        await checkIssuerAuthorization();
    }


    /*
        Refresh credentials if we're on credentials page.
    */

    if ($("credentialGrid")) {

        await loadMyCredentials();
    }
}


/* =========================================================
   ISSUER AUTHORIZATION
   ========================================================= */

async function checkIssuerAuthorization() {

    if (!connectedAccount) {
        return false;
    }

    try {

        const contract =
            skillProofContract ||
            await getReadOnlyContract();

        const authorized =
            await contract.authorizedIssuers(
                connectedAccount
            );


        const badge =
            $("issuerBadge");

        if (badge) {

            if (authorized) {

                badge.textContent =
                    "Authorized Issuer";

                badge.classList.add("authorized");

            } else {

                badge.textContent =
                    "Not Authorized";

                badge.classList.remove("authorized");
            }
        }


        const issueButton =
            $("issueBtn");

        if (issueButton) {

            issueButton.disabled =
                !authorized;
        }


        return authorized;

    } catch (error) {

        console.error(
            "Issuer authorization check failed:",
            error
        );

        return false;
    }
}


/* =========================================================
   ISSUE CREDENTIAL
   ========================================================= */

async function issueCredential() {

    try {

        /*
            Connect wallet first if needed.
        */

        if (!signer || !connectedAccount) {

            const account =
                await connectWallet();

            if (!account) {
                return;
            }
        }


        /*
            Make sure contract exists.
        */

        if (!skillProofContract) {

            skillProofContract =
                new ethers.Contract(
                    CONTRACT_ADDRESS,
                    CONTRACT_ABI,
                    signer
                );
        }


        /*
            Get form values.
        */

        const holderInput =
            $("holderInput");

        const titleInput =
            $("titleInput");

        const issuerInput =
            $("issuerInput");


        if (!holderInput ||
            !titleInput ||
            !issuerInput) {

            showToast(
                "Issue form fields are missing.",
                "error"
            );

            return;
        }


        const holder =
            holderInput.value.trim();

        const title =
            titleInput.value.trim();

        const issuerName =
            issuerInput.value.trim();


        /*
            Validation.
        */

        if (!ethers.isAddress(holder)) {

            showToast(
                "Enter a valid recipient wallet address.",
                "error"
            );

            holderInput.focus();

            return;
        }


        if (!title) {

            showToast(
                "Enter the skill or achievement.",
                "error"
            );

            titleInput.focus();

            return;
        }


        if (!issuerName) {

            showToast(
                "Enter the issuer name.",
                "error"
            );

            issuerInput.focus();

            return;
        }


        /*
            Check issuer authorization.
        */

        const authorized =
            await skillProofContract.authorizedIssuers(
                connectedAccount
            );


        if (!authorized) {

            showToast(
                "Your wallet is not authorized to issue credentials.",
                "error"
            );

            return;
        }


        /*
            Disable button during transaction.
        */

        const issueButton =
            $("issueBtn");

        if (issueButton) {

            issueButton.disabled = true;

            const span =
                issueButton.querySelector("span");

            if (span) {
                span.textContent = "Processing...";
            } else {
                issueButton.textContent =
                    "Processing...";
            }
        }


        /*
            Show transaction status.
        */

        showIssueResult(`
            <div class="transaction-state">
                <div class="spinner"></div>
                <h3>Waiting for MetaMask...</h3>
                <p>
                    Confirm the credential transaction in your wallet.
                </p>
            </div>
        `);


        console.log(
            "Issuing credential:",
            {
                holder,
                title,
                issuerName
            }
        );


        /*
            THIS IS THE ACTUAL BLOCKCHAIN TRANSACTION.
        */

        const transaction =
            await skillProofContract.issueCredential(
                holder,
                title,
                issuerName
            );


        console.log(
            "Transaction sent:",
            transaction.hash
        );


        showIssueResult(`
            <div class="transaction-state">

                <div class="spinner"></div>

                <h3>Transaction submitted</h3>

                <p>
                    Waiting for blockchain confirmation...
                </p>

                <a
                    href="https://sepolia.etherscan.io/tx/${transaction.hash}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    View transaction on Etherscan →
                </a>

            </div>
        `);


        /*
            Wait for confirmation.
        */

        const receipt =
            await transaction.wait();


        console.log(
            "Transaction confirmed:",
            receipt
        );


        /*
            Find CredentialIssued event.
        */

        let credentialId = null;


        for (const log of receipt.logs) {

            try {

                const parsed =
                    skillProofContract.interface.parseLog(
                        log
                    );

                if (
                    parsed &&
                    parsed.name === "CredentialIssued"
                ) {

                    credentialId =
                        parsed.args.credentialId;

                    break;
                }

            } catch (error) {

                /*
                    Ignore logs that are not ours.
                */
            }
        }


        /*
            Fallback:
            read next ID minus one.
        */

        if (credentialId === null) {

            const nextId =
                await skillProofContract.getNextCredentialId();

            credentialId =
                BigInt(nextId) - 1n;
        }


        const formattedId =
            formatCredentialId(credentialId);


        /*
            SUCCESS UI.
        */

        showIssueResult(`
            <div class="issue-success">

                <div class="success-icon">
                    ✓
                </div>

                <div>

                    <span class="result-label">
                        CREDENTIAL ISSUED
                    </span>

                    <h3>
                        ${formattedId}
                    </h3>

                    <p>
                        ${escapeHtml(title)}
                    </p>

                    <small>
                        Issued to
                        ${escapeHtml(shortenAddress(holder))}
                    </small>

                </div>

                <a
                    href="https://sepolia.etherscan.io/tx/${transaction.hash}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    View on Etherscan →
                </a>

            </div>
        `);


        showToast(
            `${formattedId} issued successfully!`,
            "success"
        );


        /*
            Clear form.
        */

        holderInput.value = "";
        titleInput.value = "";


        /*
            Refresh dashboard.
        */

        await refreshDashboard();


    } catch (error) {

        console.error(
            "Issue credential error:",
            error
        );


        /*
            User rejected MetaMask.
        */

        if (
            error.code === 4001 ||
            error.code === "ACTION_REJECTED"
        ) {

            showToast(
                "Transaction cancelled in MetaMask.",
                "warning"
            );

        } else {

            showToast(
                getReadableError(error),
                "error"
            );
        }


        showIssueResult(`
            <div class="transaction-error">

                <div class="error-icon">
                    !
                </div>

                <h3>
                    Credential not issued
                </h3>

                <p>
                    ${escapeHtml(getReadableError(error))}
                </p>

            </div>
        `);

    } finally {

        const issueButton =
            $("issueBtn");

        if (issueButton) {

            issueButton.disabled = false;

            const span =
                issueButton.querySelector("span");

            if (span) {
                span.textContent =
                    "Issue Credential";
            } else {
                issueButton.textContent =
                    "Issue Credential";
            }
        }
    }
}


/* =========================================================
   ISSUE RESULT UI
   ========================================================= */

function showIssueResult(html) {

    const result =
        $("issueResult");

    if (!result) {
        return;
    }

    result.classList.remove("hidden");

    result.innerHTML = html;
}


/* =========================================================
   MY CREDENTIALS
   ========================================================= */

async function loadMyCredentials() {

    const grid = $("credentialGrid");

    if (!grid) {
        return;
    }

    /*
        Reset statistics while loading
    */
    const totalEl = $("credentialCount");
    const verifiedEl = $("validCredentialCount");
    const revokedEl = $("revokedCredentialCount");

    if (totalEl) totalEl.textContent = "—";
    if (verifiedEl) verifiedEl.textContent = "—";
    if (revokedEl) revokedEl.textContent = "—";


    /*
        Wallet not connected
    */
    if (!connectedAccount) {

        if (totalEl) totalEl.textContent = "0";
        if (verifiedEl) verifiedEl.textContent = "0";
        if (revokedEl) revokedEl.textContent = "0";

        grid.innerHTML = `
            <div class="empty-state">

                <div class="state-icon">
                    ◇
                </div>

                <h3>
                    Connect your wallet
                </h3>

                <p>
                    Connect the wallet that received your credentials
                    to view them.
                </p>

            </div>
        `;

        return;
    }


    try {

        grid.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading your credentials...</p>
            </div>
        `;


        /*
            Get read/write contract if wallet is connected.
            Otherwise use read-only contract.
        */

        const contract =
            skillProofContract ||
            await getReadOnlyContract();


        /*
            Get credential IDs belonging to connected wallet.
        */

        const ids =
            await contract.getMyCredentials();


        console.log(
            "My credential IDs:",
            ids
        );


        /*
            No credentials
        */

        if (!ids || ids.length === 0) {

            if (totalEl) totalEl.textContent = "0";
            if (verifiedEl) verifiedEl.textContent = "0";
            if (revokedEl) revokedEl.textContent = "0";


            grid.innerHTML = `
                <div class="empty-state">

                    <div class="state-icon">
                        ◇
                    </div>

                    <h3>
                        No credentials yet
                    </h3>

                    <p>
                        Credentials issued to this wallet
                        will appear here.
                    </p>

                </div>
            `;

            return;
        }


        /*
            Counters
        */

        let totalCredentials = 0;
        let verifiedCredentials = 0;
        let revokedCredentials = 0;


        /*
            Build credential cards
        */

        const cards = [];


        for (const id of ids) {

            try {

                /*
                    verifyCredential returns:

                    [0] valid
                    [1] holder
                    [2] title
                    [3] issuerName
                    [4] issuedAt
                */

                const result =
                    await contract.verifyCredential(id);


                const valid =
                    result[0];

                const holder =
                    result[1];

                const title =
                    result[2];

                const issuerName =
                    result[3];

                const issuedAt =
                    result[4];


                /*
                    Update counters
                */

                totalCredentials++;


                if (valid) {
                    verifiedCredentials++;
                } else {
                    revokedCredentials++;
                }


                /*
                    Build credential card
                */

                cards.push(`
                    <article class="credential-card">

                        <div class="credential-card-top">

                            <span class="credential-id">
                                ${formatCredentialId(id)}
                            </span>

                            ${
                                valid
                                    ? `<span class="status-badge verified">
                                            ✓ VERIFIED
                                       </span>`
                                    : `<span class="status-badge revoked">
                                            ● REVOKED
                                       </span>`
                            }

                        </div>


                        <h3>
                            ${escapeHtml(title)}
                        </h3>


                        <p class="credential-issuer">
                            Issued by
                            <strong>
                                ${escapeHtml(issuerName)}
                            </strong>
                        </p>


                        <div class="credential-meta">

                            <div>
                                <span>Holder</span>

                                <strong>
                                    ${shortenAddress(holder)}
                                </strong>
                            </div>


                            <div>
                                <span>Issued</span>

                                <strong>
                                    ${formatDate(issuedAt)}
                                </strong>
                            </div>

                        </div>


                        <div class="credential-actions">

                            <button
                                class="btn btn-primary"
                                onclick="openCredentialVerification(${id})"
                            >
                                View Credential
                            </button>


                            <button
                                class="btn btn-secondary"
                                onclick="shareCredential(${id})"
                            >
                                Share
                            </button>

                        </div>

                    </article>
                `);


            } catch (error) {

                console.error(
                    `Unable to load credential ${id}:`,
                    error
                );

            }

        }


        /*
            UPDATE DASHBOARD STATISTICS
        */

        if (totalEl) {
            totalEl.textContent =
                totalCredentials;
        }


        if (verifiedEl) {
            verifiedEl.textContent =
                verifiedCredentials;
        }


        if (revokedEl) {
            revokedEl.textContent =
                revokedCredentials;
        }


        console.log(
            "Credential statistics:",
            {
                total: totalCredentials,
                verified: verifiedCredentials,
                revoked: revokedCredentials
            }
        );


        /*
            If every credential failed to load
        */

        if (cards.length === 0) {

            grid.innerHTML = `
                <div class="empty-state">

                    <div class="state-icon">
                        !
                    </div>

                    <h3>
                        Unable to load credentials
                    </h3>

                    <p>
                        The blockchain records could not be read.
                    </p>

                </div>
            `;

            return;
        }


        /*
            Render all cards
        */

        grid.innerHTML =
            cards.join("");


    } catch (error) {

        console.error(
            "Loading credentials failed:",
            error
        );


        if (totalEl) totalEl.textContent = "0";
        if (verifiedEl) verifiedEl.textContent = "0";
        if (revokedEl) revokedEl.textContent = "0";


        grid.innerHTML = `
            <div class="empty-state">

                <div class="state-icon error-icon">
                    !
                </div>

                <h3>
                    Unable to load credentials
                </h3>

                <p>
                    ${escapeHtml(
                        getReadableError(error)
                    )}
                </p>

            </div>
        `;
    }
}

/* =========================================================
   SHARE CREDENTIAL
   ========================================================= */

function shareCredential(id) {

    const formattedId =
        formatCredentialId(id);

    const url =
        new URL(
            "verify.html",
            window.location.href
        );

    url.searchParams.set(
        "id",
        formattedId
    );


    const shareUrl =
        url.toString();


    /*
        Modern clipboard.
    */

    if (
        navigator.clipboard &&
        navigator.clipboard.writeText
    ) {

        navigator.clipboard
            .writeText(shareUrl)
            .then(() => {

                showToast(
                    `${formattedId} verification link copied!`,
                    "success"
                );

            })
            .catch(() => {

                window.prompt(
                    "Copy this verification link:",
                    shareUrl
                );
            });

    } else {

        window.prompt(
            "Copy this verification link:",
            shareUrl
        );
    }
}


/* =========================================================
   OPEN CREDENTIAL VERIFICATION
   ========================================================= */

function openCredentialVerification(id) {

    const formattedId =
        formatCredentialId(id);

    window.location.href =
        `verify.html?id=${encodeURIComponent(formattedId)}`;
}


/* =========================================================
   PUBLIC VERIFICATION
   ========================================================= */

async function verifyCredentialFromInput() {

    const input =
        $("verifyInput");

    if (!input) {

        console.error(
            "verifyInput element not found."
        );

        return;
    }


    const rawValue =
        input.value.trim();


    if (!rawValue) {

        showCredentialVerificationError(
            "Please enter a credential ID."
        );

        return;
    }


    const id =
        parseCredentialId(rawValue);


    if (id === null) {

        showCredentialVerificationError(
            "Invalid credential ID. Use a format such as SP-000002."
        );

        return;
    }


    console.log(
        "Verifying credential ID:",
        id
    );


    await verifyCredentialById(id);
}


/* =========================================================
   VERIFY CREDENTIAL BY ID
   ========================================================= */

async function verifyCredentialById(id) {

    const verifyResult =
        $("verifyResult");


    if (!verifyResult) {

        console.error(
            "verifyResult element not found."
        );

        return;
    }


    /*
        LOADING STATE
    */

    verifyResult.classList.remove("hidden");

    verifyResult.innerHTML = `
        <div class="verification-state">

            <div class="state-icon">
                ◌
            </div>

            <h3>
                Verifying credential
            </h3>

            <p>
                Checking the SkillProof record directly
                from Ethereum Sepolia...
            </p>

        </div>
    `;


    try {

        console.log(
            "Checking credential:",
            id
        );


        /*
            Get a working read-only provider.
        */

        const provider =
            await getVerificationProvider();


        const contract =
            new ethers.Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                provider
            );


        /*
            =====================================================
            STEP 1 — CHECK EXISTENCE
            =====================================================

            This is VERY important.

            We DO NOT call verifyCredential() on a missing ID,
            because the contract reverts with:

            "Credential does not exist"
        */

        console.log(
            "Checking whether credential exists..."
        );


        const exists =
            await contract.credentialExists(id);


        console.log(
            "Credential exists:",
            exists
        );


        /*
            =====================================================
            NOT FOUND
            =====================================================
        */

        if (!exists) {

            showCredentialNotFound(id);

            return;
        }


        /*
            =====================================================
            STEP 2 — READ CREDENTIAL
            =====================================================

            Now it is safe to call verifyCredential().
        */

        console.log(
            "Credential exists. Reading credential..."
        );


        const result =
            await contract.verifyCredential(id);


        console.log(
            "Verification result:",
            result
        );


        const valid =
            result[0];

        const holder =
            result[1];

        const title =
            result[2];

        const issuerName =
            result[3];

        const issuedAt =
            result[4];


        const formattedId =
            formatCredentialId(id);


        const issuedDate =
            formatDate(issuedAt);


        /*
            =====================================================
            REVOKED
            =====================================================
        */

        if (!valid) {

            verifyResult.innerHTML = `
                <div class="verification-card revoked-card">

                    <div class="verification-header">

                        <div>

                            <span class="result-label">
                                SKILLPROOF CREDENTIAL
                            </span>

                            <h2>
                                ${formattedId}
                            </h2>

                        </div>

                        <span class="status-badge revoked">
                            ● REVOKED
                        </span>

                    </div>


                    <div class="verification-divider"></div>


                    <div class="credential-details">

                        <div class="detail-item">
                            <span>Achievement</span>
                            <strong>
                                ${escapeHtml(title)}
                            </strong>
                        </div>

                        <div class="detail-item">
                            <span>Issued By</span>
                            <strong>
                                ${escapeHtml(issuerName)}
                            </strong>
                        </div>

                        <div class="detail-item">
                            <span>Holder</span>
                            <strong>
                                ${shortenAddress(holder)}
                            </strong>
                        </div>

                        <div class="detail-item">
                            <span>Issued On</span>
                            <strong>
                                ${issuedDate}
                            </strong>
                        </div>

                    </div>


                    <div class="verification-warning">

                        ⚠ This credential exists on the blockchain,
                        but it has been revoked by the issuer.

                    </div>

                </div>
            `;

            return;
        }


        /*
            =====================================================
            VALID CREDENTIAL
            =====================================================
        */

        verifyResult.innerHTML = `
            <div class="verification-card valid-card">

                <div class="verification-header">

                    <div>

                        <span class="result-label">
                            VERIFIED CREDENTIAL
                        </span>

                        <h2>
                            ${formattedId}
                        </h2>

                    </div>


                    <span class="status-badge verified">
                        ✓ VERIFIED
                    </span>

                </div>


                <div class="verification-divider"></div>


                <div class="credential-details">

                    <div class="detail-item">

                        <span>
                            Achievement
                        </span>

                        <strong>
                            ${escapeHtml(title)}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <span>
                            Issued By
                        </span>

                        <strong>
                            ${escapeHtml(issuerName)}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <span>
                            Credential Holder
                        </span>

                        <strong class="wallet-address">

                            ${shortenAddress(holder)}

                        </strong>

                    </div>


                    <div class="detail-item">

                        <span>
                            Issued On
                        </span>

                        <strong>
                            ${issuedDate}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <span>
                            Network
                        </span>

                        <strong>
                            Ethereum Sepolia
                        </strong>

                    </div>

                </div>


                <div class="verification-success">

                    ✓ This credential is authentic and permanently
                    recorded on the SkillProof blockchain.

                </div>


                <div class="verification-footer">

                    <span>
                        Contract
                    </span>

                    <a
                        href="https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        ${shortenAddress(CONTRACT_ADDRESS)}
                        ↗
                    </a>

                </div>

            </div>
        `;


        /*
            Toast.
        */

        showToast(
            `${formattedId} is a valid SkillProof credential.`,
            "success"
        );


    } catch (error) {

        console.error(
            "Verification error:",
            error
        );


        showCredentialVerificationError(
            getReadableError(error)
        );
    }
}


/* =========================================================
   CREDENTIAL NOT FOUND
   ========================================================= */

function showCredentialNotFound(id) {

    const verifyResult =
        $("verifyResult");


    if (!verifyResult) {
        return;
    }


    const formattedId =
        formatCredentialId(id);


    verifyResult.classList.remove("hidden");


    verifyResult.innerHTML = `
        <div class="verification-state not-found-state">

            <div class="state-icon error-icon">
                !
            </div>

            <h3>
                Credential not found
            </h3>

            <p>
                <strong>${formattedId}</strong>
                does not exist on the SkillProof
                Sepolia contract.
            </p>

        </div>
    `;


    showToast(
        `${formattedId} does not exist.`,
        "warning"
    );
}


/* =========================================================
   VERIFICATION ERROR
   ========================================================= */

function showCredentialVerificationError(message) {

    const verifyResult =
        $("verifyResult");


    if (!verifyResult) {
        return;
    }


    verifyResult.classList.remove("hidden");


    verifyResult.innerHTML = `
        <div class="verification-state error-state">

            <div class="state-icon error-icon">
                !
            </div>

            <h3>
                Verification failed
            </h3>

            <p>
                ${escapeHtml(message)}
            </p>

        </div>
    `;
}


/* =========================================================
   AUTO VERIFY FROM URL
   ========================================================= */

async function verifyCredentialFromUrl() {

    /*
        Supports:

        verify.html?id=SP-000002
        verify.html?id=000002
        verify.html?id=2
    */

    const params =
        new URLSearchParams(
            window.location.search
        );


    const id =
        params.get("id");


    if (!id) {
        return;
    }


    const input =
        $("verifyInput");


    if (input) {

        input.value =
            id;
    }


    const parsedId =
        parseCredentialId(id);


    if (parsedId === null) {
        return;
    }


    /*
        Automatically verify.
    */

    await verifyCredentialById(
        parsedId
    );
}


/* =========================================================
   REVOKE CREDENTIAL
   ========================================================= */

async function revokeCredential(id) {

    try {

        if (!signer) {

            const account =
                await connectWallet();

            if (!account) {
                return;
            }
        }


        const contract =
            skillProofContract;


        if (!contract) {

            throw new Error(
                "Contract is not connected."
            );
        }


        const confirmed =
            window.confirm(
                `Revoke ${formatCredentialId(id)}? This action cannot be undone.`
            );


        if (!confirmed) {
            return;
        }


        const tx =
            await contract.revokeCredential(id);


        showToast(
            "Revocation transaction submitted.",
            "success"
        );


        await tx.wait();


        showToast(
            `${formatCredentialId(id)} has been revoked.`,
            "success"
        );


        await loadMyCredentials();


    } catch (error) {

        console.error(
            "Revoke error:",
            error
        );

        showToast(
            getReadableError(error),
            "error"
        );
    }
}


/* =========================================================
   AUTHORIZE ISSUER
   ========================================================= */

async function authorizeIssuer(issuerAddress, status = true) {

    try {

        if (!signer) {

            const account =
                await connectWallet();

            if (!account) {
                return;
            }
        }


        if (!ethers.isAddress(issuerAddress)) {

            showToast(
                "Invalid issuer wallet address.",
                "error"
            );

            return;
        }


        const contract =
            skillProofContract;


        const tx =
            await contract.authorizeIssuer(
                issuerAddress,
                status
            );


        showToast(
            "Authorization transaction submitted.",
            "success"
        );


        await tx.wait();


        showToast(
            status
                ? "Issuer authorized successfully."
                : "Issuer authorization removed.",
            "success"
        );


        await refreshDashboard();


    } catch (error) {

        console.error(
            "Authorization error:",
            error
        );

        showToast(
            getReadableError(error),
            "error"
        );
    }
}


/* =========================================================
   READABLE ERROR
   ========================================================= */

function getReadableError(error) {

    if (!error) {
        return "Something went wrong.";
    }


    /*
        MetaMask user rejection.
    */

    if (
        error.code === 4001 ||
        error.code === "ACTION_REJECTED"
    ) {

        return "Transaction was cancelled in MetaMask.";
    }


    /*
        Contract revert reason.
    */

    if (error.reason) {
        return error.reason;
    }


    if (
        error.shortMessage
    ) {

        return error.shortMessage;
    }


    if (
        error.info &&
        error.info.error &&
        error.info.error.message
    ) {

        return error.info.error.message;
    }


    if (error.message) {

        /*
            Remove giant ethers stack where possible.
        */

        const message =
            error.message;

        if (message.length > 250) {

            return message.slice(
                0,
                250
            ) + "...";
        }

        return message;
    }


    return "An unexpected blockchain error occurred.";
}


/* =========================================================
   BUTTON SETUP
   ========================================================= */

function setupEventListeners() {

    /*
        CONNECT WALLET
    */

    const connectBtn =
        $("connectBtn");

    if (connectBtn) {

        connectBtn.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();

                await connectWallet();

            }
        );
    }


    /*
        ALTERNATIVE CONNECT BUTTON
    */

    const connectWalletBtn =
        $("connectWalletBtn");

    if (
        connectWalletBtn &&
        connectWalletBtn !== connectBtn
    ) {

        connectWalletBtn.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();

                await connectWallet();

            }
        );
    }


    /*
        ISSUE CREDENTIAL
    */

    const issueBtn =
        $("issueBtn");

    if (issueBtn) {

        issueBtn.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();

                await issueCredential();

            }
        );
    }


    /*
        VERIFY CREDENTIAL

        IMPORTANT:
        There is ONLY ONE listener.
    */

    const verifyBtn =
        $("verifyBtn");

    if (verifyBtn) {

        verifyBtn.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();

                await verifyCredentialFromInput();

            }
        );
    }


    /*
        ENTER KEY IN VERIFY INPUT
    */

    const verifyInput =
        $("verifyInput");

    if (verifyInput) {

        verifyInput.addEventListener(
            "keydown",
            async function (event) {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    await verifyCredentialFromInput();
                }
            }
        );
    }


    /*
        REFRESH CREDENTIALS
    */

    const refreshBtn =
        $("refreshBtn");

    if (refreshBtn) {

        refreshBtn.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();

                if (!connectedAccount) {

                    await connectWallet();

                } else {

                    await loadMyCredentials();
                }

            }
        );
    }
}


/* =========================================================
   METAMASK ACCOUNT / NETWORK EVENTS
   ========================================================= */

function setupWalletEvents() {

    if (!window.ethereum) {
        return;
    }


    /*
        Account changed.
    */

    window.ethereum.on(
        "accountsChanged",
        async function (accounts) {

            if (!accounts || accounts.length === 0) {

                connectedAccount = null;
                signer = null;
                browserProvider = null;
                skillProofContract = null;

                showToast(
                    "Wallet disconnected.",
                    "warning"
                );

                updateWalletDisconnectedUI();

                return;
            }


            /*
                Reconnect using new account.
            */

            await connectWallet();
        }
    );


    /*
        Network changed.
    */

    window.ethereum.on(
        "chainChanged",
        function () {

            /*
                Reload is the safest way to make sure every
                page uses the new provider/network.
            */

            window.location.reload();
        }
    );
}


/* =========================================================
   DISCONNECTED WALLET UI
   ========================================================= */

function updateWalletDisconnectedUI() {

    const buttons =
        document.querySelectorAll(
            "#connectBtn, #connectWalletBtn"
        );


    buttons.forEach(button => {

        button.textContent =
            "Connect Wallet";

        button.classList.remove(
            "connected"
        );
    });
}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

async function initializeApp() {

    console.log(
        "SkillProof frontend initialized."
    );

    console.log(
        "Contract:",
        CONTRACT_ADDRESS
    );

    console.log(
        "Network: Ethereum Sepolia"
    );


    /*
        Setup buttons.
    */

    setupEventListeners();


    /*
        Setup MetaMask events.
    */

    setupWalletEvents();


    /*
        Detect existing MetaMask connection.

        We DO NOT automatically open MetaMask.
        We only check whether an account is already connected.
    */

    if (window.ethereum) {

        try {

            const accounts =
                await window.ethereum.request({
                    method: "eth_accounts"
                });


            if (
                accounts &&
                accounts.length > 0
            ) {

                await connectWallet();
            }

        } catch (error) {

            console.warn(
                "Existing wallet detection failed:",
                error
            );
        }
    }


    /*
        Automatically verify URL credential.

        Example:

        verify.html?id=SP-000002
    */

    if (
        window.location.pathname
            .toLowerCase()
            .includes("verify.html")
    ) {

        await verifyCredentialFromUrl();
    }
}


/* =========================================================
   START APP
   ========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );

} else {

    initializeApp();
}


/* =========================================================
   EXPOSE FUNCTIONS
   =========================================================

   These are intentionally exposed so inline buttons
   such as onclick="shareCredential(2)" continue working.
*/

window.connectWallet =
    connectWallet;

window.issueCredential =
    issueCredential;

window.verifyCredentialById =
    verifyCredentialById;

window.verifyCredentialFromInput =
    verifyCredentialFromInput;

window.loadMyCredentials =
    loadMyCredentials;

window.shareCredential =
    shareCredential;

window.openCredentialVerification =
    openCredentialVerification;

window.revokeCredential =
    revokeCredential;

window.authorizeIssuer =
    authorizeIssuer;