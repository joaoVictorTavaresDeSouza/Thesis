/* Natural Synergy - interações */

// Menu móvel
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');

if (toggle && nav) {
    toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open);
    });
}

// Vídeo demonstrativo: preencha para substituir o espaço reservado.
// tipo: 'youtube' (src = ID do vídeo) ou 'local' (src = 'assets/videos/arquivo.mp4')
const VIDEO = { tipo: '', src: '' };
const slot = document.getElementById('video-slot');

if (slot && VIDEO.src) {
    slot.innerHTML = VIDEO.tipo === 'youtube'
        ? `<iframe class="video-frame" src="https://www.youtube.com/embed/${VIDEO.src}" title="Demonstração do Natural Synergy" allowfullscreen loading="lazy"></iframe>`
        : `<video class="video-frame" src="${VIDEO.src}" controls preload="metadata"></video>`;
}

// Componentes: preencha "preco" (em reais, ex.: 39.9) para ativar os cálculos.
// Itens com preco: null aparecem como "A definir" e NÃO contam como zero.
const COMPONENTES = [
    {
        nome: 'ESP32',
        funcao: 'Microcontrolador: processa os dados e controla o sistema.',
        preco: 64.47,
        icone: 'chip',
    },
    {
        nome: 'Cabos e conectores',
        funcao: 'Ligações elétricas entre os módulos.',
        preco: 29.90,
        icone: 'cabo',
    },
    {
        nome: 'Protoboard',
        funcao: 'Montagem do circuito sem solda na fase de protótipo.',
        preco: 25.17,
        icone: 'placa',
    },
    {
        nome: 'LEDs indicadores',
        funcao: 'Indicações visuais do estado do dispositivo.',
        preco: 17.73,
        icone: 'led',
    },
    {
        nome: 'Bateria LiPo',
        funcao: 'Alimentação elétrica do dispositivo.',
        preco: 42.90,
        icone: 'bateria',
    },
    {
        nome: 'Sensor MPU6050',
        funcao: 'Acelerômetro e giroscópio: leitura de aceleração e rotação.',
        preco: 10.99,
        icone: 'mov',
    },
    {
        nome: 'Sensor MAX30102',
        funcao: 'Sinais ópticos relacionados à frequência cardíaca.',
        preco: 11.23,
        icone: 'cor',
    },
    {
        nome: 'Módulo GSM/SMS SIM800L',
        funcao: 'Comunicação celular e envio de SMS.',
        preco: 44.99,
        icone: 'sinal',
    },
    {
        nome: 'Filamento para impressão 3D',
        funcao: 'Produção do invólucro (case da manguita) do protótipo.',
        preco: 78.90,
        icone: 'cubo',
    },
];

const ICONES = {
    chip: '<rect x="8" y="8" width="8" height="8"/><path d="M10 3v5M14 3v5M10 16v5M14 16v5M3 10h5M3 14h5M16 10h5M16 14h5"/>',
    cabo: '<path d="M4 8h5a3 3 0 0 1 3 3v2a3 3 0 0 0 3 3h5M4 8V5M20 16v3"/>',
    placa: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h.01M11 14h.01M15 14h.01"/>',
    led: '<circle cx="12" cy="10" r="4"/><path d="M12 14v6M9 20h6"/>',
    bateria: '<rect x="3" y="8" width="16" height="9" rx="2"/><path d="M21 11v3M8 12.5h4"/>',
    mov: '<path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"/>',
    cor: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
    sinal: '<path d="M12 20v-9M8 8a5.6 5.6 0 0 1 8 0M5 5a10 10 0 0 1 14 0"/>',
    cubo: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
};

const brl = v => v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

const grid = document.getElementById('component-grid');

if (grid) {
    grid.innerHTML = COMPONENTES.map(c => {
        const ok = typeof c.preco === 'number';

        return `<li><article class="component-card">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Ilustração conceitual: ${c.nome}">${ICONES[c.icone]}</svg>
      <h3>${c.nome}</h3><p>${c.funcao}</p>
      <p class="component-card__price${ok ? '' : ' component-card__price--pending'}">${ok ? brl(c.preco) : 'A definir'}</p>
    </article></li>`;
    }).join('');

    const feitos = COMPONENTES.filter(c => typeof c.preco === 'number');
    const total = feitos.reduce((s, c) => s + c.preco, 0);
    const pend = COMPONENTES.length - feitos.length;
    const set = (id, t) => {
        document.getElementById(id).textContent = t;
    };

    set('b-total', feitos.length ? brl(total) : 'Indisponível');
    set(
        'b-label',
        pend ? 'Total parcial (itens com preço)' : 'Custo total estimado',
    );
    set('b-itens', COMPONENTES.length);
    set('b-pend', pend);
    set(
        'b-pct',
        Math.round(feitos.length / COMPONENTES.length * 100) + '%',
    );
    set(
        'b-msg',
        !feitos.length
            ? 'O orçamento ainda precisa ser preenchido. Os valores serão atualizados após a confirmação dos custos de aquisição.'
            : pend
                ? 'Total parcial: ainda há preços pendentes, então o orçamento completo não está disponível.'
                : 'Todos os preços foram informados.',
    );
}
