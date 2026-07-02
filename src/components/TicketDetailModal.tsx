// src/components/TicketDetailModal.tsx

import { useEffect, useState } from 'react';
import type { TicketResponse } from '../types';
import { STATUS_LABELS, PRIORITY_LEVELS } from '../types';
import apiClient from '../services/api';
import { downloadTicketPdf } from '../services/ticketApi';

interface TicketDetailModalProps {
  ticketId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TicketDetailModal({ ticketId, isOpen, onClose }: TicketDetailModalProps) {
  const [ticket, setTicket] = useState<TicketResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && ticketId) fetchTicket();
  }, [isOpen, ticketId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/tickets/${ticketId}`);
      if (response.data?.data) {
        setTicket(response.data.data);
      } else if (response.data?.id) {
        setTicket(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching ticket:', err);
      setError('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!ticketId) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      await downloadTicketPdf(ticketId);
    } catch (err: any) {
      setPdfError(err?.message ?? 'Failed to download PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  if (!isOpen) return null;

  const getStatusColor = (status: number): string => {
    switch (status) {
      case 1: return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50';
      case 2: return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50';
      case 3: return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50';
      case 4: return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50';
      case 5: return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-600';
      default: return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-600';
    }
  };

  const getPriorityColor = (priority: number): string => {
    switch (priority) {
      case 1: return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50';
      case 2: return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50';
      case 3: return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50';
      case 4: return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50';
      default: return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-600';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-xl w-full my-8 max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-slate-800 transform transition-all">

          {/* Header */}
          <div className="flex-none px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-slate-800 z-10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ticket Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-700"
            >
              <span className="sr-only">Close modal</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Loading ticket details...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
              </div>
            )}

            {ticket && !loading && (
              <div className="space-y-6">
                {/* Ticket Number and Title */}
                <div className="pb-4">
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 mb-3">
                      {ticket.ticketNumber}
                    </span>
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white leading-tight">
                      {ticket.title}
                    </h3>
                  </div>

                  {/* Status and Priority */}
                  <div className="flex gap-4 border-b border-gray-100 dark:border-slate-800 pb-5">
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mb-1.5 uppercase tracking-wider">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                        {STATUS_LABELS[ticket.status as keyof typeof STATUS_LABELS]}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mb-1.5 uppercase tracking-wider">Priority</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                        {PRIORITY_LEVELS[ticket.priority as keyof typeof PRIORITY_LEVELS]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mb-2 uppercase tracking-wider">Category</p>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{ticket.category}</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mb-2 uppercase tracking-wider">Description</p>
                  <div className="bg-gray-50/50 dark:bg-slate-800/30 rounded-xl p-4 border border-gray-100 dark:border-slate-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {ticket.description}
                    </p>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mb-1 uppercase tracking-wider">Created On</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(ticket.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(ticket.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mb-1 uppercase tracking-wider">Created By</p>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-medium">
                        {ticket.createdByUserName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{ticket.createdByUserName}</span>
                    </div>
                  </div>

                  {ticket.assignedToUserName && (
                    <>
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mb-1 uppercase tracking-wider">Assigned To</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.assignedToUserName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mb-1 uppercase tracking-wider">Assigned By</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.assignedByUserName || 'N/A'}</p>
                      </div>
                    </>
                  )}

                  {ticket.closedAt && (
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mb-1 uppercase tracking-wider">Closed On</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(ticket.closedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Activity Stats */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Comments</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">{ticket.commentCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Activity Logs</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">{ticket.activityLogCount}</span>
                  </div>
                </div>

                {/* PDF error */}
                {pdfError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {pdfError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-none px-6 py-4 flex justify-between items-center gap-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 z-10">
            {/* Download PDF — available to all roles (backend enforces permission) */}
            {ticket && (
              <button
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 disabled:opacity-50 transition-colors"
              >
                {pdfLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border border-indigo-400 border-t-indigo-700 rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="ml-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}



