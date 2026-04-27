const resultEl = document.getElementById('result');
const lengthEl = document.getElementById('length');
const lengthValEl = document.getElementById('length-val');
const uppercaseEl = document.getElementById('uppercase');
const lowercaseEl = document.getElementById('lowercase');
const numbersEl = document.getElementById('numbers');
const symbolsEl = document.getElementById('symbols');
const generateEl = document.getElementById('generate');
const clipboardEl = document.getElementById('clipboard');
const strengthBar = document.getElementById('strength-bar');
const strengthText = document.getElementById('strength-text');

const randomFunc = {
    upper: () => String.fromCharCode(Math.floor(Math.random() * 26) + 65),
    lower: () => String.fromCharCode(Math.floor(Math.random() * 26) + 97),
    number: () => String.fromCharCode(Math.floor(Math.random() * 10) + 48),
    symbol: () => "!@#$%^&*()_+{}[]|:;<>,.?/".charAt(Math.floor(Math.random() * 25))
};

// Update length display
lengthEl.addEventListener('input', (e) => {
    lengthValEl.innerText = e.target.value;
});

// Copy to Clipboard
clipboardEl.addEventListener('click', () => {
    const password = resultEl.innerText;
    if (!password || password === "Şifreniz burada görünecek") return;
    
    navigator.clipboard.writeText(password).then(() => {
        showToast('Şifre kopyalandı!');
    });
});

function showToast(message) {
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.innerText = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Generate Button
generateEl.addEventListener('click', () => {
    const length = +lengthEl.value;
    const hasUpper = uppercaseEl.checked;
    const hasLower = lowercaseEl.checked;
    const hasNumber = numbersEl.checked;
    const hasSymbol = symbolsEl.checked;

    const password = generatePassword(hasUpper, hasLower, hasNumber, hasSymbol, length);
    resultEl.innerText = password;
    updateStrength(password);
});

function generatePassword(upper, lower, number, symbol, length) {
    let generatedPassword = '';
    const typesArr = [];
    
    if (upper) typesArr.push('upper');
    if (lower) typesArr.push('lower');
    if (number) typesArr.push('number');
    if (symbol) typesArr.push('symbol');

    if (typesArr.length === 0) return 'Seçim yapın!';

    for (let i = 0; i < length; i++) {
        const randomType = typesArr[Math.floor(Math.random() * typesArr.length)];
        generatedPassword += randomFunc[randomType]();
    }

    return generatedPassword;
}

function updateStrength(password) {
    let score = 0;
    if (!password) {
        strengthBar.style.width = '0%';
        strengthText.innerText = 'Güç: -';
        return;
    }

    if (password.length > 8) score++;
    if (password.length > 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let width = (score / 5) * 100;
    let color = '#ff4d4d';
    let text = 'Zayıf';

    if (score >= 4) {
        color = '#00f2fe';
        text = 'Çok Güçlü';
    } else if (score >= 3) {
        color = '#4facfe';
        text = 'Güçlü';
    } else if (score >= 2) {
        color = '#ffd700';
        text = 'Orta';
    }

    strengthBar.style.width = `${width}%`;
    strengthBar.style.backgroundColor = color;
    strengthText.innerText = `Güç: ${text}`;
    strengthText.style.color = color;
}