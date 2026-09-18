import type { Booking } from '../types/booking';

export interface ProductionContract {
  contractId: string;
  effectiveDate: string;
  governingLaw: string;
  client: {
    name: string;
    id: string;
    location?: string;
  };
  creator: {
    name: string;
    id: string;
    title?: string;
  };
  shootSchedule: {
    startDate: string;
    endDate: string;
    daysCount: number;
    hours: string;
    venueAddress: string;
  };
  financialTerms: {
    totalFee: number;
    advanceEscrow: number;
    wrapEscrow: number;
    finalEscrow: number;
    platformEscrowFee: number;
  };
  deliverables: {
    summary: string;
    turnaroundDays: number;
    revisionsIncluded: number;
    deliveryMethod: string;
  };
  termsAndClauses: {
    id: string;
    title: string;
    content: string;
  }[];
  signatures: {
    clientSigned: boolean;
    clientSignature?: string;
    clientSignedAt?: string;
    proSigned: boolean;
    proSignature?: string;
    proSignedAt?: string;
  };
  status: 'draft' | 'client_signed' | 'pro_signed' | 'fully_executed';
}

export function generateProductionContract(booking: Booking): ProductionContract {
  const contractId = `CC-CTR-${(booking.id || '00000000').slice(0, 8).toUpperCase()}`;
  const total = booking.totalAmount || 15000;
  const advance = Math.round(total * 0.3);
  const wrap = Math.round(total * 0.4);
  const final = total - advance - wrap;

  const rawClientSig = booking.contractSignature || '';
  const isClientSigned = Boolean(rawClientSig);
  const clientSignedAt = booking.contractSignedAt || (isClientSigned ? booking.createdAt : undefined);

  // Check if items has professional signature if any
  const proSignature = (booking as any).items?.proSignature || (booking as any).proSignature || '';
  const isProSigned = Boolean(proSignature);
  const proSignedAt = (booking as any).items?.proSignedAt || (booking as any).proSignedAt || undefined;

  let status: 'draft' | 'client_signed' | 'pro_signed' | 'fully_executed' = 'draft';
  if (isClientSigned && isProSigned) {
    status = 'fully_executed';
  } else if (isClientSigned) {
    status = 'client_signed';
  } else if (isProSigned) {
    status = 'pro_signed';
  }

  const clauses = [
    {
      id: 'clause-1',
      title: '1. Production Scope & Standard of Care',
      content: `The Specialist agrees to provide professional cinematography, photography, or crew production services for "${booking.serviceTitle}". All equipment deployed shall be industry-standard, professional-grade gear in verified working condition.`
    },
    {
      id: 'clause-2',
      title: '2. 3-Stage Milestone Escrow Protection',
      content: `In accordance with the Camcrew Escrow Framework: (a) Advance Escrow (30%) is held upon booking to guarantee calendar dates; (b) Shoot Wrap Escrow (40%) is deposited before or upon completion of principal photography; (c) Final Delivery Escrow (30%) is released upon delivery of agreed high-resolution master deliverables. Under no circumstances will funds be released without verified milestones.`
    },
    {
      id: 'clause-3',
      title: '3. Deliverables & Revision Rounds',
      content: `Master footage and edits will be delivered within 7-14 business days following shoot wrap via Camcrew Cloud Drive or high-speed transfer link. The Client is entitled to two (2) complimentary rounds of minor post-production revisions. Additional revisions or creative re-edits outside initial specifications shall be billed at the Creator's standard hourly rate.`
    },
    {
      id: 'clause-4',
      title: '4. Copyright, Licensing & Intellectual Property',
      content: `The Specialist retains original authorship and RAW footage copyright until 100% full final escrow payment has been released. Upon full payment clearance, the Client is automatically granted an exclusive, worldwide, perpetual commercial license to use, publish, broadcast, and distribute the final master deliverables. The Specialist retains the non-exclusive right to showcase excerpts in their professional showreels and portfolio.`
    },
    {
      id: 'clause-5',
      title: '5. Cancellation, Postponement & Weather Policy',
      content: `Cancellations >7 days before scheduled call time receive a 90% refund of advance funds. Cancellations 48 hours to 7 days receive a 50% refund. Cancellations under 48 hours forfeit the 30% advance escrow to compensate the Creator for lost shooting dates. In the event of extreme weather or certified Force Majeure, parties agree to reschedule to the next mutually agreeable date without penalty.`
    },
    {
      id: 'clause-6',
      title: '6. Governing Law & Dispute Arbitration',
      content: `This Agreement is governed by the laws of India (Indian Contract Act, 1872 & Information Technology Act, 2000). Any irreconcilable dispute arising hereunder shall be submitted to binding online arbitration through the Camcrew Dispute Resolution Board.`
    }
  ];

  return {
    contractId,
    effectiveDate: booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-IN'),
    governingLaw: 'Indian Contract Act 1872 & Information Technology Act 2000',
    client: {
      name: booking.customerName || 'Client / Production Producer',
      id: booking.customerId,
      location: booking.location,
    },
    creator: {
      name: booking.professionalName || 'Creative Specialist',
      id: booking.professionalId || '',
      title: booking.professionalTitle || 'Verified Production Specialist',
    },
    shootSchedule: {
      startDate: booking.startDate,
      endDate: booking.endDate || booking.startDate,
      daysCount: booking.daysCount || 1,
      hours: booking.startTime ? `${booking.startTime} to ${booking.endTime || 'Wrap'}` : 'Full Day Production Call (up to 8 Hours)',
      venueAddress: booking.location || 'Location designated by Client',
    },
    financialTerms: {
      totalFee: total,
      advanceEscrow: advance,
      wrapEscrow: wrap,
      finalEscrow: final,
      platformEscrowFee: 0,
    },
    deliverables: {
      summary: booking.notes || 'Full high-definition master edits, color-graded footage, and primary deliverables as specified.',
      turnaroundDays: 10,
      revisionsIncluded: 2,
      deliveryMethod: 'Camcrew Cloud / High-Resolution Master Link',
    },
    termsAndClauses: clauses,
    signatures: {
      clientSigned: isClientSigned,
      clientSignature: rawClientSig,
      clientSignedAt: clientSignedAt ? new Date(clientSignedAt).toLocaleString('en-IN') : undefined,
      proSigned: isProSigned,
      proSignature,
      proSignedAt: proSignedAt ? new Date(proSignedAt).toLocaleString('en-IN') : undefined,
    },
    status,
  };
}

export function formatContractAsPlainText(contract: ProductionContract): string {
  return `=================================================================
CAMCREW PRODUCTION SERVICE AGREEMENT
Contract Ref: ${contract.contractId}
Date: ${contract.effectiveDate}
=================================================================

PARTIES:
• CLIENT: ${contract.client.name} (ID: ${contract.client.id})
• CREATIVE SPECIALIST: ${contract.creator.name} (${contract.creator.title})

SHOOT SCHEDULE & VENUE:
• Dates: ${contract.shootSchedule.startDate} to ${contract.shootSchedule.endDate} (${contract.shootSchedule.daysCount} Day/s)
• Timings: ${contract.shootSchedule.hours}
• Venue: ${contract.shootSchedule.venueAddress}

FINANCIAL ESCROW CONSIDERATION:
• Total Contract Value: ₹${contract.financialTerms.totalFee.toLocaleString('en-IN')}
• 30% Advance Escrow: ₹${contract.financialTerms.advanceEscrow.toLocaleString('en-IN')}
• 40% Shoot Wrap Escrow: ₹${contract.financialTerms.wrapEscrow.toLocaleString('en-IN')}
• 30% Final Delivery Escrow: ₹${contract.financialTerms.finalEscrow.toLocaleString('en-IN')}

TERMS & LEGAL CLAUSES:
${contract.termsAndClauses.map(c => `\n[${c.title}]\n${c.content}`).join('\n')}

SIGNATURE STATUS:
• Client Signature: ${contract.signatures.clientSigned ? `✓ SIGNED by ${contract.signatures.clientSignature} on ${contract.signatures.clientSignedAt}` : '⏳ PENDING SIGNATURE'}
• Specialist Signature: ${contract.signatures.proSigned ? `✓ SIGNED by ${contract.signatures.proSignature} on ${contract.signatures.proSignedAt}` : '⏳ PENDING SIGNATURE'}

Executed under the Indian Information Technology Act 2000.
=================================================================`;
}
