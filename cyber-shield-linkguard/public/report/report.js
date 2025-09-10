// Simple animation observer for elements
document.addEventListener('DOMContentLoaded', function() {
  // Add intersection observer for animated items
  const animatedItems = document.querySelectorAll('.animated-item');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  animatedItems.forEach(item => {
    observer.observe(item);
  });
  
  // Add hover effects programmatically
  const reportItems = document.querySelectorAll('.report-item, .tip-item');
  reportItems.forEach(item => {
    item.addEventListener('mouseenter', function() {
      this.style.transform = this.classList.contains('report-item') 
        ? 'translateX(8px)' 
        : 'translateY(-3px)';
    });
    
    item.addEventListener('mouseleave', function() {
      this.style.transform = 'translateX(0)';
    });
  });
  
  // Add click effect to buttons
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('mousedown', function() {
      this.style.transform = 'scale(0.95)';
    });
    
    button.addEventListener('mouseup', function() {
      this.style.transform = '';
    });
    
    button.addEventListener('mouseleave', function() {
      this.style.transform = '';
    });
  });
  
  // Animate cards on load
  const cards = document.querySelectorAll('.animated-card');
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.2}s`;
  });
});
