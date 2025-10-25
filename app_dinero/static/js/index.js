document.addEventListener("DOMContentLoaded", async () => {
    const connectButton = document.getElementById("connectButton");
    const walletAddress = document.getElementById("walletAddress");

    // Detectar Rainbow Wallet (usa la misma interfaz que MetaMask)
    if (typeof window.ethereum === "undefined") {
        connectButton.innerText = "Instalar Rainbow";
        connectButton.onclick = () => {
            window.open("https://rainbow.me/download", "_blank");
        };
        return;
    }

    // Evento de clic
    connectButton.addEventListener("click", async () => {
        try {
            // Solicitar conexión
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            const account = accounts[0];

            // Mostrar dirección
            walletAddress.textContent = `Conectado con Rainbow: ${account}`;
            connectButton.textContent = "Conectado ✅";
            connectButton.disabled = true;

            // Guardar en localStorage
            localStorage.setItem("walletAddress", account);

            // Verificar red (Scroll Sepolia)
            const chainId = await window.ethereum.request({ method: "eth_chainId" });
            if (chainId !== "0x8274f") { // ID de Scroll Sepolia = 534351 decimal
                alert("Por favor cambia la red a Scroll Sepolia en tu Rainbow Wallet.");
            }

        } catch (error) {
            console.error(error);
            alert("Error al conectar con Rainbow Wallet");
        }
    });
});

