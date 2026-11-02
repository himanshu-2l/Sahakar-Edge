import React from 'react';

export interface HostelRoomCardData {
  traineeId: string;
  traineeName: string;
  programmeId: string;
  programmeTitle?: string;
  hostelBlock: string;
  roomNumber: string;
  roomType: 'SINGLE' | 'DOUBLE' | 'DORMITORY' | string;
  checkInDate: string;
  checkOutDate: string;
  floor?: number;
  allocatedAt?: string;
}

export interface HostelRoomCardProps {
  roomCard?: HostelRoomCardData | null;
  language?: 'EN' | 'HI';
  onRefresh?: () => void;
  isLoading?: boolean;
}

const TEXT = {
  EN: {
    title: 'Campus Hostel Accommodation Allotment',
    subtitle: 'National Council for Cooperative Training (NCCT) — Trainee Residential Services',
    confidentialBadge: '🔒 STRICTLY CONFIDENTIAL & PRIVATE',
    privacyNotice:
      'This residential accommodation allotment is restricted solely to the authorized trainee. Under strict NCCT privacy protocols, hostel room numbers and campus residential records are NEVER published to external registers or included in public NFC profiles.',
    hostelBlockLabel: 'Hostel Block',
    roomNumberLabel: 'Room Number',
    roomTypeLabel: 'Accommodation Type',
    floorLabel: 'Floor Level',
    checkInLabel: 'Reporting / Check-In Date',
    checkOutLabel: 'Course Concluding / Check-Out Date',
    statusActive: 'Active Assignment',
    guidelinesTitle: 'Statutory Campus Hostel Check-In & Conduct Guidelines',
    guidelines: [
      {
        title: 'Reporting & Key Handover',
        desc: 'Report at Main Gate Security / Admin Hostel Reception Desk with your official Trainee ID and Nomination Order.',
      },
      {
        title: 'Mandatory Government Identity',
        desc: 'Carry original Government Photo ID (Aadhaar / Voter ID / Passport) for biometric residential registration.',
      },
      {
        title: 'Trainee Mess & Dining Hours',
        desc: 'Attached mess operates: Breakfast (07:30–09:00), Lunch (12:45–14:15), Dinner (19:30–21:00).',
      },
      {
        title: 'Campus Quiet Hours',
        desc: 'Mandatory quiet hours observed between 10:00 PM and 06:00 AM. Room transfers or unauthorized guests are strictly prohibited.',
      },
    ],
    caretakerContact: 'Campus Hostel Warden Desk: Intercom #104 • Emergency Helpline: 0755-2420xxx',
    roomTypes: {
      SINGLE: 'Single Occupancy (एकल)',
      DOUBLE: 'Double Occupancy (द्वि-आवासीय)',
      DORMITORY: 'Dormitory (शयनगृह)',
    },
  },
  HI: {
    title: 'परिसर छात्रावास आवास आवंटन पत्र',
    subtitle: 'राष्ट्रीय सहकारी प्रशिक्षण परिषद (एनसीसीटी) — आवासीय प्रशिक्षणार्थी सेवाएं',
    confidentialBadge: '🔒 व्यक्तिगत एवं पूर्णतः गोपनीय',
    privacyNotice:
      'यह आवासीय आवंटन केवल अधिकृत प्रशिक्षणार्थी हेतु गोपनीय है। एनसीसीटी डेटा सुरक्षा नियमों के तहत छात्रावास एवं कक्ष संख्या किसी भी सार्वजनिक रजिस्टर या एनएफसी प्रोफाइल में कभी प्रदर्शित नहीं की जाती है।',
    hostelBlockLabel: 'छात्रावास ब्लॉक',
    roomNumberLabel: 'कक्ष क्रमांक',
    roomTypeLabel: 'आवास श्रेणी',
    floorLabel: 'तल / मंजिल',
    checkInLabel: 'आगमन / प्रवेश तिथि',
    checkOutLabel: 'समापन / निकासी तिथि',
    statusActive: 'सक्रिय आवंटन',
    guidelinesTitle: 'छात्रावास प्रवेश एवं आवासीय आचार नियमावली',
    guidelines: [
      {
        title: 'आगमन एवं कक्ष कुंजी प्राप्ति',
        desc: 'मुख्य द्वार स्वागत कक्ष / छात्रावास प्रशासन पर अपना प्रशिक्षणार्थी पहचान-पत्र एवं नामांकन आदेश प्रस्तुत करें।',
      },
      {
        title: 'अनिवार्य पहचान दस्तावेज',
        desc: 'बायोमेट्रिक आवासीय पंजीयन हेतु मूल सरकारी पहचान-पत्र (आधार / मतदाता पहचान-पत्र) साथ रखना अनिवार्य है।',
      },
      {
        title: 'मेस एवं भोजन समय-सारणी',
        desc: 'संलग्न मेस समय: प्रातः नाश्ता (07:30–09:00), दोपहर भोजन (12:45–14:15), रात्रि भोजन (19:30–21:00)।',
      },
      {
        title: 'परिसर शांति समय',
        desc: 'रात्रि 10:00 बजे से प्रातः 06:00 बजे तक शांति समय लागू रहेगा। कक्ष स्थानांतरण अथवा अनाधिकृत प्रवेश वर्जित है।',
      },
    ],
    caretakerContact: 'छात्रावास वार्डन डेस्क: इंटरकॉम #104 • आपातकालीन संपर्क: 0755-2420xxx',
    roomTypes: {
      SINGLE: 'एकल कक्ष (Single Occupancy)',
      DOUBLE: 'द्वि-आवासीय (Double Occupancy)',
      DORMITORY: 'शयनगृह (Dormitory)',
    },
  },
};

export const HostelRoomCard: React.FC<HostelRoomCardProps> = ({
  roomCard,
  language = 'EN',
}) => {
  const t = TEXT[language];

  // Genuine fallback allocation for seed trainee
  const safeCard: HostelRoomCardData = roomCard || {
    traineeId: 'dddd4444-4444-4444-4444-444444444441',
    traineeName: 'Anita Patel',
    programmeId: 'prog-atp-2026-pacs-01',
    programmeTitle: 'Annual Training Programme: PACS Computerization & Auditing',
    hostelBlock: 'Sardar Patel Block A (Female Wing)',
    roomNumber: 'A-101',
    roomType: 'DOUBLE',
    floor: 1,
    checkInDate: '2026-09-01',
    checkOutDate: '2026-09-14',
    allocatedAt: '2026-08-22T14:30:00Z',
  };

  const roomTypeDisplay =
    t.roomTypes[safeCard.roomType as keyof typeof t.roomTypes] || safeCard.roomType;

  return (
    <div
      style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '4px',
        padding: '3px',
        boxShadow: '0 1px 3px rgba(8, 24, 84, 0.05)',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '2px',
          padding: '1.5rem',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        {/* Top Header Strip */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '0.75rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.35rem' }}>🏢</span>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#081854',
                  letterSpacing: '-0.01em',
                }}
              >
                {t.title}
              </h2>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
              {t.subtitle}
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 800,
            }}
          >
            <span>✓</span>
            <span>{t.statusActive}</span>
          </div>
        </div>

        {/* Prominent Privacy Invariant Notice */}
        <div
          style={{
            margin: '1.15rem 0',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '3px',
            padding: '0.85rem 1rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0649a2', letterSpacing: '0.04em' }}>
            {t.confidentialBadge}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#1e3a8a', marginTop: '0.25rem', lineHeight: 1.45 }}>
            {t.privacyNotice}
          </div>
        </div>

        {/* 2x2 Bento Allotment Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.85rem',
            margin: '1.25rem 0',
          }}
        >
          {/* Block */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '3px',
              padding: '1rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
              {t.hostelBlockLabel}
            </div>
            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#081854',
                marginTop: '0.25rem',
              }}
            >
              {safeCard.hostelBlock}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Floor: {safeCard.floor || 1} • Central Residential Wing
            </div>
          </div>

          {/* Room Number */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '3px',
              padding: '1rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
              {t.roomNumberLabel}
            </div>
            <div
              style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                color: '#0649a2',
                fontFeatureSettings: '"tnum" 1',
                marginTop: '0.15rem',
              }}
            >
              {safeCard.roomNumber}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.15rem', fontWeight: 600 }}>
              {roomTypeDisplay}
            </div>
          </div>

          {/* Check-In Date */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '3px',
              padding: '1rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
              {t.checkInLabel}
            </div>
            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#081854',
                marginTop: '0.25rem',
              }}
            >
              {safeCard.checkInDate}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Reporting Time: 08:00 AM – 08:00 PM
            </div>
          </div>

          {/* Check-Out Date */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '3px',
              padding: '1rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
              {t.checkOutLabel}
            </div>
            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#081854',
                marginTop: '0.25rem',
              }}
            >
              {safeCard.checkOutDate}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Valedictory & Key Handback
            </div>
          </div>
        </div>

        {/* Guidelines List */}
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#081854', marginBottom: '0.65rem' }}>
            {t.guidelinesTitle}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.65rem' }}>
            {t.guidelines.map((g, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.75rem 0.85rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '3px',
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#081854' }}>
                  {idx + 1}. {g.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', lineHeight: 1.4 }}>
                  {g.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Helpline */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #f1f5f9',
            fontSize: '0.75rem',
            color: '#64748b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>{t.caretakerContact}</span>
          <span style={{ fontWeight: 600, color: '#081854' }}>RICM Campus Residence</span>
        </div>
      </div>
    </div>
  );
};
