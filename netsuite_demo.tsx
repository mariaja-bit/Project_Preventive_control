import React, { useState, useEffect } from 'react';
import { Play, FileText, CheckCircle, AlertTriangle, XCircle, RefreshCw, Download, Mail, Database, Settings } from 'lucide-react';

const NetSuiteInventoryDemo = () => {
  const [activeTab, setActiveTab] = useState('config');
  const [executing, setExecuting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [data, setData] = useState({
    transactions: [],
    duplicates: [],
    reports: [],
    alerts: []
  });

  // Simulated configuration
  const config = {
    LOT_FIELD_PREFIX: 'L',
    UNIT_FIELD_PREFIX: 'U',
    KNOWN_LOT_FIELDS: ['L123456789', 'L987654321', 'L555666777'],
    KNOWN_UNIT_FIELDS: ['U111222333', 'U444555666'],
    AUTHORIZATION_FIELD: 'custbody_authorization_status',
    STANDARD_RECIPIENTS: [
      'inventory.manager@company.com',
      'warehouse.manager@company.com',
      'cost.accountant@company.com'
    ],
    OFF_PEAK_START_HOUR: 2,
    OFF_PEAK_END_HOUR: 6,
    VARIANCE_THRESHOLD_PCT: 1.0,
    MAX_RECORDS_PER_RUN: 100
  };

  // Sample transaction data
  const sampleTransactions = [
    { id: 'TXN001', type: 'Item Fulfillment', date: '2026-01-05', lotNumber: 'LOT-2024-001', unitNumber: 'UNIT-5678', item: 'Widget A', qty: 10, authorized: true },
    { id: 'TXN002', type: 'Item Receipt', date: '2026-01-05', lotNumber: 'LOT-2024-001', unitNumber: 'UNIT-9999', item: 'Widget A', qty: 15, authorized: true },
    { id: 'TXN003', type: 'Inventory Transfer', date: '2026-01-05', lotNumber: 'LOT-2024-002', unitNumber: 'UNIT-1111', item: 'Widget B', qty: 5, authorized: false },
    { id: 'TXN004', type: 'Work Order', date: '2026-01-04', lotNumber: 'LOT-2024-001', unitNumber: 'UNIT-2222', item: 'Widget A', qty: 8, authorized: true },
    { id: 'TXN005', type: 'Assembly Build', date: '2026-01-04', lotNumber: 'LOT-2024-003', unitNumber: 'UNIT-5678', item: 'Widget C', qty: 20, authorized: true },
    { id: 'TXN006', type: 'Item Fulfillment', date: '2026-01-03', lotNumber: 'LOT-2024-002', unitNumber: 'UNIT-5678', item: 'Widget B', qty: 12, authorized: true }
  ];

  const addLog = (type, title, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { type, title, message, timestamp }]);
  };

  // Script 1: Duplicate Analysis
  const runDuplicateAnalysis = () => {
    setExecuting(true);
    addLog('info', 'Script Start', 'Beginning duplicate analysis - Off-peak hours');
    
    setTimeout(() => {
      addLog('audit', 'Fields Found', `Lot fields: ${config.KNOWN_LOT_FIELDS.length}, Unit fields: ${config.KNOWN_UNIT_FIELDS.length}`);
      
      // Find duplicates
      const duplicates = [];
      const lotCounts = {};
      const unitCounts = {};
      
      sampleTransactions.forEach(txn => {
        lotCounts[txn.lotNumber] = (lotCounts[txn.lotNumber] || 0) + 1;
        unitCounts[txn.unitNumber] = (unitCounts[txn.unitNumber] || 0) + 1;
      });
      
      Object.entries(lotCounts).forEach(([lot, count]) => {
        if (count > 1) {
          duplicates.push({
            type: 'LOT',
            number: lot,
            count,
            priority: count > 2 ? 'CRITICAL' : 'HIGH',
            items: sampleTransactions.filter(t => t.lotNumber === lot).map(t => t.item)
          });
        }
      });
      
      Object.entries(unitCounts).forEach(([unit, count]) => {
        if (count > 1) {
          duplicates.push({
            type: 'UNIT',
            number: unit,
            count,
            priority: count > 2 ? 'CRITICAL' : 'HIGH',
            items: sampleTransactions.filter(t => t.unitNumber === unit).map(t => t.item)
          });
        }
      });
      
      setData(prev => ({ ...prev, duplicates }));
      addLog('audit', 'Analysis Complete', `Found ${duplicates.length} duplicates`);
      
      // Generate report
      const report = {
        id: 'RPT-' + Date.now(),
        name: `Duplicate_Analysis_${new Date().toISOString().split('T')[0]}.csv`,
        date: new Date().toISOString(),
        duplicates: duplicates.length
      };
      
      setData(prev => ({ ...prev, reports: [...prev.reports, report] }));
      addLog('success', 'Report Generated', `Report saved: ${report.name}`);
      
      // Send email
      const alert = {
        id: 'ALT-' + Date.now(),
        type: 'DUPLICATE_ANALYSIS',
        subject: `Duplicate Analysis Complete - ${duplicates.length} duplicates found`,
        recipients: config.STANDARD_RECIPIENTS,
        date: new Date().toISOString()
      };
      
      setData(prev => ({ ...prev, alerts: [...prev.alerts, alert] }));
      addLog('success', 'Email Sent', `Notified ${config.STANDARD_RECIPIENTS.length} recipients`);
      
      setExecuting(false);
    }, 2000);
  };

  // Script 2: Cleanup Script
  const runCleanup = (dryRun = true) => {
    setExecuting(true);
    addLog('info', 'Cleanup Start', `Strategy: RENUMBER, Dry Run: ${dryRun}`);
    
    setTimeout(() => {
      const duplicatesToClean = data.duplicates.filter(d => d.type === 'LOT');
      const results = {
        processed: duplicatesToClean.length,
        success: 0,
        changes: []
      };
      
      duplicatesToClean.forEach(dup => {
        const newNumber = `CLN-${Date.now().toString().slice(-6)}`;
        if (dryRun) {
          addLog('audit', 'DRY RUN', `Would renumber ${dup.number} to ${newNumber}`);
          results.changes.push({ old: dup.number, new: newNumber, dryRun: true });
        } else {
          addLog('success', 'Renumbered', `${dup.number} → ${newNumber}`);
          results.changes.push({ old: dup.number, new: newNumber, success: true });
          results.success++;
        }
      });
      
      const report = {
        id: 'RPT-' + Date.now(),
        name: `Cleanup_Report_${new Date().toISOString()}.txt`,
        date: new Date().toISOString(),
        processed: results.processed,
        success: results.success
      };
      
      setData(prev => ({ ...prev, reports: [...prev.reports, report] }));
      addLog('success', 'Cleanup Complete', `Report ID: ${report.id}`);
      
      if (!dryRun) {
        setData(prev => ({ ...prev, duplicates: [] }));
      }
      
      setExecuting(false);
    }, 3000);
  };

  // Script 3: Daily Reconciliation
  const runReconciliation = () => {
    setExecuting(true);
    addLog('info', 'Reconciliation Start', 'Daily inventory reconciliation');
    
    setTimeout(() => {
      const exceptions = {
        duplicates: data.duplicates.length,
        unauthorized: sampleTransactions.filter(t => !t.authorized).length,
        variances: 0,
        staleWO: 0
      };
      
      addLog('audit', 'Checking Duplicates', `Found ${exceptions.duplicates} duplicates`);
      addLog('audit', 'Checking Unauthorized', `Found ${exceptions.unauthorized} unauthorized transfers`);
      
      const unauthorizedTxns = sampleTransactions.filter(t => !t.authorized);
      if (unauthorizedTxns.length > 0) {
        const alert = {
          id: 'ALT-' + Date.now(),
          type: 'UNAUTHORIZED_TRANSFER',
          subject: `ALERT: ${unauthorizedTxns.length} Unauthorized Transfers`,
          recipients: config.STANDARD_RECIPIENTS,
          date: new Date().toISOString(),
          transactions: unauthorizedTxns.map(t => t.id)
        };
        
        setData(prev => ({ ...prev, alerts: [...prev.alerts, alert] }));
        addLog('warning', 'Alert Sent', `Unauthorized transfer alert to ${alert.recipients.length} recipients`);
      }
      
      const report = {
        id: 'RPT-' + Date.now(),
        name: `Reconciliation_${new Date().toISOString().split('T')[0]}.txt`,
        date: new Date().toISOString(),
        exceptions: Object.values(exceptions).reduce((a, b) => a + b, 0)
      };
      
      setData(prev => ({ ...prev, reports: [...prev.reports, report] }));
      addLog('success', 'Reconciliation Complete', `Total exceptions: ${report.exceptions}`);
      
      setExecuting(false);
    }, 2500);
  };

  // Validation simulation
  const validateTransaction = (txn) => {
    const isDuplicate = data.duplicates.some(d => 
      d.number === txn.lotNumber || d.number === txn.unitNumber
    );
    
    return {
      valid: !isDuplicate && txn.authorized,
      message: isDuplicate ? 'Duplicate lot/unit number detected' : 
               !txn.authorized ? 'Transaction not authorized' : 
               'Transaction valid'
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">NetSuite Inventory Control System</h1>
              <p className="text-blue-200">Interactive Demo Environment - Phase 3 Monitoring</p>
            </div>
            <Database className="w-16 h-16 text-blue-400" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'config', label: 'Configuration', icon: Settings },
            { id: 'analysis', label: 'Duplicate Analysis', icon: FileText },
            { id: 'cleanup', label: 'Cleanup Script', icon: RefreshCw },
            { id: 'reconciliation', label: 'Reconciliation', icon: CheckCircle },
            { id: 'dashboard', label: 'Dashboard', icon: Database }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Configuration Tab */}
            {activeTab === 'config' && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Settings className="w-6 h-6" />
                  System Configuration
                </h2>
                <div className="space-y-4">
                  <div className="bg-black/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Field Configuration</h3>
                    <div className="text-sm text-blue-200 space-y-1">
                      <p>• Lot Fields: {config.KNOWN_LOT_FIELDS.join(', ')}</p>
                      <p>• Unit Fields: {config.KNOWN_UNIT_FIELDS.join(', ')}</p>
                      <p>• Authorization Field: {config.AUTHORIZATION_FIELD}</p>
                    </div>
                  </div>
                  <div className="bg-black/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Email Recipients</h3>
                    <div className="text-sm text-blue-200 space-y-1">
                      {config.STANDARD_RECIPIENTS.map((email, i) => (
                        <p key={i}>• {email}</p>
                      ))}
                    </div>
                  </div>
                  <div className="bg-black/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Thresholds</h3>
                    <div className="text-sm text-blue-200 space-y-1">
                      <p>• Variance Tolerance: {config.VARIANCE_THRESHOLD_PCT}%</p>
                      <p>• Max Records Per Run: {config.MAX_RECORDS_PER_RUN}</p>
                      <p>• Off-Peak Hours: {config.OFF_PEAK_START_HOUR}:00 - {config.OFF_PEAK_END_HOUR}:00</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Duplicate Analysis Tab */}
            {activeTab === 'analysis' && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Duplicate Analysis Script
                  </h2>
                  <button
                    onClick={runDuplicateAnalysis}
                    disabled={executing}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-all"
                  >
                    <Play className="w-4 h-4" />
                    Execute Script
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-black/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-3">Script Details</h3>
                    <div className="text-sm text-blue-200 space-y-2">
                      <p>• Scans all transactions for duplicate lot/unit numbers</p>
                      <p>• Checks {config.KNOWN_LOT_FIELDS.length} lot fields and {config.KNOWN_UNIT_FIELDS.length} unit fields</p>
                      <p>• Generates CSV report with priority scoring</p>
                      <p>• Sends email alerts to {config.STANDARD_RECIPIENTS.length} recipients</p>
                      <p>• Scheduled: Daily at 2:00 AM (off-peak hours)</p>
                    </div>
                  </div>

                  {data.duplicates.length > 0 && (
                    <div className="bg-black/20 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-3">Found Duplicates</h3>
                      <div className="space-y-2">
                        {data.duplicates.map((dup, i) => (
                          <div key={i} className="flex items-center justify-between bg-red-500/20 p-3 rounded border border-red-500/50">
                            <div className="text-sm text-white">
                              <span className="font-semibold">{dup.type}:</span> {dup.number}
                              <span className="text-blue-200 ml-2">({dup.count} duplicates)</span>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              dup.priority === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-500'
                            }`}>
                              {dup.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cleanup Tab */}
            {activeTab === 'cleanup' && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <RefreshCw className="w-6 h-6" />
                    Cleanup Script
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => runCleanup(true)}
                      disabled={executing || data.duplicates.length === 0}
                      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-all"
                    >
                      <Play className="w-4 h-4" />
                      Dry Run
                    </button>
                    <button
                      onClick={() => runCleanup(false)}
                      disabled={executing || data.duplicates.length === 0}
                      className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-all"
                    >
                      <Play className="w-4 h-4" />
                      Execute Cleanup
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-black/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-3">Cleanup Strategy</h3>
                    <div className="text-sm text-blue-200 space-y-2">
                      <p>• Strategy: RENUMBER (assigns new sequential numbers)</p>
                      <p>• Prefix: CLN- (Cleanup prefix)</p>
                      <p>• Creates backup before cleanup</p>
                      <p>• Processes max {config.MAX_RECORDS_PER_RUN} records per run</p>
                      <p>• Only runs during off-peak hours (2-6 AM)</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border-2 ${
                    data.duplicates.length > 0 ? 'bg-orange-500/20 border-orange-500' : 'bg-green-500/20 border-green-500'
                  }`}>
                    <div className="flex items-center gap-2 text-white font-semibold mb-2">
                      {data.duplicates.length > 0 ? (
                        <AlertTriangle className="w-5 h-5 text-orange-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      Status
                    </div>
                    <p className="text-sm text-white">
                      {data.duplicates.length > 0
                        ? `${data.duplicates.length} duplicates ready for cleanup`
                        : 'No duplicates found - system clean'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Reconciliation Tab */}
            {activeTab === 'reconciliation' && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <CheckCircle className="w-6 h-6" />
                    Daily Reconciliation
                  </h2>
                  <button
                    onClick={runReconciliation}
                    disabled={executing}
                    className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-all"
                  >
                    <Play className="w-4 h-4" />
                    Run Reconciliation
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-black/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-3">Checks Performed</h3>
                    <div className="text-sm text-blue-200 space-y-2">
                      <p>✓ New duplicates created today</p>
                      <p>✓ Unauthorized transfers (no approval)</p>
                      <p>✓ Quantity variances exceeding {config.VARIANCE_THRESHOLD_PCT}%</p>
                      <p>✓ Stale work orders (30+ days old)</p>
                      <p>✓ High-value adjustments requiring review</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-500/20 p-4 rounded-lg border border-blue-500/50">
                      <div className="text-2xl font-bold text-white">{data.duplicates.length}</div>
                      <div className="text-sm text-blue-200">Duplicates</div>
                    </div>
                    <div className="bg-orange-500/20 p-4 rounded-lg border border-orange-500/50">
                      <div className="text-2xl font-bold text-white">
                        {sampleTransactions.filter(t => !t.authorized).length}
                      </div>
                      <div className="text-sm text-orange-200">Unauthorized</div>
                    </div>
                    <div className="bg-green-500/20 p-4 rounded-lg border border-green-500/50">
                      <div className="text-2xl font-bold text-white">{data.reports.length}</div>
                      <div className="text-sm text-green-200">Reports Generated</div>
                    </div>
                    <div className="bg-purple-500/20 p-4 rounded-lg border border-purple-500/50">
                      <div className="text-2xl font-bold text-white">{data.alerts.length}</div>
                      <div className="text-sm text-purple-200">Alerts Sent</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Database className="w-6 h-6" />
                  Exception Dashboard
                </h2>
                
                <div className="space-y-4">
                  {/* Transaction List */}
                  <div className="bg-black/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-3">Recent Transactions</h3>
                    <div className="space-y-2">
                      {sampleTransactions.map(txn => {
                        const validation = validateTransaction(txn);
                        return (
                          <div key={txn.id} className={`p-3 rounded border ${
                            validation.valid
                              ? 'bg-green-500/10 border-green-500/50'
                              : 'bg-red-500/10 border-red-500/50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-white">
                                <span className="font-semibold">{txn.id}</span> - {txn.type}
                                <div className="text-xs text-blue-200 mt-1">
                                  {txn.item} | Lot: {txn.lotNumber} | Unit: {txn.unitNumber} | Qty: {txn.qty}
                                </div>
                              </div>
                              {validation.valid ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-400" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reports */}
                  {data.reports.length > 0 && (
                    <div className="bg-black/20 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-3">Generated Reports</h3>
                      <div className="space-y-2">
                        {data.reports.map(report => (
                          <div key={report.id} className="flex items-center justify-between bg-white/5 p-3 rounded">
                            <div className="text-sm text-white">
                              <div className="font-semibold">{report.name}</div>
                              <div className="text-xs text-blue-200">{new Date(report.date).toLocaleString()}</div>
                            </div>
                            <Download className="w-4 h-4 text-blue-400 cursor-pointer hover:text-blue-300" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alerts */}
                  {data.alerts.length > 0 && (
                    <div className="bg-black/20 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-3">Email Alerts</h3>
                      <div className="space-y-2">
                        {data.alerts.map(alert => (
                          <div key={alert.id} className="flex items-center gap-3 bg-orange-500/20 p-3 rounded border border-orange-500/50">
                            <Mail className="w-5 h-5 text-orange-400" />
                            <div className="flex-1 text-sm text-white">
                              <div className="font-semibold">{alert.subject}</div>
                              <div className="text-xs text-orange-200">Sent to {alert.recipients.length} recipients</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Execution Log Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Execution Log</h3>
                <button
                  onClick={() => setLogs([])}
                  className="text-xs text-blue-300 hover:text-blue-200"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-sm text-white/50 text-center py-8">
                    Execute a script to see logs
                  </p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="bg-black/30 p-3 rounded text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold ${
                          log.type === 'error' ? 'text-red-400' :
                          log.type === 'warning' ? 'text-orange-400' :
                          log.type === 'success' ? 'text-green-400' :
                          log.type === 'audit' ? 'text-blue-400' :
                          'text-white'
                        }`}>
                          {log.title}
                        </span>
                        <span className="text-white/50">{log.timestamp}</span>
                      </div>
                      <p