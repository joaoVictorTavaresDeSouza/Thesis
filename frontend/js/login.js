/* Natural Synergy - login (somente frontend, pronto para ligar ao backend)
 *
 * CONTRATO COM O BACKEND (ajuste aqui se a rota ou o formato mudarem):
 *
 *   POST  CONFIG.endpoint            (Content-Type: application/json)
 *   corpo: { "email": "...", "senha": "...", "lembrar": true|false }
 *
 *   200/204  -> sucesso. Opcional: { "redirect": "/caminho" }
 *   400/401/422 -> credenciais ou dados inválidos.
 *              Opcional: { "mensagem": "...", "campos": { "email": "...", "senha": "..." } }
 *   429      -> muitas tentativas.
 *   5xx      -> erro no servidor.
 *
 *   Sessão: recomendado cookie HttpOnly + Secure + SameSite definido pelo servidor.
 *   Por isso o fetch usa credentials: 'include' e NADA de token é guardado em
 *   localStorage/sessionStorage.
 *   CSRF (opcional): se <meta name="csrf-token"> tiver conteúdo, ele é enviado
 *   no cabeçalho X-CSRF-Token.
 */
(function () {
    'use strict';

    const CONFIG = {
        endpoint: '/api/auth/login',
        redirectTo: '../index.html', // destino padrão após o login
        timeoutMs: 15000,
    };

    const form = document.getElementById('login-form');

    if (!form) {
        return;
    }

    const campos = {
        email: document.getElementById('lg-email'),
        senha: document.getElementById('lg-senha'),
    };
    const erros = {
        email: document.getElementById('lg-email-erro'),
        senha: document.getElementById('lg-senha-erro'),
    };
    const lembrar = document.getElementById('lg-lembrar');
    const status = document.getElementById('login-status');
    const submit = document.getElementById('login-submit');
    const toggleSenha = document.getElementById('lg-toggle');

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // ---------- Mensagens ----------
    function setStatus(texto, tipo) {
        status.textContent = texto || '';
        status.classList.toggle('form-status--ok', tipo === 'ok');
        status.classList.toggle('form-status--error', tipo === 'error');
    }

    function setErro(nome, mensagem) {
        const input = campos[nome];
        const el = erros[nome];

        if (mensagem) {
            el.textContent = mensagem;
            el.hidden = false;
            input.setAttribute('aria-invalid', 'true');
        } else {
            el.textContent = '';
            el.hidden = true;
            input.removeAttribute('aria-invalid');
        }
    }

    function limparErros() {
        Object.keys(campos).forEach(n => setErro(n, ''));
        setStatus('');
    }

    // ---------- Validação (lado do cliente; o servidor deve validar de novo) ----------
    function validar() {
        const email = campos.email.value.trim();
        const senha = campos.senha.value;
        let primeiroInvalido = null;

        if (!email) {
            setErro('email', 'Informe seu e-mail.');
            primeiroInvalido = campos.email;
        } else if (!EMAIL_RE.test(email)) {
            setErro('email', 'Informe um e-mail válido.');
            primeiroInvalido = campos.email;
        } else {
            setErro('email', '');
        }

        if (!senha) {
            setErro('senha', 'Informe sua senha.');
            primeiroInvalido = primeiroInvalido || campos.senha;
        } else {
            setErro('senha', '');
        }

        if (primeiroInvalido) {
            primeiroInvalido.focus();
            return null;
        }

        return { email, senha, lembrar: lembrar.checked };
    }

    // ---------- Estado de envio ----------
    function setCarregando(ativo) {
        submit.disabled = ativo;
        submit.classList.toggle('is-loading', ativo);
        submit.setAttribute('aria-busy', ativo ? 'true' : 'false');
    }

    // Aceita apenas caminhos do próprio site (evita redirecionamento aberto).
    function destinoSeguro(valor) {
        if (typeof valor !== 'string') {
            return CONFIG.redirectTo;
        }

        const ok = /^(\/(?!\/)|\.{1,2}\/|[\w-]+\.html)/.test(valor) && !/^[a-z][a-z0-9+.-]*:/i.test(valor);

        return ok ? valor : CONFIG.redirectTo;
    }

    // ---------- Envio ----------
    async function enviar(dados) {
        const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        };
        const csrf = document.querySelector('meta[name="csrf-token"]');

        if (csrf && csrf.content) {
            headers['X-CSRF-Token'] = csrf.content;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), CONFIG.timeoutMs);

        try {
            return await fetch(CONFIG.endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(dados),
                credentials: 'include',
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timer);
        }
    }

    async function lerJson(resposta) {
        try {
            return await resposta.json();
        } catch (e) {
            return {};
        }
    }

    form.addEventListener('submit', async evento => {
        evento.preventDefault();

        if (submit.disabled) {
            return;
        }

        limparErros();

        const dados = validar();

        if (!dados) {
            setStatus('Corrija os campos destacados.', 'error');

            return;
        }

        setCarregando(true);
        setStatus('Verificando...');

        try {
            const resposta = await enviar(dados);
            const corpo = await lerJson(resposta);

            if (resposta.ok) {
                setStatus('Login realizado. Redirecionando...', 'ok');
                window.location.assign(destinoSeguro(corpo.redirect));

                return;
            }

            if (corpo.campos) {
                Object.keys(corpo.campos).forEach(n => {
                    if (campos[n]) {
                        setErro(n, corpo.campos[n]);
                    }
                });
            }

            if (resposta.status === 429) {
                setStatus(corpo.mensagem || 'Muitas tentativas. Aguarde um pouco e tente novamente.', 'error');
            } else if (resposta.status >= 500) {
                setStatus(corpo.mensagem || 'Erro no servidor. Tente novamente mais tarde.', 'error');
            } else {
                // 400/401/422: mensagem genérica para não revelar se o e-mail existe.
                setStatus(corpo.mensagem || 'E-mail ou senha incorretos.', 'error');
                campos.senha.value = '';
                campos.senha.focus();
            }
        } catch (e) {
            setStatus(
                e.name === 'AbortError'
                    ? 'O servidor demorou para responder. Tente novamente.'
                    : 'Não foi possível conectar ao servidor. Verifique sua conexão.',
                'error',
            );
        } finally {
            setCarregando(false);
        }
    });

    // Limpa o erro do campo assim que a pessoa volta a digitar
    Object.keys(campos).forEach(nome => {
        campos[nome].addEventListener('input', () => setErro(nome, ''));
    });

    // ---------- Mostrar/ocultar senha ----------
    if (toggleSenha) {
        toggleSenha.addEventListener('click', () => {
            const mostrar = campos.senha.type === 'password';

            campos.senha.type = mostrar ? 'text' : 'password';
            toggleSenha.setAttribute('aria-pressed', mostrar);
            toggleSenha.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
        });
    }
})();
