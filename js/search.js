// ========== SEARCH FUNCTIONALITY ==========

const Search = {
    placeholderIndex: 0,
    placeholderInterval: null,
    voiceRecognition: null,
    isListening: false,
    
    init() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const voiceBtn = document.getElementById('voiceSearchBtn');
        const searchModal = document.getElementById('searchModal');
        const searchModalClose = document.getElementById('searchModalClose');
        const searchOverlay = document.getElementById('searchOverlay');
        
        if (!searchInput) return;
        
        // Rotating placeholders
        this.startPlaceholderRotation(searchInput);
        
        // Clear placeholder on focus
        searchInput.addEventListener('focus', () => {
            searchInput.dataset.previousPlaceholder = searchInput.placeholder;
            searchInput.placeholder = '';
        });
        
        searchInput.addEventListener('blur', () => {
            if (!searchInput.value) {
                searchInput.placeholder = searchInput.dataset.previousPlaceholder || CONFIG.searchPlaceholders[0];
            }
        });
        
        // Auto-search on typing (debounced)
        const debouncedSearch = Utils.debounce((query) => {
            this.performSearch(query);
        }, 300);
        
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                debouncedSearch(query);
            } else if (query.length === 0) {
                UI.hidePopup('searchOverlay');
            }
        });
        
        // Search button click
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const query = searchInput.value.trim();
                if (query.length >= 2) {
                    this.performSearch(query);
                }
            });
        }
        
        // Enter key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query.length >= 2) {
                    this.performSearch(query);
                }
            }
        });
        
        // Voice search
        if (voiceBtn && CONFIG.features.enableVoiceSearch) {
            this.initVoiceSearch(voiceBtn);
        } else if (voiceBtn) {
            voiceBtn.style.display = 'none';
        }
        
        // Close modal
        if (searchModalClose) {
            searchModalClose.addEventListener('click', () => {
                UI.hidePopup('searchOverlay');
            });
        }
        
        if (searchOverlay) {
            searchOverlay.addEventListener('click', function(e) {
                if (e.target === searchOverlay) {
                    UI.hidePopup('searchOverlay');
                }
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                UI.hidePopup('searchOverlay');
            }
        });
    },
    
    startPlaceholderRotation(input) {
        if (this.placeholderInterval) clearInterval(this.placeholderInterval);
        
        input.placeholder = CONFIG.searchPlaceholders[0];
        
        this.placeholderInterval = setInterval(() => {
            this.placeholderIndex = (this.placeholderIndex + 1) % CONFIG.searchPlaceholders.length;
            if (document.activeElement !== input) {
                input.placeholder = CONFIG.searchPlaceholders[this.placeholderIndex];
            }
        }, 4000);
    },
    
    async performSearch(query) {
        const modalBody = document.getElementById('searchModalBody');
        const modalTitle = document.getElementById('searchModalTitle');
        
        if (!modalBody) return;
        
        // Show loading
        modalBody.innerHTML = '<div style="text-align:center;padding:30px;"><i class="fa-solid fa-spinner animate-spin"></i> Searching...</div>';
        UI.showPopup('searchOverlay');
        
        if (modalTitle) {
            modalTitle.textContent = `🔍 Results for "${query}"`;
        }
        
        // Search across all categories
        const results = await ProductLoader.searchProducts(query, 8);
        
        if (results.length === 0) {
            // No results - show empty state with popular products
            this.renderEmptyResults(query, modalBody);
        } else {
            // Show results
            this.renderResults(results, query, modalBody);
        }
    },
    
    renderResults(results, query, container) {
        const didYouMean = results[0].searchScore < 70 ? results[0].name : null;
        
        let html = '';
        
        if (didYouMean && results[0].searchScore < 80) {
            html += `<p style="font-size:13px;color:var(--text-grey);margin-bottom:10px;">⚡ Did you mean: <strong>"${didYouMean}"</strong>?</p>`;
        }
        
        results.forEach(product => {
            html += `
                <div class="search-result-item" onclick="showProductDetail('${product.id}'); UI.hidePopup('searchOverlay');">
                    <img src="${product.image || CONFIG.urls.placeholderImage + '?random=' + product.id}" 
                         alt="${product.name}"
                         onerror="this.src='${CONFIG.urls.placeholderImage}?random=' + Math.random()">
                    <div class="search-result-info">
                        <h4>${product.name}</h4>
                        <p>${product.weight} · ${Utils.formatPrice(product.price)}</p>
                    </div>
                    <span style="color:var(--star);">⭐ ${product.rating || '4.0'}</span>
                </div>
            `;
        });
        
        if (results.length >= 5) {
            html += `
                <div style="text-align:center;margin-top:12px;">
                    <a href="shop.html?search=${encodeURIComponent(query)}" class="btn btn-outline" style="font-size:12px;">
                        📋 View all results →
                    </a>
                </div>
            `;
        }
        
        container.innerHTML = html;
    },
    
    async renderEmptyResults(query, container) {
        // Load popular products as fallback
        const popularProducts = await ProductLoader.loadMostOrdered(4);
        
        let popularHTML = '';
        popularProducts.forEach(p => {
            popularHTML += ProductLoader.renderCompactCard(p);
        });
        
        container.innerHTML = `
            <div class="search-empty">
                <div class="empty-icon">😅</div>
                <h4>"${query}" abhi available nahi hai yaar!</h4>
                <p>⚡ Fikar mat karo, jald add karenge!</p>
                <a href="https://wa.me/${CONFIG.store.phone}?text=Please%20add%20this%20product:%20${encodeURIComponent(query)}" 
                   target="_blank" 
                   class="btn btn-whatsapp" 
                   style="margin-bottom:16px;">
                    💬 Request on WhatsApp
                </a>
                <p style="font-weight:600;margin-bottom:10px;">🔥 Tab tak ye dekh lo:</p>
                <div class="recent-scroll">${popularHTML}</div>
            </div>
        `;
    },
    
    initVoiceSearch(voiceBtn) {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            voiceBtn.style.display = 'none';
            return;
        }
        
        this.voiceRecognition = new SpeechRecognition();
        this.voiceRecognition.lang = 'hi-IN';
        this.voiceRecognition.interimResults = false;
        this.voiceRecognition.maxAlternatives = 1;
        
        this.voiceRecognition.onstart = () => {
            this.isListening = true;
            voiceBtn.classList.add('listening');
            voiceBtn.querySelector('i').className = 'fa-solid fa-microphone';
        };
        
        this.voiceRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = transcript;
                this.performSearch(transcript);
            }
        };
        
        this.voiceRecognition.onend = () => {
            this.isListening = false;
            voiceBtn.classList.remove('listening');
            voiceBtn.querySelector('i').className = 'fa-solid fa-microphone';
        };
        
        this.voiceRecognition.onerror = () => {
            this.isListening = false;
            voiceBtn.classList.remove('listening');
            voiceBtn.querySelector('i').className = 'fa-solid fa-microphone';
        };
        
        voiceBtn.addEventListener('click', () => {
            if (this.isListening) {
                this.voiceRecognition.stop();
            } else {
                try {
                    this.voiceRecognition.start();
                } catch (e) {
                    // Already started
                }
            }
        });
    }
};