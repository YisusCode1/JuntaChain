document.addEventListener("DOMContentLoaded", async () => {
    const connectButton = document.getElementById("connectButton");
    const walletAddress = document.getElementById("walletAddress");
    const mainMenu = document.getElementById("mainMenu");
    const btnCrearJunta = document.getElementById("btnCrearJunta");

    const SCROLL_SEPOLIA_CHAIN_ID = "0x8274f"; // Scroll Sepolia Testnet (534351 decimal)

    // Detectar si existe Rainbow Wallet
    if (typeof window.ethereum === "undefined") {
        connectButton.innerText = "Instalar Rainbow";
        connectButton.onclick = () => {
            window.open("https://rainbow.me/download", "_blank");
        };
        return;
    }

    // Cambiar a Scroll Sepolia si no está conectado
    async function switchToScrollSepolia() {
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: SCROLL_SEPOLIA_CHAIN_ID }],
            });
            console.log("✅ Cambiado a Scroll Sepolia");
        } catch (switchError) {
            // Si no está agregada la red
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [
                            {
                                chainId: SCROLL_SEPOLIA_CHAIN_ID,
                                chainName: "Scroll Sepolia Testnet",
                                nativeCurrency: {
                                    name: "ETH",
                                    symbol: "ETH",
                                    decimals: 18,
                                },
                                rpcUrls: ["https://sepolia-rpc.scroll.io/"],
                                blockExplorerUrls: ["https://sepolia.scrollscan.com/"],
                            },
                        ],
                    });
                } catch (addError) {
                    console.error("❌ Error al agregar Scroll Sepolia:", addError);
                }
            } else {
                console.error("❌ Error al cambiar de red:", switchError);
            }
        }
    }

    // Evento de conexión
    connectButton.addEventListener("click", async () => {
        try {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            const account = accounts[0];
            walletAddress.textContent = `Conectado con Rainbow: ${account}`;
            connectButton.textContent = "Conectado ✅";
            connectButton.disabled = true;
            localStorage.setItem("walletAddress", account);

            // Verificar red
            const chainId = await window.ethereum.request({ method: "eth_chainId" });
            if (chainId !== SCROLL_SEPOLIA_CHAIN_ID) {
                console.log("⚠️ No estás en Scroll Sepolia, cambiando...");
                await switchToScrollSepolia();
            }

            const updatedChainId = await window.ethereum.request({ method: "eth_chainId" });
            if (updatedChainId === SCROLL_SEPOLIA_CHAIN_ID) {
                mainMenu.style.display = "block";
                btnCrearJunta.style.display = "inline-block";
            } else {
                alert("Por favor cambia a la red Scroll Sepolia.");
            }
        } catch (error) {
            console.error(error);
            alert("Error al conectar con Rainbow Wallet");
        }
    });

    // Acción del botón Crear Junta (puedes cambiar el enlace)
    btnCrearJunta.addEventListener("click", () => {
        window.location.href = "/crear_junta/"; // Cambia según tu URL real
    });
});




