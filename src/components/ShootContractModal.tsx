import React, { useState } from 'react';
import type { Booking } from '../types/booking';
import { generateProductionContract, type ProductionContract } from '../utils/contractGenerator';
import { bookingApi } from '../api/bookingApi';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Loader2,
  PenTool,
  AlertCircle
} from 'lucide-react';

interface ShootContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  currentUserId?: string;
  onContractSigned?: () => void;
}

export const ShootContractModal: React.FC<ShootContractModalProps> = ({
  isOpen,
  onClose,
  booking,
  currentUserId,
  onContractSigned
}) => {
  const [signing, setSigning] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signingError, setSigningError] = useState('');
  const [signingSuccess, setSigningSuccess] = useState(false);

  if (!isOpen || !booking) return null;

  const contract: ProductionContract = generateProductionContract(booking);
  const isClient = currentUserId === booking.customerId;
  const isPro = currentUserId === booking.professionalId;
  const alreadySigned = isClient ? contract.signatures.clientSigned : isPro ? contract.signatures.proSigned : false;

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureName.trim()) {
      setSigningError('Please type your legal full name as signature.');
      return;
    }

    setSigning(true);
    setSigningError('');
    try {
      const role = isPro ? 'professional' : 'customer';
      await bookingApi.signContract(booking.id, signatureName.trim(), role);
      setSigningSuccess(true);
      if (onContractSigned) onContractSigned();
    } catch (err: any) {
      setSigningError(err.message || 'Failed to sign contract.');
    } finally {
      setSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop contract-modal-backdrop" onClick={onClose}>
      <div 
        className="modal-card contract-modal-card" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Controls (hidden during print) */}
        <div className="contract-modal-header no-print">
          <div className="contract-header-status">
            <span className={`contract-status-pill status-${contract.status}`}>
              {contract.status === 'fully_executed' && '✓ FULLY EXECUTED & LEGALLY BINDING'}
              {contract.status === 'client_signed' && '✓ CLIENT SIGNED • PENDING CREATOR'}
              {contract.status === 'pro_signed' && '✓ CREATOR SIGNED • PENDING CLIENT'}
              {contract.status === 'draft' && '⏳ DRAFT AGREEMENT • AWAITING SIGNATURES'}
            </span>
            <span className="contract-id-tag">Ref: {contract.contractId}</span>
          </div>

          <div className="contract-header-actions">
            <button 
              type="button" 
              className="btn btn-outline btn-sm contract-print-btn"
              onClick={handlePrint}
            >
              <Printer size={15} /> Print / Save PDF
            </button>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Contract Document */}
        <div className="printable-contract-document" id="printable-contract">
          
          {/* Header Banner */}
          <div className="contract-doc-header">
            <div className="contract-seal-row">
              <div className="contract-gov-badge">
                <ShieldCheck size={20} color="var(--accent)" />
                <span>CAMQREW ESCROW PRODUCTION SERVICE AGREEMENT</span>
              </div>
              <span className="contract-ref-badge">{contract.contractId}</span>
            </div>
            <h1 className="contract-doc-title">Master Production & Filming Contract</h1>
            <p className="contract-doc-sub">
              Executed under the provisions of the Indian Contract Act, 1872 and Information Technology Act, 2000 (Electronic Signatures).
            </p>
            <div className="contract-date-row">
              <span>Date of Agreement: <strong>{contract.effectiveDate}</strong></span>
              <span>Jurisdiction: <strong>Mumbai, India</strong></span>
            </div>
          </div>

          <hr className="contract-divider" />

          {/* Parties Involved */}
          <div className="contract-parties-grid">
            <div className="contract-party-box client-box">
              <span className="party-role-tag">CLIENT / PRODUCER</span>
              <h3 className="party-name">{contract.client.name}</h3>
              <p className="party-meta">User ID: <code>{contract.client.id}</code></p>
              {contract.client.location && <p className="party-loc">📍 {contract.client.location}</p>}
            </div>

            <div className="contract-party-box pro-box">
              <span className="party-role-tag">CREATIVE SPECIALIST / PRODUCTION HOUSE</span>
              <h3 className="party-name">{contract.creator.name}</h3>
              <p className="party-meta">{contract.creator.title || 'Verified Visual Creator'}</p>
              <p className="party-meta">Camqrew Verified Creator ID: <code>{contract.creator.id}</code></p>
            </div>
          </div>

          {/* Schedule & Venue Section */}
          <div className="contract-section-box">
            <h4 className="contract-section-title">1. Shoot Schedule & Production Scope</h4>
            <div className="contract-info-table">
              <div className="contract-info-row">
                <span className="info-label">Service Ordered:</span>
                <span className="info-value"><strong>{booking.serviceTitle}</strong></span>
              </div>
              <div className="contract-info-row">
                <span className="info-label">Production Dates:</span>
                <span className="info-value">
                  {contract.shootSchedule.startDate} to {contract.shootSchedule.endDate} ({contract.shootSchedule.daysCount} {contract.shootSchedule.daysCount === 1 ? 'Production Day' : 'Production Days'})
                </span>
              </div>
              <div className="contract-info-row">
                <span className="info-label">Working Hours:</span>
                <span className="info-value">{contract.shootSchedule.hours}</span>
              </div>
              <div className="contract-info-row">
                <span className="info-label">Designated Shoot Venue:</span>
                <span className="info-value">{contract.shootSchedule.venueAddress}</span>
              </div>
              <div className="contract-info-row">
                <span className="info-label">Primary Deliverables:</span>
                <span className="info-value">{contract.deliverables.summary}</span>
              </div>
            </div>
          </div>

          {/* 3-Stage Escrow Consideration */}
          <div className="contract-section-box">
            <h4 className="contract-section-title">2. Financial Consideration & Milestone Escrow Schedule</h4>
            <p className="contract-terms-p">
              The total contract fee of <strong>₹{contract.financialTerms.totalFee.toLocaleString('en-IN')}</strong> is secured via the Camqrew Automated Escrow Architecture, disburseable strictly upon milestone completion:
            </p>

            <div className="contract-milestone-tiers">
              <div className="contract-milestone-cell">
                <div className="milestone-cell-header">
                  <span className="cell-num">Stage 1 (30%)</span>
                  <strong>₹{contract.financialTerms.advanceEscrow.toLocaleString('en-IN')}</strong>
                </div>
                <p className="milestone-cell-desc">Advance Calendar Lock (Deposited upon booking; non-refundable within 48h of call time)</p>
              </div>

              <div className="contract-milestone-cell">
                <div className="milestone-cell-header">
                  <span className="cell-num">Stage 2 (40%)</span>
                  <strong>₹{contract.financialTerms.wrapEscrow.toLocaleString('en-IN')}</strong>
                </div>
                <p className="milestone-cell-desc">Shoot Wrap Milestone (Released upon completion of principal photography)</p>
              </div>

              <div className="contract-milestone-cell">
                <div className="milestone-cell-header">
                  <span className="cell-num">Stage 3 (30%)</span>
                  <strong>₹{contract.financialTerms.finalEscrow.toLocaleString('en-IN')}</strong>
                </div>
                <p className="milestone-cell-desc">Final Deliverables Clearance (Released upon master video/photo delivery and approval)</p>
              </div>
            </div>
          </div>

          {/* Standard Production Legal Clauses */}
          <div className="contract-section-box">
            <h4 className="contract-section-title">3. Standard Production Clauses & Intellectual Property</h4>
            <div className="contract-clauses-list">
              {contract.termsAndClauses.map((c) => (
                <div key={c.id} className="contract-clause-block">
                  <h5 className="clause-title">{c.title}</h5>
                  <p className="clause-content">{c.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Signatures Execution Block */}
          <div className="contract-section-box contract-signatures-section">
            <h4 className="contract-section-title">4. Digital Signatures & Execution</h4>
            <div className="signatures-grid">
              
              {/* Client Signature Card */}
              <div className="sig-card">
                <span className="sig-role">FOR CLIENT:</span>
                {contract.signatures.clientSigned ? (
                  <div className="signed-box">
                    <div className="signature-cursive">{contract.signatures.clientSignature}</div>
                    <div className="sig-meta">
                      <CheckCircle2 size={14} color="#3fb668" />
                      <span>Digitally Authenticated: {contract.signatures.clientSignedAt}</span>
                    </div>
                  </div>
                ) : (
                  <div className="pending-sig-box">
                    <Clock size={16} color="var(--text-muted)" />
                    <span>Awaiting Client Signature</span>
                  </div>
                )}
                <div className="sig-signer-name">{contract.client.name}</div>
              </div>

              {/* Creator Signature Card */}
              <div className="sig-card">
                <span className="sig-role">FOR CREATIVE SPECIALIST:</span>
                {contract.signatures.proSigned ? (
                  <div className="signed-box">
                    <div className="signature-cursive">{contract.signatures.proSignature}</div>
                    <div className="sig-meta">
                      <CheckCircle2 size={14} color="#3fb668" />
                      <span>Digitally Authenticated: {contract.signatures.proSignedAt}</span>
                    </div>
                  </div>
                ) : (
                  <div className="pending-sig-box">
                    <Clock size={16} color="var(--text-muted)" />
                    <span>Awaiting Specialist Signature</span>
                  </div>
                )}
                <div className="sig-signer-name">{contract.creator.name}</div>
              </div>
            </div>
          </div>

          {/* Watermark Footer */}
          <div className="contract-doc-footer">
            <p>Verified by Camqrew Escrow Infrastructure • Document Hash: <code>{contract.contractId}-SEC-SHA256</code></p>
          </div>
        </div>

        {/* Digital Signature Action Card (hidden during print) */}
        {!alreadySigned && (isClient || isPro) && !signingSuccess && (
          <div className="contract-signing-action-box no-print">
            <div className="signing-header">
              <PenTool size={18} color="var(--accent)" />
              <div>
                <h4>Sign this Production Agreement</h4>
                <p>Type your full legal name below to attach your legally binding electronic signature.</p>
              </div>
            </div>

            {signingError && (
              <div className="alert-box error" style={{ margin: '10px 0' }}>
                <AlertCircle size={15} /> {signingError}
              </div>
            )}

            <form onSubmit={handleSign} className="signing-form">
              <input 
                type="text" 
                className="input-field signing-input"
                placeholder={`Type full legal name (e.g. ${isPro ? contract.creator.name : contract.client.name})`}
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                disabled={signing}
                required
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={signing || !signatureName.trim()}
              >
                {signing ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Sign Agreement ✓'}
              </button>
            </form>
          </div>
        )}

        {signingSuccess && (
          <div className="contract-signing-action-box success no-print">
            <CheckCircle2 size={22} color="#3fb668" />
            <div>
              <h4 style={{ color: '#3fb668', margin: 0 }}>Contract Successfully Signed!</h4>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                Your electronic signature has been permanently recorded and timestamped.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShootContractModal;
