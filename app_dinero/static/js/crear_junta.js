document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("formCrearJunta");
    const inputDireccion = document.querySelector("input[name='direccion_organizador']");
    const inputAporte = document.querySelector("input[name='cantidad_aporte']");
    const resultado = document.getElementById("resultado");
    const btnCrear = form.querySelector("button[type='submit']");

    // 💲 Etiqueta para mostrar el valor en USD
    const labelUSD = document.createElement("span");
    labelUSD.style.marginLeft = "10px";
    labelUSD.style.fontWeight = "bold";
    labelUSD.style.color = "#2a9d8f";
    inputAporte.insertAdjacentElement("afterend", labelUSD);

    // 1️⃣ Detectar Rainbow Wallet
    const provider = window.ethereum;
    if (!provider) {
        alert("⚠️ Por favor abre esta página desde Rainbow Wallet o instala su extensión.");
        btnCrear.disabled = true;
        return;
    }

    console.log("🌈 Rainbow Wallet detectada");

    // 2️⃣ Configurar red Scroll Sepolia
    const scrollSepolia = {
        chainId: "0x8274f", // ✅ 534351 en decimal
        chainName: "Scroll Sepolia Testnet",
        rpcUrls: ["https://sepolia-rpc.scroll.io"],
        nativeCurrency: { name: "Scroll Sepolia Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://sepolia.scrollscan.com"],
    };

    try {
        const chainId = await provider.request({ method: "eth_chainId" });
        if (chainId !== scrollSepolia.chainId) {
            try {
                await provider.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: scrollSepolia.chainId }],
                });
                console.log("✅ Cambiado a red Scroll Sepolia");
            } catch (error) {
                if (error.code === 4902) {
                    await provider.request({
                        method: "wallet_addEthereumChain",
                        params: [scrollSepolia],
                    });
                    console.log("🆕 Red Scroll Sepolia agregada y conectada");
                } else {
                    throw error;
                }
            }
        }
    } catch (error) {
        console.error("❌ Error al cambiar/agregar red:", error);
        alert("Por favor cambia manualmente a Scroll Sepolia en Rainbow Wallet.");
        return;
    }

    // 3️⃣ Conectar la cuenta Rainbow
    try {
        const cuentas = await provider.request({ method: "eth_requestAccounts" });
        if (cuentas.length === 0) throw new Error("No se detectó ninguna cuenta.");
        inputDireccion.value = cuentas[0];
        console.log("✅ Rainbow conectado:", cuentas[0]);
    } catch (error) {
        console.error("❌ No se pudo conectar con Rainbow Wallet:", error);
        alert("No se pudo conectar con Rainbow Wallet.");
        return;
    }

    // 4️⃣ Función para obtener precio actual de ETH en USD
    async function obtenerPrecioETH() {
        try {
            const resp = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
            const data = await resp.json();
            return data.ethereum.usd;
        } catch (error) {
            console.error("Error al obtener precio ETH:", error);
            labelUSD.textContent = "Error obteniendo precio 😢";
            return null;
        }
    }

    // 💲 Obtener precio una vez al inicio y actualizar cada cierto tiempo
    let precioETH = await obtenerPrecioETH();
    if (!precioETH) precioETH = 0;
    setInterval(async () => {
        const nuevoPrecio = await obtenerPrecioETH();
        if (nuevoPrecio) precioETH = nuevoPrecio;
    }, 300000); // actualiza cada 5 min

    // 🧮 Escuchar cambios en el campo ETH y mostrar USD equivalente
    inputAporte.addEventListener("input", () => {
        const cantidadETH = parseFloat(inputAporte.value);
        if (!isNaN(cantidadETH) && cantidadETH > 0) {
            const cantidadUSD = cantidadETH * precioETH;
            labelUSD.textContent = `≈ $${cantidadUSD.toFixed(2)} USD`;
        } else {
            labelUSD.textContent = "";
        }
    });

    // 5️⃣ Validar aporte entre $50 y $200 USD antes de crear la junta
    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // 👈 Evita recarga

        const cantidadETH = parseFloat(form.cantidad_aporte.value);
        if (isNaN(cantidadETH) || cantidadETH <= 0) {
            alert("Por favor ingresa una cantidad válida de ETH.");
            return;
        }

        const cantidadUSD = cantidadETH * precioETH;

        console.log(`💰 ETH: ${cantidadETH} ≈ USD: ${cantidadUSD.toFixed(2)}`);

        // 🔍 Validación del rango en USD
        if (cantidadUSD < 50 || cantidadUSD > 200) {
            alert(`❌ El aporte debe equivaler entre $50 y $200 USD.
Tu monto actual (${cantidadETH} ETH) equivale a ${cantidadUSD.toFixed(2)} USD.`);
            return;
        }

        btnCrear.disabled = true;
        resultado.innerHTML = `
            Creando junta... 🔄<br>
            Aporte: ${cantidadETH} ETH ≈ ${cantidadUSD.toFixed(2)} USD
        `;

        const formData = new FormData(form);

        try {
            const response = await fetch("", {
                method: "POST",
                body: formData,
                headers: { "X-Requested-With": "XMLHttpRequest" }
            });

            if (!response.ok) throw new Error("Error HTTP: " + response.status);

            const data = await response.json();

            if (data.success) {
                resultado.innerHTML = `
                    ✅ Junta creada exitosamente<br>
                    🧾 Código: ${data.codigo}<br>
                    💰 Colateral total: ${data.colateral} ETH
                `;

                if (data.redirect_url) {
                    window.location.href = data.redirect_url;
                }
            } else {
                resultado.innerHTML = "❌ Error: " + (data.error || "No se pudo crear la junta.");
            }
        } catch (error) {
            console.error("❌ Error al crear la junta:", error);
            resultado.innerHTML = "❌ Ocurrió un error al crear la junta.";
        } finally {
            btnCrear.disabled = false;
        }
    });
});
