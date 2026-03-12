
        // ============================================
        // CONFIGURATION — Edit these values
        // ============================================
        const CONFIG = {
            PIN: '13579',  // Change this!
            DATA_URL: './data/dashboard-data.json',  // Path to your JSON file
            REFRESH_INTERVAL: 30000  // 30 seconds
        };
        // ============================================

        let lastUpdateTime = null;
        let updateTickerInterval;

        function checkPassword() {
            const input = document.getElementById('pin-input').value;
            const passwordError = document.getElementById('password-error');
            const pinInput = document.getElementById('pin-input');

            passwordError.style.display = 'none'; // Clear previous error
            passwordError.style.color = 'var(--accent-red)'; // Reset color

            if (input === CONFIG.PIN) {
                passwordError.textContent = '✅ Correct PIN!';
                passwordError.style.color = 'var(--accent-green)'; // Change to green for success
                passwordError.style.display = 'block';
                pinInput.value = ''; // Clear input for next time

                // Briefly show success message before transitioning
                setTimeout(() => {
                    document.getElementById('password-overlay').style.display = 'none';
                    document.getElementById('main-content').style.display = 'block';
                    sessionStorage.setItem('mc_authenticated', 'true');
                    initDashboard();
                }, 1000); // 1-second delay
            } else {
                passwordError.textContent = '❌ Incorrect PIN. Try again.';
                passwordError.style.display = 'block';
                pinInput.value = '';
                pinInput.focus();
            }
        }

        document.getElementById('access-dashboard-btn').addEventListener('click', checkPassword);

        document.getElementById('pin-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkPassword();
        });

        if (sessionStorage.getItem('mc_authenticated') === 'true') {
            document.getElementById('password-overlay').style.display = 'none';
            document.getElementById('main-content').style.display = 'block';
            initDashboard();
        }

        function updateLastUpdatedTicker() {
            if (!lastUpdateTime) return;
            const now = new Date();
            const diffSecs = Math.floor((now - lastUpdateTime) / 1000);
            let text;
            if (diffSecs < 5) text = 'Just now';
            else if (diffSecs < 60) text = `${diffSecs}s ago`;
            else if (diffSecs < 3600) text = `${Math.floor(diffSecs / 60)}m ago`;
            else text = `${Math.floor(diffSecs / 3600)}h ago`;
            document.getElementById('last-updated-text').textContent = `Updated ${text}`;
        }

        async function fetchData() {
            try {
                const cacheBuster = `?_=${Date.now()}`;
                const response = await fetch(CONFIG.DATA_URL + cacheBuster);
                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.json();
                lastUpdateTime = new Date(data.lastUpdated || Date.now());
                renderDashboard(data);
                document.getElementById('main-content').classList.add('flash-update');
                setTimeout(() => document.getElementById('main-content').classList.remove('flash-update'), 1000);
                return true;
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
                return false;
            }
        }

        async function forceUpdate() {
            const btn = document.getElementById('refresh-btn');
            btn.classList.add('loading');
            await fetchData();
            setTimeout(() => btn.classList.remove('loading'), 500);
        }

        function initDashboard() {
            fetchData();
            updateLastUpdatedTicker();
            updateTickerInterval = setInterval(updateLastUpdatedTicker, 1000);
            setInterval(fetchData, CONFIG.REFRESH_INTERVAL);
        }

        function renderDashboard(data) {
            const now = new Date();

            // Action Required
            const actionBanner = document.getElementById('action-required');
            const actionItems = document.getElementById('action-items');
            if (data.actionRequired && data.actionRequired.length > 0) {
                actionBanner.classList.remove('empty');
                actionItems.innerHTML = data.actionRequired.map(item => `
                    <div class="alert-item">
                        <div class="alert-item-content">
                            <span class="priority ${item.priority}">${item.priority}</span>
                            <span>${escapeHtml(item.title)}</span>
                        </div>
                        ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Open →</a>` : ''}
                    </div>
                `).join('');
            } else {
                actionBanner.classList.add('empty');
            }

            // Stats Row
            const statsRow = document.getElementById('main-stats-row');
            if (data.stats) {
                statsRow.innerHTML = `
                    <div class=\"stat-pill\"><span class=\"num\">${data.stats.totalProducts || 0}</span><span class=\"label\">Products</span></div>
                    <div class=\"stat-pill\"><span class=\"num\">${data.stats.activeCrons || 0}</span><span class=\"label\">Active Crons</span></div>
                    <div class=\"stat-pill\"><span class=\"num\">${data.stats.pausedCrons || 0}</span><span class=\"label\">Paused</span></div>
                    ${data.stats.errorCrons > 0 ? `<div class=\"stat-pill\" style=\"border-color:var(--accent-red);\"><span class=\"num\" style=\"color:var(--accent-red);\">${data.stats.errorCrons}</span><span class=\"label\">Errors</span></div>` : ''}
                    <div class=\"stat-pill\"><span class=\"num\">${data.stats.activeSubagents || 0}</span><span class=\"label\">Subagents</span></div>
                    <div class=\"stat-pill\"><span class=\"num\">${data.stats.totalTokens || 0}</span><span class=\"label\">Tokens</span></div>
                    <div class=\"stat-pill\"><span class=\"num\">${data.stats.totalCost || '$0.00'}</span><span class=\"label\">Cost</span></div>
                `;
            }

            // Planner Status
            const plannerGoal = document.getElementById('planner-goal');
            const plannerAction = document.getElementById('planner-action');
            const plannerThought = document.getElementById('planner-thought');
            if (data.planner) {
                plannerGoal.textContent = escapeHtml(data.planner.currentGoal || 'N/A');
                plannerAction.textContent = escapeHtml(data.planner.lastAction || 'N/A');
                plannerThought.textContent = escapeHtml(data.planner.thoughtProcess || 'N/A');
            } else {
                plannerGoal.textContent = 'N/A';
                plannerAction.textContent = 'N/A';
                plannerThought.textContent = 'N/A';
            }

            // Active Sessions
            const activeSessionsDiv = document.getElementById('active-sessions');
            if (data.activeSessions && data.activeSessions.length > 0) {
                activeSessionsDiv.innerHTML = data.activeSessions.map(session => {
                    const started = new Date(session.startTime);
                    const mins = Math.floor((now - started) / 60000);
                    const logsHtml = session.logs ? session.logs.map(log => `<div class="log-item">${escapeHtml(log)}</div>`).join('') : '';
                    return `
                        <div class="active-task">
                            <div class="active-indicator"></div>
                            <div class="active-task-info">
                                <div class="active-task-name">Main Session: ${escapeHtml(session.displayName || session.key)}</div>
                                <div class="active-task-meta">${escapeHtml(session.task || 'N/A')} · ${escapeHtml(session.model || '')} · ${mins}m</div>
                                ${logsHtml ? `<div class="task-logs">${logsHtml}</div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                activeSessionsDiv.innerHTML = '<div class="empty-state">✨ No main sessions active</div>';
            }

            // Active Subagents
            const activeSubagentsDiv = document.getElementById('active-subagents');
            if (data.subagents && data.subagents.length > 0) {
                activeSubagentsDiv.innerHTML = data.subagents.map(subagent => {
                    const started = new Date(subagent.startTime);
                    const mins = Math.floor((now - started) / 60000);
                    const logsHtml = subagent.logs ? subagent.logs.map(log => `<div class="log-item">${escapeHtml(log)}</div>`).join('') : '';
                    return `
                        <div class="active-task">
                            <div class="active-indicator"></div>
                            <div class="active-task-info">
                                <div class="active-task-name">Subagent: ${escapeHtml(subagent.label || subagent.id)}</div>
                                <div class="active-task-meta">${escapeHtml(subagent.task || 'N/A')} · ${escapeHtml(subagent.model || '')} · ${mins}m</div>
                                ${logsHtml ? `<div class="task-logs">${logsHtml}</div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                activeSubagentsDiv.innerHTML = '<div class="empty-state">✨ No subagents active</div>';
            }

            // Products
            const productsGrid = document.getElementById('products-grid');
            if (data.products && data.products.length > 0) {
                productsGrid.innerHTML = data.products.map(product => `
                    <a href="${escapeHtml(product.url)}" target="_blank" rel="noopener" class="product-card">
                        <div class="product-name">${escapeHtml(product.name)}</div>
                        <div class="product-status ${product.status}">
                            <span class="dot"></span>
                            ${product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                        </div>
                        <div class="product-checked">Checked ${formatTime(product.lastChecked)}</div>
                    </a>
                `).join('');
            } else {
                productsGrid.innerHTML = '<div class="empty-state">No products configured</div>';
            }

            // Cron Jobs
            const cronTable = document.getElementById('cron-table');
            if (data.crons && data.crons.length > 0) {
                const sortedCrons = [...data.crons].sort((a, b) => {
                    if (a.errors > 0 && b.errors === 0) return -1;
                    if (b.errors > 0 && a.errors === 0) return 1;
                    if (a.status === 'paused' && b.status !== 'paused') return 1;
                    if (b.status === 'paused' && a.status !== 'paused') return -1;
                    return 0;
                });
                cronTable.innerHTML = sortedCrons.map(cron => {
                    const statusIcon = cron.status === 'ok' ? '✅' : cron.status === 'error' ? '❌' : cron.status === 'paused' ? '⏸️' : '⚪';
                    return `
                        <div class="cron-row ${cron.errors > 0 ? 'has-error' : ''}" onclick="this.classList.toggle('expanded')">
                            <div>
                                <div class="cron-name">${escapeHtml(cron.name)}</div>
                                <div class="cron-schedule">${escapeHtml(cron.schedule)}</div>
                            </div>
                            <div class="cron-status">${statusIcon}</div>
                            ${cron.errors > 0 ? `<div class="cron-errors">${cron.errors} errors</div>` : ''}
                            ${cron.lastError ? `<div class="cron-error-detail">${escapeHtml(cron.lastError)}</div>` : ''}
                        </div>
                    `;
                }).join('');
            } else {
                cronTable.innerHTML = '<div class="empty-state">No cron jobs configured</div>';
            }

            // Recent Activity
            const activityList = document.getElementById('activity-list');
            if (data.recentActivity && data.recentActivity.length > 0) {
                activityList.innerHTML = data.recentActivity.slice(0, 10).map(activity => {
                    const time = new Date(activity.time);
                    const hours = time.getHours().toString().padStart(2, '0');
                    const mins = time.getMinutes().toString().padStart(2, '0');
                    return `
                        <div class="activity-item">
                            <div class="activity-time">${hours}:${mins}</div>
                            <div class="activity-event">${escapeHtml(activity.event)}</div>
                        </div>
                    `;
                }).join('');
            } else {
                activityList.innerHTML = '<div class="empty-state">No recent activity</div>';
            }
        }

        function formatTime(isoString) {
            if (!isoString) return 'never';
            const date = new Date(isoString);
            const now = new Date();
            const diffMins = Math.floor((now - date) / 60000);
            if (diffMins < 1) return 'just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
            return date.toLocaleDateString();
        }

        function escapeHtml(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    