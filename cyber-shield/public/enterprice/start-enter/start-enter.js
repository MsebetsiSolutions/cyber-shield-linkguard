document.addEventListener('DOMContentLoaded', function() {
    const codeDisplay = document.getElementById('codeDisplay');
    const verificationForm = document.getElementById('verificationForm');
    const companyNameInput = document.getElementById('companyName');
    const verificationInput = document.getElementById('verificationCode');
    const submitBtn = document.getElementById('submitBtn');
    
    // Generate random verification code
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
    
    verificationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const companyName = companyNameInput.value.trim();
        const enteredCode = verificationInput.value.trim();
        
        // Validate inputs
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
        
        // Verify with backend
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
                
                // Store company name for dashboard
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
    
    // Input effects
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
    
    // Add styles for messages
    const style = document.createElement('style');
    style.textContent = `
        .message {
            padding: 12px 15px;
            margin-bottom: 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: fadeIn 0.3s ease;
        }
        
        .message.error {
            background: #fee2e2;
            color: #dc2626;
            border: 1px solid #fecaca;
        }
        
        .message.success {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
});
