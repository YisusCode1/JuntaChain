// ==================== CONFIGURACIÓN BASE ====================
if (typeof juntaData === "undefined") {
    alert("⚠️ Error: No se encontró la información de la junta (juntaData).");
    throw new Error("juntaData no está definida.");
}


const cantidadParticipantes = juntaData.numero_participantes;
const contractAddress = "0x3D624d4083b67C21720B076d6FBcc95d8d567EFc";

const contractABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_organizador",
				"type": "address"
			}
		],
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
		"name": "getParticipantes",
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
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "participantes",
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
];

let pagosValidados = 0;
let contract, provider, signer;


async function inicializar() {
    if (!window.ethereum) {
        alert("⚠️ Abre esta página desde Rainbow Wallet o MetaMask compatible.");
        return;
    }

    try {
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();

        contract = new ethers.Contract(contractAddress, contractABI, signer);

        console.log("✅ Contrato conectado:", contractAddress);

        generarInputs();
        await marcarPagosExistentes();
    } catch (err) {
        console.error("Error al inicializar:", err);
        alert("Error al conectar con la blockchain. Ver consola.");
    }
}

// ==================== GENERAR INPUTS ====================
function generarInputs() {
    const contenedor = document.getElementById("contenedorPagos");
    contenedor.innerHTML = "";

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

    const btnAporte = document.getElementById("btnAporte");
    btnAporte.addEventListener("click", iniciarAporte);
    btnAporte.disabled = true;
}

// ==================== MARCAR PAGOS EXISTENTES ====================
async function marcarPagosExistentes() {
    pagosValidados = 0;
    try {
        const participantes = await contract.getParticipantes();
        console.log("👥 Participantes actuales:", participantes);

        for (let i = 0; i < cantidadParticipantes; i++) {
            const input = document.getElementById(`addr_${i}`);
            const check = document.getElementById(`check_${i}`);
            const participanteAddress = participantes[i] || "";

            input.value = participanteAddress;

            if (participanteAddress && participanteAddress !== "0x0000000000000000000000000000000000000000") {
                try {
                    const aporte = await contract.aportes(participanteAddress);
                    if (Number(aporte) > 0) {
                        check.style.display = "inline";
                        pagosValidados++;
                    }
                } catch(e) {
                    console.warn(`No se pudo consultar aporte de ${participanteAddress}:`, e);
                }
            }
        }

        const btnAporte = document.getElementById("btnAporte");
        btnAporte.disabled = pagosValidados !== cantidadParticipantes;

        if (pagosValidados === cantidadParticipantes) {
            document.getElementById("estadoPagos").textContent = "✅ Todos los participantes han pagado su colateral.";
        }
    } catch (e) {
        console.error("Error al marcar pagos:", e);
    }
}

// ==================== PAGO INDIVIDUAL ====================
async function pagar(index) {
    const inputAddress = document.getElementById(`addr_${index}`).value.trim();
    if (!inputAddress) {
        alert("Ingresa tu dirección");
        return;
    }

    const [connectedAddress] = await provider.send("eth_requestAccounts", []);
    if (connectedAddress.toLowerCase() !== inputAddress.toLowerCase()) {
        alert("La dirección conectada no coincide con la ingresada");
        return;
    }

    const aporteEth = 0.01; // Colateral, ajustar según lógica
    try {
        const tx = await contract.aportar({ value: ethers.parseEther(String(aporteEth)) });
        await tx.wait();

        document.getElementById(`check_${index}`).style.display = "inline";
        pagosValidados++;

        if (pagosValidados === cantidadParticipantes) {
            document.getElementById("btnAporte").disabled = false;
            document.getElementById("estadoPagos").textContent = "✅ Todos los participantes completaron el pago del colateral.";
        }

        alert("Pago validado ✅");
    } catch (e) {
        console.error("Error al pagar:", e);
        alert("Error al pagar: " + e.message);
    }
}

// ==================== INICIO DEL APORTE ====================
function iniciarAporte() {
    document.getElementById("btnAporte").disabled = true;
    activarTemporizador();
}

// ==================== TEMPORIZADOR 48 HORAS ====================
let temporizadorActivo = false;
let tiempoRestante = 48 * 60 * 60;
let temporizadorInterval;

function activarTemporizador() {
    if (temporizadorActivo) return;
    temporizadorActivo = true;
    const countdown = document.getElementById("temporizador");
    countdown.style.display = "block";

    function actualizarTemporizador() {
        const horas = Math.floor(tiempoRestante / 3600);
        const minutos = Math.floor((tiempoRestante % 3600) / 60);
        const segundos = tiempoRestante % 60;

        countdown.textContent = `⏳ Tiempo restante: ${horas}h ${minutos}m ${segundos}s`;

        if (tiempoRestante <= 0) {
            clearInterval(temporizadorInterval);
            countdown.textContent = "⏰ Tiempo finalizado";
            sorteoFinal();
        } else {
            tiempoRestante--;
        }
    }

    actualizarTemporizador();
    temporizadorInterval = setInterval(actualizarTemporizador, 1000);
}

// ==================== SORTEO FINAL ====================
function sorteoFinal() {
    const resultadosDiv = document.getElementById("resultadosSorteo");
    const participantes = Array.from(document.querySelectorAll(".direccion")).map(input => input.value);
    const ganador = participantes[0]; // Organizador gana por defecto
    resultadosDiv.textContent = `🏆 Ganador del sorteo: ${ganador}`;
    alert(`🏆 Sorteo finalizado. Ganador: ${ganador}`);
}

// ==================== INICIO ====================
document.addEventListener("DOMContentLoaded", inicializar);





