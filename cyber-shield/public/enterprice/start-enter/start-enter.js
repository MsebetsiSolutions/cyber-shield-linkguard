document.addEventListener('DOMContentLoaded', function() {
    const codeDisplay = document.getElementById('codeDisplay');
    const verificationForm = document.getElementById('verificationForm');
    const companyNameInput = document.getElementById('companyName');
    const verificationInput = document.getElementById('verificationCode');
    const submitBtn = document.getElementById('submitBtn');
    
    function generateRandomCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
    
    const verificationValue = generateRandomCode();
    codeDisplay.textContent = verificationValue;
    
    codeDisplay.style.animation = 'pulse 2s infinite';
    
    verificationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const companyName = companyNameInput.value.trim();
        const enteredCode = verificationInput.value.trim();
        
        if (!companyName) {
            showError('Please enter your company name');
            companyNameInput.focus();
            return;
        }
        
        if (!enteredCode) {
            showError('Please enter the verification code');
            verificationInput.focus();
            return;
        }
        
        if (enteredCode !== verificationValue) {
            showError('Verification code is incorrect. Please try again.');
            verificationInput.value = '';
            verificationInput.focus();
            return;
        }
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
            
            const response = await fetch('/api/enterprise/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    company_name: companyName,
                    verification_code: enteredCode
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showSuccess('Enterprise verification successful! Redirecting...');
                
                localStorage.setItem('enterprise_company', companyName);
                
                setTimeout(() => {
                    window.location.href = '../enter-dash/enterprise-dashboard.html';
                }, 1500);
            } else {
                showError(data.error || 'Verification failed');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Verify & Continue';
            }
            
        } catch (error) {
            showError('Network error. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Verify & Continue';
        }
    });
    
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
    function showError(message) {
        removeMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        verificationForm.parentNode.insertBefore(errorDiv, verificationForm);
        setTimeout(removeMessages, 5000);
    }
    
    function showSuccess(message) {
        removeMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'message success';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        verificationForm.parentNode.insertBefore(successDiv, verificationForm);
    }
    
    function removeMessages() {
        const messages = document.querySelectorAll('.message');
        messages.forEach(message => message.remove());
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }
        
        .form-group input {
            transition: all 0.3s ease;
        }
        
        .code-display {
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);
});
