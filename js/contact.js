// お問い合わせフォーム：入力値を集めて JSON で API（ashitamo80_corp_mail_api）に送る。
// 編集後は `npm run build` で js/contact.js を生成してコミットする。
const MAIL_TO = 'info@ashitamo80.com';
const TIMEOUT_MS = 15000;
const FIELDS = ['company', 'name', 'email', 'size', 'topic', 'body'];
// ローカル確認時は手元の API（uvicorn --port 8001）に送る
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
const LOCAL_ENDPOINT = 'http://localhost:8001/api/contact';
const MESSAGES = {
    invalid: '未入力または形式が正しくない項目があります。',
    sending: '送信しています…',
    sent: 'お問い合わせを受け付けました。内容を確認のうえ、担当者よりご連絡します。',
    failed: `送信できませんでした。時間をおいて再度お試しいただくか、${MAIL_TO} へ直接ご連絡ください。`,
};
const form = document.getElementById('contactForm');
const msg = document.getElementById('formMsg');
if (form && msg) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const endpoint = isLocal ? LOCAL_ENDPOINT : form.dataset.endpoint ?? '';
    const control = (name) => form.elements.namedItem(name);
    const showMessage = (text, kind = 'info') => {
        msg.textContent = text;
        msg.classList.toggle('is-error', kind === 'error');
        msg.classList.toggle('is-success', kind === 'success');
    };
    const markInvalid = (names) => {
        FIELDS.forEach((name) => control(name)?.setAttribute('aria-invalid', String(names.includes(name))));
        const first = names.map(control).find((el) => el);
        first?.focus();
    };
    // ブラウザ側の入力チェック（API 側でも同じ内容を検証する）
    const validate = () => FIELDS.filter((name) => {
        const el = control(name);
        if (!el)
            return false;
        return !el.checkValidity() || (el.required && el.value.trim() === '');
    });
    const collect = () => {
        const value = (name) => control(name)?.value.trim() ?? '';
        return {
            company: value('company'),
            name: value('name'),
            email: value('email'),
            size: value('size'),
            topic: value('topic'),
            body: value('body'),
            // ボットが埋めた場合は API 側で送信せずに成功扱いにする
            website: value('website'),
        };
    };
    const post = async (payload) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
            const data = (await res.json().catch(() => null));
            return { status: res.status, data };
        }
        finally {
            clearTimeout(timer);
        }
    };
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (submitBtn.disabled)
            return;
        const invalid = validate();
        if (invalid.length) {
            markInvalid(invalid);
            showMessage(MESSAGES.invalid, 'error');
            return;
        }
        markInvalid([]);
        if (!endpoint) {
            showMessage(MESSAGES.failed, 'error');
            return;
        }
        submitBtn.disabled = true;
        form.setAttribute('aria-busy', 'true');
        showMessage(MESSAGES.sending);
        try {
            const { status, data } = await post(collect());
            if (status === 200 && data?.ok) {
                form.reset();
                showMessage(MESSAGES.sent, 'success');
            }
            else if (data?.error === 'invalid' && data.fields?.some((f) => FIELDS.includes(f))) {
                markInvalid(data.fields);
                showMessage(MESSAGES.invalid, 'error');
            }
            else {
                // フォームにない項目のエラー（API 側の仕様違いなど）は利用者には直せないので、送信失敗として案内する
                showMessage(MESSAGES.failed, 'error');
            }
        }
        catch {
            // 通信エラー・タイムアウト・CORS エラー
            showMessage(MESSAGES.failed, 'error');
        }
        finally {
            submitBtn.disabled = false;
            form.removeAttribute('aria-busy');
        }
    });
    form.addEventListener('input', (e) => {
        const el = e.target;
        if (el.getAttribute('aria-invalid') === 'true' && el.checkValidity() && el.value.trim() !== '') {
            el.setAttribute('aria-invalid', 'false');
        }
    });
}
export {};
