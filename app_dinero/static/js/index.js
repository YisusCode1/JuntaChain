document.addEventListener("DOMContentLoaded", async () => {
    console.log("✅ index.js cargado correctamente");

    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const crearJuntaBtn = document.getElementById("crear-junta-btn");
    const walletInfo = document.getElementById("walletInfo");
    const walletAddressSpan = document.getElementById("walletAddress");
    const walletBalanceSpan = document.getElementById("walletBalance");
    const menu = document.getElementById("menu");

    const provider = window.ethereum;

    // 🔹 Verificar si Rainbow (o cualquier wallet EIP-1193) está disponible
    if (!provider) {
        alert("⚠️ Por favor abre esta página desde Rainbow Wallet o una wallet compatible con Scroll.");
        return;
    }

    console.log("🌈 Rainbow Wallet o wallet compatible detectada ✅");
    connectWalletBtn.style.display = "inline-block";

    // ⚙️ Función para actualizar la interfaz de la wallet
    async function updateWalletUI(account) {
        if (!account) {
            walletInfo.style.display = "none";
            menu.style.display = "none";
            crearJuntaBtn.disabled = true;
            walletAddressSpan.textContent = "";
            walletBalanceSpan.textContent = "0";
            return;
        }

        walletInfo.style.display = "block";
        menu.style.display = "block";
        crearJuntaBtn.disabled = false;
        walletAddressSpan.textContent = account;

        const ethersProvider = new ethers.BrowserProvider(provider);
        const balanceWei = await ethersProvider.getBalance(account);
        const balanceEth = ethers.formatEther(balanceWei);
        walletBalanceSpan.textContent = parseFloat(balanceEth).toFixed(4);
    }

    // 🧭 Forzar conexión a Scroll Sepolia Testnet
    async function switchToScrollSepolia() {
        const scrollSepolia = {
            chainId: "0x82750", // ✅ Correcto ID de Scroll Sepolia
            chainName: "Scroll Sepolia Testnet",
            rpcUrls: ["https://sepolia-rpc.scroll.io"],
            nativeCurrency: { name: "Scroll Sepolia Ether", symbol: "ETH", decimals: 18 },
            blockExplorerUrls: ["https://sepolia.scrollscan.com"]
        };

        try {
            await provider.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: scrollSepolia.chainId }]
            });
            console.log("✅ Conectado a Scroll Sepolia");
        } catch (error) {
            if (error.code === 4902) {
                console.log("🆕 Red no encontrada, agregándola...");
                await provider.request({
                    method: "wallet_addEthereumChain",
                    params: [scrollSepolia]
                });
                console.log("✅ Scroll Sepolia agregada y conectada");
            } else {
                console.error("❌ Error al conectar a la red:", error);
            }
        }
    }

    // 🔗 Conectar Wallet
    connectWalletBtn.addEventListener("click", async () => {
        console.log("🔗 Usuario pidió conectar wallet...");
        try {
            await switchToScrollSepolia();
            const accounts = await provider.request({ method: "eth_requestAccounts" });
            if (accounts.length > 0) await updateWalletUI(accounts[0]);
        } catch (error) {
            console.error("❌ Error al conectar la wallet:", error);
            alert("No se pudo conectar con Rainbow Wallet.");
        }
    });

    // 🧩 Redireccionar a crear_junta
    crearJuntaBtn.addEventListener("click", () => {
        const url = crearJuntaBtn.dataset.url;
        window.location.href = url;
    });

    // 👂 Detectar cambios de cuenta o red
    if (provider) {
        provider.on("accountsChanged", async (accounts) => {
            if (accounts.length === 0) {
                console.log("🔒 Usuario desconectó su wallet");
                await updateWalletUI(null);
            } else {
                await updateWalletUI(accounts[0]);
            }
        });

        provider.on("chainChanged", async (chainId) => {
            console.log("🔄 Red cambiada:", chainId);
            if (chainId !== "0x82750") {
                console.warn("⚠️ Red no es Scroll Sepolia, desconectando wallet.");
                await updateWalletUI(null);
            }
        });
    }
});




