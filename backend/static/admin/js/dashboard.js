/* ==========================================================================
   E-TAX SYSTEM SOMALILAND — DASHBOARD JAVASCRIPT
   Handles API Integration, Dynamic Metrics, Charts & Auto-Refresh
   ========================================================================== */

const API_BASE_URL = '/api/dashboard';

// Chart Instances
let paymentMethodsChartInstance = null;
let revenueTrendChartInstance = null;
let paymentStatusChartInstance = null;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  fetchDashboardData();
  
  // Set Auto-Refresh every 30 seconds
  setInterval(fetchDashboardData, 30000);
});

// Main Data Fetcher
async function fetchDashboardData() {
  const refreshIcon = document.getElementById('refresh-icon');
  if (refreshIcon) refreshIcon.classList.add('fa-spin');
  
  try {
    const response = await fetch(`${API_BASE_URL}/overview`);
    if (!response.ok) throw new Error('API server returned error status');
    
    const result = await response.json();
    if (result.success && result.data) {
      hideErrorBanner();
      renderDashboard(result.data);
      updateDatabaseStatus(true);
    } else {
      throw new Error(result.message || 'Failed to parse dashboard data');
    }
  } catch (error) {
    console.error('Dashboard Data Error:', error);
    showErrorBanner('Unable to load dashboard data. Please check your connection.');
    updateDatabaseStatus(false);
  } finally {
    if (refreshIcon) refreshIcon.classList.remove('fa-spin');
  }
}

// Render All Components
function renderDashboard(data) {
  renderStatCards(data.stat_cards || {});
  renderSystemInfo(data.stat_cards || {});
  renderTopCities(data.cities || []);
  renderPaymentMethods(data.payment_methods || []);
  renderCurrencyBreakdown(data.revenue_by_currency || [], data.stat_cards || {});
  renderTaxTypes(data.tax_type_ranking || []);
  renderRevenueTrend(data.revenue_trend_monthly || []);
  renderPaymentStatus(data.payments_overview || {});
  renderRecentTaxpayers(data.recent_taxpayers || []);
}

// 1. STAT CARDS
function renderStatCards(stats) {
  const revSlsh = stats.total_revenue_slsh || 0;
  const revUsd = stats.total_revenue_usd || 0;
  const taxpayers = stats.total_taxpayers || 0;
  const payments = stats.total_payments || 0;

  document.getElementById('stat-revenue-slsh').textContent = `${formatNumber(revSlsh)} SLSH`;
  document.getElementById('stat-revenue-usd').textContent = `$${formatNumber(revUsd)}`;
  document.getElementById('stat-taxpayers').textContent = formatNumber(taxpayers);
  document.getElementById('stat-payments').textContent = formatNumber(payments);

  updateChangeBadge('stat-revenue-slsh-change', stats.total_revenue_slsh_change);
  updateChangeBadge('stat-revenue-usd-change', stats.total_revenue_usd_change);
  updateChangeBadge('stat-taxpayers-change', stats.total_taxpayers_change);
  updateChangeBadge('stat-payments-change', stats.total_payments_change);
}

function updateChangeBadge(elementId, changeVal) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const val = parseFloat(changeVal) || 0;
  const icon = val >= 0 ? '<i class="fa-solid fa-arrow-trend-up"></i>' : '<i class="fa-solid fa-arrow-trend-down"></i>';
  const prefix = val >= 0 ? '+' : '';
  el.className = `stat-change ${val >= 0 ? 'positive' : 'negative'}`;
  el.innerHTML = `${icon} <span>${prefix}${val}%</span> <small>from last period</small>`;
}

// SYSTEM INFO WIDGET
function renderSystemInfo(stats) {
  document.getElementById('sys-users-val').textContent = formatNumber(stats.total_users || 0);
  document.getElementById('sys-payments-val').textContent = formatNumber(stats.total_payments || 0);
  if (stats.last_backup) {
    document.getElementById('sys-backup-val').textContent = stats.last_backup;
  }
}

// DATABASE STATUS BADGE
function updateDatabaseStatus(isConnected) {
  const textEl = document.getElementById('db-status-text');
  const badgeEl = document.getElementById('db-status-badge');
  if (isConnected) {
    textEl.textContent = 'Connected';
    badgeEl.className = 'status-indicator online';
  } else {
    textEl.textContent = 'Disconnected';
    badgeEl.className = 'status-indicator offline';
    badgeEl.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
    badgeEl.style.color = '#EF4444';
  }
}

// 2. TOP CITIES BY TAX REVENUE
function renderTopCities(cities) {
  const container = document.getElementById('cities-container');
  if (!cities || cities.length === 0) {
    container.innerHTML = '<div class="text-center py-4 text-secondary">No city revenue data available</div>';
    return;
  }

  // Calculate max revenue for progress bar percentage
  const maxRevenue = Math.max(...cities.map(c => c.total_slsh || 0)) || 1;
  const totalSlshAll = cities.reduce((sum, c) => sum + (c.total_slsh || 0), 0) || 1;

  let html = '';
  cities.slice(0, 7).forEach((c, index) => {
    const rankStr = String(index + 1).padStart(2, '0');
    const revenue = c.total_slsh || 0;
    const pctOfTotal = ((revenue / totalSlshAll) * 100).toFixed(1);
    const barWidth = Math.min(100, Math.max(5, (revenue / maxRevenue) * 100));

    html += `
      <div class="city-row">
        <div class="city-info">
          <div class="city-name">
            <span class="city-rank">${rankStr}</span>
            <span>${c.city || 'Unknown'}</span>
          </div>
          <div>
            <span class="city-revenue">${formatNumber(revenue)} SLSH</span>
            <span class="city-pct-badge">${pctOfTotal}%</span>
          </div>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${barWidth}%;"></div>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// 3. PAYMENT METHODS DONUT CHART
function renderPaymentMethods(methods) {
  const ctx = document.getElementById('paymentMethodsChart')?.getContext('2d');
  if (!ctx) return;

  const defaultMethods = [
    { method: 'ZAAD', count: 0, percentage: 0 },
    { method: 'eDahab', count: 0, percentage: 0 },
    { method: 'Card', count: 0, percentage: 0 },
    { method: 'Bank Transfer', count: 0, percentage: 0 },
    { method: 'Other', count: 0, percentage: 0 },
  ];

  const list = methods.length > 0 ? methods : defaultMethods;

  const labels = list.map(m => m.method);
  const dataVals = list.map(m => m.percentage || 0);
  const colors = ['#10B981', '#0284C7', '#8B5CF6', '#F59E0B', '#64748B'];

  if (paymentMethodsChartInstance) {
    paymentMethodsChartInstance.destroy();
  }

  paymentMethodsChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: dataVals,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#FFFFFF',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.label}: ${context.raw}% (${list[context.dataIndex]?.count || 0} payments)`
          }
        }
      },
      cutout: '72%'
    }
  });

  // Render Legend
  const legendContainer = document.getElementById('payment-methods-legend');
  let legendHtml = '';
  list.forEach((m, idx) => {
    legendHtml += `
      <div class="legend-item">
        <span class="legend-dot" style="background-color: ${colors[idx % colors.length]};"></span>
        <span>${m.method} (${m.percentage}%)</span>
      </div>
    `;
  });
  legendContainer.innerHTML = legendHtml;
}

// 4. CURRENCY BREAKDOWN
function renderCurrencyBreakdown(currencyData, stats) {
  let slshPct = 80.6;
  let usdPct = 19.4;

  if (currencyData && currencyData.length >= 2) {
    const slshObj = currencyData.find(c => c.currency === 'SLSH');
    const usdObj = currencyData.find(c => c.currency === 'USD');
    if (slshObj) slshPct = slshObj.percentage;
    if (usdObj) usdPct = usdObj.percentage;
  }

  document.getElementById('slsh-pct').textContent = `${slshPct}%`;
  document.getElementById('usd-pct').textContent = `${usdPct}%`;

  document.getElementById('slsh-total-val').textContent = `${formatNumber(stats.total_revenue_slsh || 0)}`;
  document.getElementById('usd-total-val').textContent = `$${formatNumber(stats.total_revenue_usd || 0)}`;
}

// 5. TAX TYPES PERFORMANCE
function renderTaxTypes(taxTypes) {
  const container = document.getElementById('tax-types-container');
  if (!taxTypes || taxTypes.length === 0) {
    container.innerHTML = '<div class="text-center py-4 text-secondary" style="grid-column: span 3;">No tax type data available</div>';
    return;
  }

  let html = '';
  taxTypes.forEach(t => {
    html += `
      <div class="tax-type-card">
        <div class="tax-type-name">${t.name || 'General Tax'}</div>
        <div class="tax-type-revenue">${formatNumber(t.total || 0)} SLSH</div>
        <div class="tax-type-meta">
          <span>Frequency: ${t.frequency || 'N/A'}</span>
          <strong>${t.percentage || 0}%</strong>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// 6. REVENUE OVER TIME GRAPH
function renderRevenueTrend(trendData) {
  const ctx = document.getElementById('revenueTrendChart')?.getContext('2d');
  if (!ctx) return;

  const defaultMonths = ['Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'];
  const labels = trendData.length > 0 ? trendData.map(d => d.month) : defaultMonths;
  const values = trendData.length > 0 ? trendData.map(d => d.total) : [0, 0, 0, 0, 0, 0, 0];

  const gradient = ctx.createLinearGradient(0, 0, 0, 260);
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

  if (revenueTrendChartInstance) {
    revenueTrendChartInstance.destroy();
  }

  revenueTrendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Revenue (SLSH)',
        data: values,
        borderColor: '#10B981',
        borderWidth: 3,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: '#10B981',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Revenue: ${formatNumber(ctx.raw)} SLSH`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          grid: { color: '#E2E8F0' },
          ticks: {
            callback: (val) => formatNumberShort(val)
          }
        }
      }
    }
  });
}

// 7. PAYMENT STATUS DONUT CHART
function renderPaymentStatus(overview) {
  const ctx = document.getElementById('paymentStatusChart')?.getContext('2d');
  if (!ctx) return;

  const completed = overview.completed || 0;
  const pending = overview.pending || 0;
  const failed = overview.failed || 0;

  const completedPct = overview.completed_pct || 0;
  const pendingPct = overview.pending_pct || 0;
  const failedPct = overview.failed_pct || 0;

  if (paymentStatusChartInstance) {
    paymentStatusChartInstance.destroy();
  }

  paymentStatusChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Completed', 'Pending', 'Rejected'],
      datasets: [{
        data: [completed, pending, failed],
        backgroundColor: ['#10B981', '#F97316', '#EF4444'],
        borderWidth: 2,
        borderColor: '#FFFFFF',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      cutout: '70%'
    }
  });

  const listContainer = document.getElementById('status-breakdown-list');
  listContainer.innerHTML = `
    <div class="status-item">
      <div class="status-label-group">
        <span class="legend-dot dot-completed"></span>
        <span>Completed</span>
      </div>
      <strong>${formatNumber(completed)} (${completedPct}%)</strong>
    </div>
    <div class="status-item">
      <div class="status-label-group">
        <span class="legend-dot dot-pending"></span>
        <span>Pending</span>
      </div>
      <strong>${formatNumber(pending)} (${pendingPct}%)</strong>
    </div>
    <div class="status-item">
      <div class="status-label-group">
        <span class="legend-dot dot-rejected"></span>
        <span>Rejected</span>
      </div>
      <strong>${formatNumber(failed)} (${failedPct}%)</strong>
    </div>
  `;
}

// 8. RECENT TAXPAYERS TABLE
function renderRecentTaxpayers(taxpayers) {
  const tbody = document.getElementById('taxpayers-tbody');
  if (!taxpayers || taxpayers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center py-4 text-secondary">No taxpayers registered yet</td>
      </tr>
    `;
    return;
  }

  let html = '';
  taxpayers.forEach((t, idx) => {
    const statusClass = t.status.toLowerCase() === 'active' ? 'active' : 'pending';
    html += `
      <tr>
        <td><strong>${idx + 1}</strong></td>
        <td><strong>${t.name}</strong></td>
        <td><code>${t.tin}</code></td>
        <td>${t.phone}</td>
        <td>${t.city}</td>
        <td>${t.tax_type}</td>
        <td><strong>${t.total_paid_formatted}</strong></td>
        <td><span class="badge-status ${statusClass}">${t.status}</span></td>
        <td>${t.registered_date}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// UI HELPER FUNCTIONS
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

function switchTab(tabName) {
  console.log('Navigating to tab:', tabName);
}

function showErrorBanner(msg) {
  const banner = document.getElementById('error-banner');
  const text = document.getElementById('error-banner-text');
  if (banner && text) {
    text.textContent = msg;
    banner.style.display = 'flex';
  }
}

function hideErrorBanner() {
  const banner = document.getElementById('error-banner');
  if (banner) banner.style.display = 'none';
}

function formatNumber(num) {
  return new Intl.NumberFormat().format(num || 0);
}

function formatNumberShort(num) {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num;
}

function logoutAdmin() {
  if (confirm('Are you sure you want to log out from Admin Dashboard?')) {
    window.location.reload();
  }
}
