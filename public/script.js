document.addEventListener('DOMContentLoaded', function() {
    // Base API URL
    const API_BASE_URL = 'http://localhost:5000/api/auth';
    
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab = document.querySelector('.login-tab');
    const registerTab = document.querySelector('.register-tab');
    const switchToRegister = document.querySelector('.switch-to-register');
    const switchToLogin = document.querySelector('.switch-to-login');
    const loginSection = document.querySelector('.login-form');
    const registerSection = document.querySelector('.register-form');
    const userDashboard = document.querySelector('.user-dashboard');
    const logoutBtn = document.querySelector('.logout-btn');
    const toastLive = document.getElementById('liveToast');
    const toast = new bootstrap.Toast(toastLive);
    const booksManagementSection = document.querySelector('.books-management');
    const manageBooksBtn = document.querySelector('.manage-books-btn');
    const booksList = document.querySelector('.books-list');
    const addBookBtn = document.querySelector('.add-book-btn');
    const bookModal = new bootstrap.Modal(document.getElementById('bookModal'));
    const bookForm = document.getElementById('bookForm');
    const saveBookBtn = document.querySelector('.save-book-btn');
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    const confirmDeleteBtn = document.querySelector('.confirm-delete-btn');
    const bookToDeleteTitle = document.querySelector('.book-to-delete-title');
    const backButton = document.querySelector('.btn-back');
    
    let currentBookId = null;
    
    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Form switching
    function showLogin() {
        loginSection.style.display = 'block';
        registerSection.style.display = 'none';
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
    }
    
    function showRegister() {
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
    }
    
    loginTab.addEventListener('click', showLogin);
    switchToLogin.addEventListener('click', showLogin);
    registerTab.addEventListener('click', showRegister);
    switchToRegister.addEventListener('click', showRegister);
    
    // Show toast notification
    function showToast(message, isError = false) {
        const toastBody = toastLive.querySelector('.toast-body');
        toastBody.textContent = message;
        
        const toastHeader = toastLive.querySelector('.toast-header');
        if (isError) {
            toastHeader.classList.add('bg-danger', 'text-white');
        } else {
            toastHeader.classList.remove('bg-danger', 'text-white');
        }
        
        toast.show();
    }
    
    // Check authentication status
    async function checkAuthStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/user`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const user = await response.json();
                showUserDashboard(user);
                // Show books tab when logged in
                document.querySelector('.books-tab').style.display = 'block';
            } else {
                showLogin();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            showLogin();
        }
    }
    
    // Show user dashboard
    function showUserDashboard(user) {
        document.querySelector('.user-fullname').textContent = user.fullnames;
        document.querySelector('.user-username').textContent = user.username;
        
        loginSection.style.display = 'none';
        registerSection.style.display = 'none';
        userDashboard.style.display = 'block';
        booksManagementSection.style.display = 'none';
        
        loginTab.style.display = 'none';
        registerTab.style.display = 'none';
    }
    
    // Login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showUserDashboard(data.user);
                showToast('Login successful!');
            } else {
                showToast(data.error || 'Login failed', true);
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast('An error occurred during login', true);
        }
    });
    
    // Register form submission
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullnames = document.getElementById('registerFullname').value;
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        
        if (password.length < 6) {
            showToast('Password must be at least 6 characters', true);
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, fullnames })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showToast('Registration successful!');
                registerForm.reset();
                showLogin();
            } else {
                showToast(data.error || 'Registration failed', true);
            }
        } catch (error) {
            console.error('Registration error:', error);
            showToast('An error occurred during registration', true);
        }
    });
    
    // Logout
    logoutBtn.addEventListener('click', async function() {
        try {
            const response = await fetch(`${API_BASE_URL}/logout`, {
                method: 'GET',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showToast(data.message);
                showLogin();
                userDashboard.style.display = 'none';
                booksManagementSection.style.display = 'none';
                loginTab.style.display = 'block';
                registerTab.style.display = 'block';
                document.querySelector('.books-tab').style.display = 'none';
            } else {
                showToast(data.error || 'Logout failed', true);
            }
        } catch (error) {
            console.error('Logout error:', error);
            showToast('An error occurred during logout', true);
        }
    });
    
    // Show books management section
    manageBooksBtn.addEventListener('click', function() {
        userDashboard.style.display = 'none';
        booksManagementSection.style.display = 'block';
        loadBooks();
    });
    
    // Back to dashboard from books management
    backButton.addEventListener('click', function() {
        booksManagementSection.style.display = 'none';
        userDashboard.style.display = 'block';
    });
    
    // Add event listener for books tab
    document.querySelector('.books-tab').addEventListener('click', function() {
        userDashboard.style.display = 'none';
        booksManagementSection.style.display = 'block';
        loadBooks();
    });
    
    // Load books from server
    async function loadBooks() {
        try {
            const response = await fetch('/books', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to load books');
            }
            
            const books = await response.json();
            renderBooks(books);
        } catch (error) {
            console.error('Error loading books:', error);
            showToast('Failed to load books', true);
        }
    }
    
    // Render books in the table
    function renderBooks(books) {
        booksList.innerHTML = '';
        
        if (books.length === 0) {
            booksList.innerHTML = '<tr><td colspan="6" class="text-center py-4">No books found</td></tr>';
            return;
        }
        
        books.forEach(book => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.genre || '-'}</td>
                <td>$${book.price ? book.price.toFixed(2) : '0.00'}</td>
                <td>${book.instock}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-book" data-id="${book.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-book" data-id="${book.id}" data-title="${book.title}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            booksList.appendChild(row);
        });
        
        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-book').forEach(btn => {
            btn.addEventListener('click', function() {
                currentBookId = this.getAttribute('data-id');
                loadBookForEdit(currentBookId);
            });
        });
        
        document.querySelectorAll('.delete-book').forEach(btn => {
            btn.addEventListener('click', function() {
                currentBookId = this.getAttribute('data-id');
                const bookTitle = this.getAttribute('data-title');
                bookToDeleteTitle.textContent = bookTitle;
                deleteModal.show();
            });
        });
    }
    
    // Load book data for editing
    async function loadBookForEdit(bookId) {
        try {
            const response = await fetch(`/book/${bookId}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to load book data');
            }
            
            const book = await response.json();
            
            // Fill the form
            document.getElementById('bookId').value = book.id;
            document.getElementById('bookTitle').value = book.title;
            document.getElementById('bookAuthor').value = book.author;
            document.getElementById('bookGenre').value = book.genre || '';
            document.getElementById('bookPrice').value = book.price || '';
            document.getElementById('bookInStock').value = book.instock || '';
            
            // Update modal title
            document.querySelector('.book-modal-title').textContent = 'Edit Book';
            
            // Show modal
            bookModal.show();
        } catch (error) {
            console.error('Error loading book:', error);
            showToast('Failed to load book data', true);
        }
    }
    
    // Add new book button
    addBookBtn.addEventListener('click', function() {
        // Reset form
        bookForm.reset();
        document.getElementById('bookId').value = '';
        document.querySelector('.book-modal-title').textContent = 'Add New Book';
        currentBookId = null;
        bookModal.show();
    });
    
    // Save book (both add and update)
    saveBookBtn.addEventListener('click', async function() {
        const bookId = document.getElementById('bookId').value;
        const bookData = {
            title: document.getElementById('bookTitle').value,
            author: document.getElementById('bookAuthor').value,
            genre: document.getElementById('bookGenre').value,
            price: document.getElementById('bookPrice').value,
            instock: document.getElementById('bookInStock').value
        };
        
        if (!bookData.title || !bookData.author) {
            showToast('Title and author are required', true);
            return;
        }
        
        try {
            const url = bookId ? `/book/${bookId}` : '/book';
            const method = bookId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(bookData)
            });
            
            if (!response.ok) {
                throw new Error(bookId ? 'Failed to update book' : 'Failed to add book');
            }
            
            await response.json();
            bookModal.hide();
            loadBooks();
            showToast(bookId ? 'Book updated successfully' : 'Book added successfully');
        } catch (error) {
            console.error('Error saving book:', error);
            showToast(error.message, true);
        }
    });
    
    // Delete book confirmation
    confirmDeleteBtn.addEventListener('click', async function() {
        try {
            const response = await fetch(`/book/${currentBookId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete book');
            }
            
            await response.json();
            deleteModal.hide();
            loadBooks();
            showToast('Book deleted successfully');
        } catch (error) {
            console.error('Error deleting book:', error);
            showToast(error.message, true);
        }
    });
    
    // Initial auth check
    checkAuthStatus();
});