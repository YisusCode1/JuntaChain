document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("formCrearJunta");
    const inputDireccion = document.querySelector("input[name='direccion_organizador']");
    const inputAporte = document.querySelector("input[name='cantidad_aporte']");
    const resultado = document.getElementById("resultado");
    const btnCrear = form.querySelector("button[type='submit']");

    // Mostrar valor USD estimado
    const labelUSD = document.createElement("span");
    labelUSD.style.marginLeft = "10px";
    labelUSD.style.fontWeight = "bold";
    labelUSD.style.color = "#2a9d8f";
    inputAporte.insertAdjacentElement("afterend", labelUSD);

    // ==================== CONEXIÓN WALLET ====================
    if (!window.ethereum) {
        alert("⚠️ Abre esta página desde Rainbow Wallet o MetaMask.");
        btnCrear.disabled = true;
        return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    inputDireccion.value = address;
    console.log("✅ Conectado:", address);

    // ==================== CONFIGURACIÓN DEL CONTRATO FACTORY ====================
    const factoryAddress = "0xED37Ee8928266C14d5f14DD38C1528dc22c86f2b "; // ⚠️ Reemplaza con tu contrato desplegado
    const factoryABI = [
	{
		"inputs": [],
		"name": "crearJunta",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "organizador",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "juntaAddress",
				"type": "address"
			}
		],
		"name": "JuntaCreada",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "obtenerJuntas",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "todasLasJuntas",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

    const contract = new ethers.Contract(factoryAddress, factoryABI, signer);

    // ==================== PRECIO DE ETH ====================
    async function obtenerPrecioETH() {
        try {
            const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
            const data = await res.json();
            return data.ethereum.usd;
        } catch {
            labelUSD.textContent = "Error obteniendo precio 😢";
            return 0;
        }
    }

    let precioETH = await obtenerPrecioETH();

    inputAporte.addEventListener("input", () => {
        const eth = parseFloat(inputAporte.value);
        if (!isNaN(eth) && eth > 0) {
            const usd = eth * precioETH;
            labelUSD.textContent = `≈ $${usd.toFixed(2)} USD`;
        } else {
            labelUSD.textContent = "";
        }
    });

    // ==================== SUBMIT ====================
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const cantidadETH = parseFloat(inputAporte.value);
        if (isNaN(cantidadETH) || cantidadETH <= 0) {
            alert("Ingresa un valor válido de ETH.");
            return;
        }

        const cantidadUSD = cantidadETH * precioETH;
        if (cantidadUSD < 50 || cantidadUSD > 200) {
            alert(`❌ El aporte debe equivaler entre $50 y $200 USD.
Tu monto actual equivale a ${cantidadUSD.toFixed(2)} USD.`);
            return;
        }

        btnCrear.disabled = true;
        resultado.innerHTML = "⏳ Creando junta on-chain...";

        try {
            // Crear junta en blockchain
            const tx = await contract.crearJunta();
            const receipt = await tx.wait();

            // Obtener dirección del evento
            const evento = receipt.logs
                .map(log => {
                    try {
                        return contract.interface.parseLog(log);
                    } catch { return null; }
                })
                .find(e => e && e.name === "JuntaCreada");

            const juntaAddress = evento ? evento.args.juntaAddress : "No detectado";
            console.log("🧾 Nueva Junta:", juntaAddress);

            // Guardar también en Django
            const formData = new FormData(form);
            formData.append("contract_address", juntaAddress);

            const response = await fetch("", {
                method: "POST",
                body: formData,
                headers: { "X-Requested-With": "XMLHttpRequest" }
            });

            const data = await response.json();
            if (data.success) {
                resultado.innerHTML = `✅ Junta creada correctamente<br>📜 Contrato: ${juntaAddress}`;
                if (data.redirect_url) window.location.href = data.redirect_url;
            } else {
                resultado.innerHTML = "❌ Error guardando en servidor.";
            }
        } catch (err) {
            console.error("Error al crear junta:", err);
            resultado.innerHTML = "❌ Falló la creación on-chain.";
        } finally {
            btnCrear.disabled = false;
        }
    });
});


