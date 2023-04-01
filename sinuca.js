const canvas = document.getElementById('sinuca');
const ctx = canvas.getContext('2d');


let showGuides = true;


const mouse = {
    x: 0,
    y: 0,
};

function calcularDistancia(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

function bolasParadas() {
    showGuides = false;
    setTimeout(() => {
        showGuides = true;
    }, 6000);
}

function calcularPosicaoAntesColisao(x1, y1, angle, distancia) {
    const x = x1 - distancia * Math.cos(angle);
    const y = y1 - distancia * Math.sin(angle);
    return { x, y };
}

function encontrarIntersecao(x1, y1, x2, y2) {
    let intersecaoX = x2;
    let intersecaoY = y2;

    bolas.forEach((bola) => {
        if (bola === bolaBranca) return;

        const distancia = calcularDistancia(x1, y1, bola.x, bola.y);
        const raioSoma = bola.raio + bolaBranca.raio;

        if (distancia < raioSoma) {
            const angulo = Math.atan2(bola.y - y1, bola.x - x1);
            intersecaoX = bola.x - (raioSoma * Math.cos(angulo));
            intersecaoY = bola.y - (raioSoma * Math.sin(angulo));
        }
    });

    return { x: intersecaoX, y: intersecaoY };
}

function calcularCor(distancia) {
    const maxDistancia = 200; // Distância máxima para o gradiente
    const clampedDistancia = Math.min(distancia, maxDistancia);
    const percentual = clampedDistancia / maxDistancia;

    const r = Math.floor(255 * percentual);
    const g = Math.floor(255 * (1 - percentual));
    const b = 0;

    return `rgb(${r}, ${g}, ${b})`;
}

function desenharLinhaVertical(x, y, angle) {
    const lineLength = 8;
    const x1 = x - lineLength * Math.cos(angle);
    const y1 = y - lineLength * Math.sin(angle);
    const x2 = x + lineLength * Math.cos(angle);
    const y2 = y + lineLength * Math.sin(angle);

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    const distance = calcularDistancia(x, y, bolaBranca.x, bolaBranca.y);
    const gradientStops = [
        { color: "rgb(0, 255, 0)", distance: 50 },
        { color: "yellow", distance: 100 },
        { color: "orange", distance: 150 },
        { color: "red", distance: 200 },
    ];

    gradientStops.forEach((stop) => {
        const position = Math.max(Math.min(stop.distance / distance, 1), 0);
        gradient.addColorStop(position, stop.color);
    });

    // Desenha a borda branca
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 6; // Ajuste a largura da borda conforme necessário
    ctx.stroke();
    ctx.closePath();

    // Desenha a linha principal por cima da borda
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.closePath();
}

function desenharBolaTransparente(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, bolaBranca.raio, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Cor branca semi-transparente
    ctx.fill();
    ctx.closePath();
}


function extendLine(x1, y1, angle) {
    let x2, y2;
    const step = 5;

    while (true) {
        x2 = x1 + step * Math.cos(angle);
        y2 = y1 + step * Math.sin(angle);

        if (
            x2 < 0 ||
            x2 > canvas.width ||
            y2 < 0 ||
            y2 > canvas.height ||
            bolas.some((bola) => calcularDistancia(x1, y1, bola.x, bola.y) <= bola.raio - 1)
        ) {
            break;
        }

        x1 = x2;
        y1 = y2;
    }

    return { x2, y2 };
}


class Bola {
    constructor(x, y, raio, cor) {
        this.x = x;
        this.y = y;
        this.raio = raio;
        this.cor = cor;
    }

    vx = 0;
    vy = 0;

    desenhar() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);
        if (this.listrada) {
            ctx.fillStyle = this.cor.cor;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.raio, 0, Math.PI);
            ctx.fillStyle = 'white';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.raio - 2, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'white';
            ctx.stroke();
            ctx.lineWidth = 1;
        } else {
            ctx.fillStyle = this.cor;
            ctx.fill();
        }
        ctx.closePath();

        // Adicione o contorno preto
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.closePath();
    }


    atualizar() {
        this.x += this.vx;
        this.y += this.vy;

        // Adicione atrito para diminuir a velocidade da bola
        this.vx *= 0.98;
        this.vy *= 0.98;

        // Verifique as colisões com as bordas da mesa
        if (this.x - this.raio < 0 || this.x + this.raio > canvas.width) {
            this.vx = -this.vx;
        }
        if (this.y - this.raio < 0 || this.y + this.raio > canvas.height) {
            this.vy = -this.vy;
        }
    }
}

const bolaBranca = new Bola(100, 200, 10, 'white');
const bolas = [bolaBranca];

// Cores das bolas lisas e listradas
// Crie as bolas lisas (1-7) e listradas (9-15)
const cores = [
    '#F9B21C',
    '#1D44C7',
    '#D52519',
    '#4E409E',
    '#FF9557',
    '#129158',
    '#701417',];

bolas.push(new Bola(0, 0, 10, 'black'));

for (let i = 1; i <= 7; i++) {
    bolas.push(new Bola(0, 0, 10, cores[i - 1])); // Bolas lisas
    bolas.push(new Bola(0, 0, 10, { cor: cores[i - 1], listrada: true })); // Bolas listradas
}

// Posicione as bolas em forma de triângulo
const inicioTrianguloX = canvas.width * 0.75;
const inicioTrianguloY = canvas.height / 2;
let linha = 1;
let bolasNaLinha = 0;
let offsetX = 0;
let indiceBola = 2;

for (let i = 0; i < 15; i++) {
    if (i === 4) {
        // Posicione a bola 8 no centro do triângulo
        bolas[1].x = inicioTrianguloX + offsetX;
        bolas[1].y = inicioTrianguloY;
    } else {
        // Posicione as bolas lisas e listradas
        bolas[indiceBola].x = inicioTrianguloX + offsetX;
        bolas[indiceBola].y = inicioTrianguloY - (linha - 1) * bolas[indiceBola].raio + 2 * bolas[indiceBola].raio * bolasNaLinha;
        indiceBola++;
    }

    bolasNaLinha++;

    if (bolasNaLinha === linha) {
        linha++;
        bolasNaLinha = 0;
        offsetX += bolas[i].raio * Math.sqrt(3);
    }
}

function desenharTaco() {
    const angulo = Math.atan2(mouse.y - bolaBranca.y, mouse.x - bolaBranca.x);
    const x1 = bolaBranca.x + (bolaBranca.raio + 20) * Math.cos(angulo); // Adicione 20 à distância da bola branca
    const y1 = bolaBranca.y + (bolaBranca.raio + 20) * Math.sin(angulo); // Adicione 20 à distância da bola branca
    const { x2, y2 } = extendLine(x1, y1, angulo);

    const distancia = Math.min(calcularDistancia(bolaBranca.x, bolaBranca.y, mouse.x, mouse.y), 75);
    const tacoComprimento = 200;
    const tacoInicio = (distancia + tacoComprimento) - tacoComprimento;
    const tacoX1 = bolaBranca.x - tacoInicio * Math.cos(angulo);
    const tacoY1 = bolaBranca.y - tacoInicio * Math.sin(angulo);
    const tacoX2 = bolaBranca.x - (tacoInicio + tacoComprimento) * Math.cos(angulo);
    const tacoY2 = bolaBranca.y - (tacoInicio + tacoComprimento) * Math.sin(angulo);
    const { x: intersecaoX, y: intersecaoY } = encontrarIntersecao(x1, y1, x2, y2);

    // Desenhar a linha branca pontilhada
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(intersecaoX, intersecaoY);
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Configurar linha pontilhada
    ctx.lineDashOffset = 0; // Adicione esta linha
    ctx.strokeStyle = 'white';
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.setLineDash([]); // Restaurar linha sólida
    ctx.closePath();

    // Desenhar o taco
    ctx.beginPath();
    ctx.moveTo(tacoX1, tacoY1);
    ctx.lineTo(tacoX2, tacoY2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#8B4513';
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.closePath();
}

// Função para verificar se duas bolas estão colidindo
function colidindo(bola1, bola2) {
    return calcularDistancia(bola1.x, bola1.y, bola2.x, bola2.y) <= bola1.raio + bola2.raio;
}

// Função para resolver a colisão entre duas bolas
function resolverColisao(bola1, bola2) {
    const dx = bola1.x - bola2.x;
    const dy = bola1.y - bola2.y;
    const dist = calcularDistancia(bola1.x, bola1.y, bola2.x, bola2.y);

    // Corrigir a sobreposição entre as bolas
    const overlap = (bola1.raio + bola2.raio - dist) / 2;
    bola1.x += (overlap * (bola1.x - bola2.x)) / dist;
    bola1.y += (overlap * (bola1.y - bola2.y)) / dist;
    bola2.x -= (overlap * (bola1.x - bola2.x)) / dist;
    bola2.y -= (overlap * (bola1.y - bola2.y)) / dist;

    // Encontre o ângulo entre as bolas
    const angulo = Math.atan2(dy, dx);

    // Calcule a velocidade resultante das bolas após a colisão
    const v1 = Math.sqrt(bola1.vx * bola1.vx + bola1.vy * bola1.vy);
    const v2 = Math.sqrt(bola2.vx * bola2.vx + bola2.vy * bola2.vy);

    const direcao1 = Math.atan2(bola1.vy, bola1.vx);
    const direcao2 = Math.atan2(bola2.vy, bola2.vx);

    const v1x = v1 * Math.cos(direcao1 - angulo);
    const v1y = v1 * Math.sin(direcao1 - angulo);
    const v2x = v2 * Math.cos(direcao2 - angulo);
    const v2y = v2 * Math.sin(direcao2 - angulo);

    // Calcule as novas velocidades após a colisão
    const novaV1x = ((bola1.raio - bola2.raio) * v1x + 2 * bola2.raio * v2x) / (bola1.raio + bola2.raio);
    const novaV2x = ((bola2.raio - bola1.raio) * v2x + 2 * bola1.raio * v1x) / (bola1.raio + bola2.raio);

    // Atualize as velocidades das bolas após a colisão
    bola1.vx = novaV1x * Math.cos(angulo) + v1y * Math.cos(angulo + Math.PI / 2);
    bola1.vy = novaV1x * Math.sin(angulo) + v1y * Math.sin(angulo + Math.PI / 2);
    bola2.vx = novaV2x * Math.cos(angulo) + v2y * Math.cos(angulo + Math.PI / 2);
    bola2.vy = novaV2x * Math.sin(angulo) + v2y * Math.sin(angulo + Math.PI / 2);
}

// Adicione esta função para verificar e resolver colisões entre todas as bolas
function verificarColisoes() {
    for (let i = 0; i < bolas.length; i++) {
        for (let j = i + 1; j < bolas.length; j++) {
            if (colidindo(bolas[i], bolas[j])) {
                resolverColisao(bolas[i], bolas[j]);
            }
        }
    }
}

// Adicione a chamada para verificarColisoes() dentro da função desenharMesa
const anguloLinhaPontilhada = Math.atan2(mouse.y - bolaBranca.y, mouse.x - bolaBranca.x);

function desenharMesa() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bolas.forEach((bola) => {
        bola.desenhar();
    });

    verificarColisoes();

    bolas.forEach((bola) => {
        bola.atualizar();
    });

    if (showGuides) {
        // Calcular ângulo entre o mouse e a bola branca
        const angle = Math.atan2(mouse.y - bolaBranca.y, mouse.x - bolaBranca.x);
        const { x2, y2 } = extendLine(bolaBranca.x + bolaBranca.raio * Math.cos(angle), bolaBranca.y + bolaBranca.raio * Math.sin(angle), angle);
        desenharTaco();
        desenharLinhaVertical(mouse.x, mouse.y, angle);
        const distanciaAntesColisao = 20; // Ajuste esse valor conforme necessário
        const posicaoAntesColisao = calcularPosicaoAntesColisao(x2, y2, angle, distanciaAntesColisao);
        desenharBolaTransparente(posicaoAntesColisao.x, posicaoAntesColisao.y);
    }

    requestAnimationFrame(desenharMesa);
}


desenharMesa();

function atualizarPosicaoDoMouse(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
}

canvas.addEventListener('mousemove', atualizarPosicaoDoMouse);

canvas.addEventListener('click', () => {

    if (showGuides) {
        bolasParadas()
        const angulo = Math.atan2(mouse.y - bolaBranca.y, mouse.x - bolaBranca.x);
        const forca = calcularDistancia(bolaBranca.x, bolaBranca.y, mouse.x, mouse.y) / 10;
        bolaBranca.vx = forca * Math.cos(angulo);
        bolaBranca.vy = forca * Math.sin(angulo);
    }

});
