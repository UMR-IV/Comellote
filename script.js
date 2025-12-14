document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;

    // Save login info to localStorage
    localStorage.setItem('shopUser', JSON.stringify({ name, address }));

    alert('Welcome ' + name + '!');

    // Redirect or hide login page
    document.getElementById('login-page').style.display = 'none';
    });