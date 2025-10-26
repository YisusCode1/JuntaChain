// ==================== CONFIGURACIÓN BASE ====================
const cantidadParticipantes = juntaData.numero_participantes; // viene de Django
const contractAddress = juntaData.contract_address; // dirección del contrato de esta junta
const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "who", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "Aportado",
        "type": "event"
    },
    { "inputs": [], "name": "aportar", "outputs": [], "stateMutability": "payable", "type": "function" },
    { "inputs": [], "name": "iniciarJunta", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "anonymous": false, "inputs": [], "name": "JuntaIniciada", "type": "event" },
    { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "aportes", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "balance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "empezada", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "getParticipantes", "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "organizador", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "participantes", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "total", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

let pagosValidados = 0;
let contract, provider;

// ==================== INICIALIZAR ====================
async function inicializar() {
    if (!window.ethereum) {
        alert("⚠️ Abre esta página desde Rainbow Wallet (o MetaMask compatible).");
        return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    contract = new ethers.Contract(contractAddress, contractABI, signer);

    generarInputs();
    await marcarPagosExistentes();
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
    btnAporte.addEventListener("click", activarTemporizador);
    btnAporte.disabled = true;
}

// ==================== MARCAR PAGOS EXISTENTES ====================
async function marcarPagosExistentes() {
    pagosValidados = 0;

    for (let i = 0; i < cantidadParticipantes; i++) {
        const input = document.getElementById(`addr_${i}`);
        const check = document.getElementById(`check_${i}`);

        const participanteAddress = input.value || await contract.participantes(i);
        input.value = participanteAddress;

        const aporte = await contract.aportes(participanteAddress);
        if (aporte > 0) {
            check.style.display = "inline";
            pagosValidados++;
        }
    }

    const btnAporte = document.getElementById("btnAporte");
    btnAporte.disabled = pagosValidados !== cantidadParticipantes;

    if (pagosValidados === cantidadParticipantes) {
        document.getElementById("estadoPagos").textContent = "✅ Todos los participantes han pagado su colateral.";
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

    const aporteEth = 0.01; // monto ejemplo, podrías hacerlo dinámico desde Django

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
        console.error(e);
        alert("Error al pagar: " + e.message);
    }
}

// ==================== TEMPORIZADOR 48 HORAS ====================
let temporizadorActivo = false;
let tiempoRestante = 48 * 60 * 60; // 48 horas en segundos
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
            alert("El tiempo de aporte ha terminado.");
        } else {
            tiempoRestante--;
        }
    }

    actualizarTemporizador();
    temporizadorInterval = setInterval(actualizarTemporizador, 1000);
}

// ==================== INICIO ====================
document.addEventListener("DOMContentLoaded", inicializar);




