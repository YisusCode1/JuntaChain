// ==================== CONFIGURACIÓN BASE ====================
const cantidadParticipantes = juntaData.numero_participantes; // viene de Django
const contractAddress = "0xb17639947f7817131cb66E23820b868306a7c9d7"; // tu contrato
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
        alert("⚠️ Abre esta página desde Rainbow Wallet o MetaMask.");
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
    contenedor.innerHTML = ""; // limpiar

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

    const btnEmpezar = document.getElementById("btnEmpezar");
    btnEmpezar.addEventListener("click", empezarJunta);
}

// ==================== MARCAR PAGOS EXISTENTES ====================
async function marcarPagosExistentes() {
    for (let i = 0; i < cantidadParticipantes; i++) {
        const input = document.getElementById(`addr_${i}`);
        const check = document.getElementById(`check_${i}`);

        // Esperar a que el usuario ingrese la dirección o usar participantes del contrato
        const participanteAddress = input.value || await contract.participantes(i);
        input.value = participanteAddress;

        const aporte = await contract.aportes(participanteAddress);
        if (aporte > 0) {
            check.style.display = "inline";
            pagosValidados++;
        }
    }

    document.getElementById("btnEmpezar").disabled = pagosValidados !== cantidadParticipantes;
}

// ==================== FUNCIONES PRINCIPALES ====================
async function pagar(index) {
    const inputAddress = document.getElementById(`addr_${index}`).value.trim();
    if (!inputAddress) { alert("Ingresa tu dirección"); return; }

    const [connectedAddress] = await provider.send("eth_requestAccounts", []);
    if (connectedAddress.toLowerCase() !== inputAddress.toLowerCase()) {
        alert("La dirección conectada no coincide");
        return;
    }

    const aporteEth = 0.01; // ejemplo fijo, cambiar según lógica
    try {
        const tx = await contract.aportar({ value: ethers.parseEther(String(aporteEth)) });
        await tx.wait();

        document.getElementById(`check_${index}`).style.display = "inline";
        pagosValidados++;
        document.getElementById("btnEmpezar").disabled = pagosValidados !== cantidadParticipantes;
        alert("Pago validado ✅");
    } catch (e) {
        console.error(e);
        alert("Error al pagar: " + e.message);
    }
}

async function empezarJunta() {
    try {
        const tx = await contract.iniciarJunta();
        await tx.wait();
        alert("🚀 Junta iniciada!");
    } catch (e) {
        console.error(e);
        alert("Error al iniciar la junta: " + e.message);
    }
}

// ==================== EVENTO DOM ====================
document.addEventListener("DOMContentLoaded", inicializar);




