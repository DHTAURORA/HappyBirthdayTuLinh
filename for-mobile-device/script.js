document.querySelectorAll('.birthday-card, .letter').forEach(el => {
  el.addEventListener('dblclick', function () {
    // Example: flip back if using a 'flipped' class
    el.classList.remove('flipped');
    // Or hide the element:
    // el.style.display = 'none';
  });
});