// ==================== CONFIGURACIÓN BASE ====================
const cantidadParticipantes = juntaData.numero_participantes;
const contractAddress = "0xD5cfb65385AC6E00d74fD17E03C784b52BF316bC"; // tu contrato
const contractABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "who",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Aportado",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "aportar",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "iniciarJunta",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [],
		"name": "JuntaIniciada",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "aportes",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "balance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "empezada",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "organizador",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "total",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]


let pagosValidados = 0;

// ==================== GENERAR INPUTS ====================
document.addEventListener("DOMContentLoaded", () => {
    const contenedor = document.getElementById("contenedorPagos");
    const btnEmpezar = document.getElementById("btnEmpezar");

    // 🧩 Validar cantidad de participantes
    if (cantidadParticipantes < 3 || cantidadParticipantes > 6) {
        alert("⚠️ La junta debe tener entre 3 y 6 participantes.");
        btnEmpezar.disabled = true;
        return;
    }

    for (let i = 0; i < cantidadParticipantes; i++) {
        const div = document.createElement("div");
        div.className = "participante";
        div.innerHTML = `
            <label>Participante ${i + 1}:</label>
            <input type="text" placeholder="Dirección Wallet" class="direccion" id="addr_${i}">
            <button onclick="pagar(${i})">💸 Pagar</button>
            <span id="check_${i}" style="color: green; display:none;">✔️ Pagado</span>
            <hr>
        `;
        contenedor.appendChild(div);
    }

    btnEmpezar.addEventListener("click", empezarJunta);
});

// ==================== FUNCIONES ====================

// --- Pagar colateral ---
async function pagar(index) {
    if (!window.ethereum) {
        alert("⚠️ Abre esta página desde Rainbow Wallet o MetaMask.");
        return;
    }

    const inputAddress = document.getElementById(`addr_${index}`).value.trim();
    if (!inputAddress) {
        alert("⚠️ Ingresa tu dirección antes de pagar.");
        return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const [connectedAddress] = await provider.send("eth_requestAccounts", []);

    if (connectedAddress.toLowerCase() !== inputAddress.toLowerCase()) {
        alert("❌ La dirección conectada no coincide con la ingresada.");
        return;
    }

    // ✅ Obtener precio actual del ETH en USD
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
    const data = await response.json();
    const ethPriceUsd = data.ethereum.usd;

    // ⚙️ Verificar que el aporte esté dentro del rango permitido
    let aporteUsd = 150; // puedes personalizar este valor según tu lógica
    if (aporteUsd < 50 || aporteUsd > 200) {
        alert("⚠️ El aporte debe estar entre $50 y $200 USD.");
        return;
    }

    // 💵 Calcular el equivalente en ETH
    const aporteEth = aporteUsd / ethPriceUsd;
    alert(`💰 Colateral: $${aporteUsd} USD ≈ ${aporteEth.toFixed(6)} ETH`);

    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    try {
        // 🧮 Verificar saldo antes de enviar
        const balanceWei = await provider.getBalance(connectedAddress);
        const balanceEth = parseFloat(ethers.formatEther(balanceWei));

        const totalNecesario = aporteEth + 0.001; // margen gas
        if (balanceEth < totalNecesario) {
            alert(`❌ Saldo insuficiente.\nTienes ${balanceEth.toFixed(6)} ETH y necesitas al menos ${totalNecesario.toFixed(6)} ETH (incluyendo gas).`);
            return;
        }

        // 🚀 Enviar el pago
        const tx = await contract.aportar({
            value: ethers.parseEther(String(aporteEth))
        });
        await tx.wait();

        document.getElementById(`check_${index}`).style.display = "inline";
        pagosValidados++;
        if (pagosValidados === cantidadParticipantes) {
            document.getElementById("btnEmpezar").disabled = false;
        }

        alert(`✅ Pago validado para participante ${index + 1}`);
    } catch (e) {
        console.error(e);
        alert("❌ Error al enviar el pago: " + e.message);
    }
}

// --- Empezar la junta ---
async function empezarJunta() {
    if (!window.ethereum) {
        alert("⚠️ Abre esta página desde Rainbow Wallet o MetaMask.");
        return;
    }

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        const tx = await contract.iniciarJunta();
        await tx.wait();

        alert("🚀 ¡Junta iniciada exitosamente!");
    } catch (e) {
        console.error(e);
        alert("Error al iniciar la junta: " + e.message);
    }
}



